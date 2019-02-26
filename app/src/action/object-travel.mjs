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

const objectTravel:ActionHandler = (session, world, subject) => {
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

  if (thing.exit) {
    return move(session, world, thing.exit);
  }

  return {
    message: `You can't do that.`
  };
};

export default objectTravel;