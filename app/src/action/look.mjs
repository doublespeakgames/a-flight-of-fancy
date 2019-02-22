// @flow
/**
 * Look Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles looking at stuff
 */

import type { Session } from '../model/session';
import type { ActionHandler, ActionResult } from '../action-resolver';
import { fromRoom } from '../model/thing';

const look:ActionHandler = (session, world, subject) => {
  if (!subject) {
    // Just look at the current room
    return {
      message: world.rooms[session.room].description
    };
  }

  const thing = fromRoom(world.rooms[session.room], subject);
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