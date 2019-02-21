// @flow
/**
 * Look Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles looking at stuff
 */

import type { Session } from '../model/session';
import type { RootActionHandler, Response } from '../action-resolver';
import { findInRoom } from '../model/thing';

const look:RootActionHandler = (session, world, subject) => {
  if (!subject) {
    // Just look at the current room
    return {
      message: world.rooms[session.room].description
    };
  }

  const thing = findInRoom(world.rooms[session.room], subject);
  if (!thing) {
    return {
      message: `There is no ${subject} here.`
    };
  }

  return {
    message: thing.description
  };

};

export default look;