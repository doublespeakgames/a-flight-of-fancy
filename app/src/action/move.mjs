// @flow
/**
 * Move Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Moves between rooms
 */

import type { Session } from '../model/session';
import type { ActionHandler, ActionResult } from '../action-resolver';
import { getExitText } from './exits';
import { setAdd } from '../util/immutable';
import { lookAt } from '../model/room';
import { resolve } from '../value';
import { compose } from '../util/updater';

const move:ActionHandler = (session, world, sentence) => {
  const room = world.rooms[session.room];
  const exits = resolve(session, room.exits);

  let dir = sentence.subject;
  if (!dir) {
    const dirs = Object.keys(exits);
    if (dirs.length === 1) {
      dir = dirs[0];
    }
    else {
      return { message: getExitText(session, room) };
    }
  }

  const nextRoomId = exits[dir];
  if (!nextRoomId) {
    return { message: `You can't go ${dir}. ${getExitText(session, room)}` };
  }

  const locks = room.locks;
  if (locks && locks[dir]) {
    const lock = locks[dir](session);
    if (lock) {
      return {
        message: lock
      };
    }
  }
  const nextRoom = world.rooms[nextRoomId];
  const roomResult = lookAt(session, world, nextRoomId, session.seen.has(nextRoomId));
  const exitText = session.seen.has(nextRoomId) ? getExitText(session, nextRoom) : '';
  const leaveMessage = room.leaveMessage ? room.leaveMessage(nextRoomId, dir) : `You go ${dir}.`;

  const update = session => ({
    ...session,
    room: nextRoomId,
    seen: setAdd(session.seen, nextRoomId)
  });

  return {
    message: `${leaveMessage} ${roomResult.message} ${exitText}`,
    update: compose(update, roomResult.update)
  };
};

export default move;