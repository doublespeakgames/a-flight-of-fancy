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
import { lookAt } from '../model/room';
import { resolve } from '../value';
import { getExitText } from '../action/exits';

const move:ActionHandler = (session, world, sentence) => {
  const room = world.rooms[session.room];
  const exits = resolve(room.exits, session);

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
  const leave = {
    message: room.leaveMessage ? room.leaveMessage(nextRoomId, dir) : `You go ${dir}.`,
    update: { room: nextRoomId }
  };
  const arrive = lookAt(world);

  return [ leave, arrive ];
};

export default move;