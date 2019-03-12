// @flow
/**
 * Object Travel Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Moves in a direction, referenced by an object
 */

import type { Session } from '../model/session';
import type { ActionHandler, ActionResult } from '../action-resolver';
import { fromRoom } from '../model/thing';
import move from './move';

const objectTravel:ActionHandler = (session, world, { subject }) => {
  if (!subject) {
    return {
      message: `Go where?`
    };
  }

  const thing = fromRoom(session, world.rooms[session.room], subject);
  if (!thing) {
    return {
      message: `There is no ${subject} here.`
    };
  }

  // TODO: It'd be cool to port all of object-travel to the interact handler
  // Do this, just for now
  if (thing.verbs && typeof thing.verbs.move === 'string') {
    return { message: thing.verbs.move };
  }

  if (thing.exit) {
    return move(session, world, { subject: thing.exit });
  }

  return {
    message: `You're close enough to the ${subject}.`
  };
};

export default objectTravel;