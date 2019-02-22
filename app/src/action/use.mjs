// @flow
/**
 * Use Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles the using of stuff, sometimes with other stuff
 */

import type { Session } from '../model/session';
import { findInRoom } from '../model/thing';
import type { ActionHandler, ActionResult } from '../action-resolver';

const use:ActionHandler = (session, world, subject, object) => {
  if (!subject) {
    return {
      message: `Use what?`
    };
  }

  const subjectThing = findInRoom(world.rooms[session.room], subject);
  if (!subjectThing) {
    return {
      message: `There is no ${subject} here.`
    };
  }

  if (!object) {
    return {
      message: `You can't use the ${subject}`
    };
  }

  const objectThing = findInRoom(world.rooms[session.room], object);
  if (!objectThing) {
    return {
      message: `There is no ${object} here.`
    };
  }

  return {
    message: `Those things don't work together.`
  };

};

export default use;