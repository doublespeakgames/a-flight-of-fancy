// @flow
/**
 * Move Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles movement between rooms
 */

import type { Session, SessionDiff } from '../model/session';
import type { RootActionHandler, Response } from '../action-resolver';

const move:RootActionHandler = (session, world, subject) => {
  const room = world.rooms[session.room];
  const dir = subject == null ? 'null' : subject.toLowerCase();
  const nextRoom = room.exits[dir];
  if (!nextRoom) {
    return {
      message: `You can't go that way.`
    };
  }
  return {
    message: `You go ${dir}. ${world.rooms[nextRoom].description}`,
    update: { room: nextRoom }
  };
};

export default move;