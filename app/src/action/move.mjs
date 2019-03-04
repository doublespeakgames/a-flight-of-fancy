// @flow
/**
 * Move Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Moves between rooms
 */

import type { Session, SessionDiff } from '../model/session';
import type { ActionHandler, ActionResult } from '../action-resolver';
import { getExitText } from './exits';
import { setAdd } from '../immutable';
import { lookAt } from '../model/room';
import { resolve } from '../value';

const move:ActionHandler = (session, world, subject) => {
  const room = world.rooms[session.room];
  const exits = resolve(session, room.exits);

  let dir = subject;
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
    return {
      message: getExitText(session, room)
    };
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

  const update:SessionDiff = {
    room: nextRoomId,
    seen: setAdd(session.seen, nextRoomId)
  };

  return {
    message: `${leaveMessage} ${roomResult.message} ${exitText}`,
    update: Object.assign(update, roomResult.update)
  };
};

export default move;