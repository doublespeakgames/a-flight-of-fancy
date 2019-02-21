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
import type { RootActionHandler, Response } from '../action-resolver';

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

  return {
    message: `The ${subject} doesn't want to be picked up!`
  };
};

export default take;