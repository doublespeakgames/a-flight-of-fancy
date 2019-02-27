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
import { describe } from '../model/room';
import { resolve } from '../value';

const move:ActionHandler = (session, world, subject) => {
  const room = world.rooms[session.room];
  const dir = subject == null ? 'null' : subject.toLowerCase();
  const nextRoomId = resolve(session, room.exits)[dir];
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
  const desc = describe(session, world, nextRoom, session.seen.has(nextRoomId));
  const exitText = session.seen.has(nextRoomId) ? getExitText(session, nextRoom) : '';

  const response:ActionResult = {
    message: `You go ${dir}. ${desc} ${exitText}`,
    update: { 
      room: nextRoomId,
      seen: setAdd(session.seen, nextRoomId)
    }
  };

  const entryEffect = nextRoom.entryEffect ? nextRoom.entryEffect(session, world) : null;
  if (entryEffect) {
    response.message = `${response.message} ${entryEffect.message}`;
    response.update = Object.assign({}, response.update, entryEffect.update);
  }

  return response;
};

export default move;