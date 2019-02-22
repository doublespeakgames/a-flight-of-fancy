// @flow
/**
 * Take Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles the taking of items
 */

import type { Session } from '../model/session';
import { findInRoom } from '../model/thing';
import type { RootActionHandler, ActionResult } from '../action-resolver';

const take:RootActionHandler = (session, world, subject) => {
  if (!subject) {
    return {
      message: `Take what?`
    };
  }

  const thing = findInRoom(world.rooms[session.room], subject);
  if (!thing) {
    return {
      message: `There is no ${subject} here.`
    };
  }

  if (typeof thing.take === 'string') {
    return {
      message: thing.take
    };
  }

  if (typeof thing.take === 'function') {
    return thing.take(session, world);
  }

  return {
    message: `You can't carry that.`
  };
};

export default take;