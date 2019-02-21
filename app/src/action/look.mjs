// @flow
/**
 * Look Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles looking at stuff
 */

import type { Session } from '../model/session';
import type { ActionHandler, Response } from '../action-resolver';

const look:ActionHandler = (session, world, _) => {
  return {
    message: world.rooms[session.room].description
  };
};

export default look;