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
import { add } from '../immutable-set';

const move:ActionHandler = (session, world, subject) => {
  const room = world.rooms[session.room];
  const dir = subject == null ? 'null' : subject.toLowerCase();
  const exits = typeof room.exits === 'function' ? room.exits(session) : room.exits;
  const nextRoomId = exits[dir];
  if (!nextRoomId) {
    return {
      message: `You can't go that way.`
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
  const name = typeof nextRoom.name === 'function' ? nextRoom.name(session) : nextRoom.name;
  const desc = session.seen.has(nextRoomId) 
      ? `You are in ${name}.` 
      : nextRoom.description;
  const exitText = session.seen.has(nextRoomId) ? getExitText(session, nextRoom) : '';
      
  return {
    message: `You go ${dir}. ${typeof desc === 'string' ? desc : desc(session)} ${exitText}`,
    update: { 
      room: nextRoomId,
      seen: add(session.seen, nextRoomId)
    }
  };
};

export default move;