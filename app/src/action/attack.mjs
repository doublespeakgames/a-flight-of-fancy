// @flow
/**
 * Attack Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles fighting with actors
 */

import type { Session } from '../model/session';
import type { RootActionHandler, Response } from '../action-resolver';

const attack:RootActionHandler = (session, world, target = 'foo') => {
  return {
    message: `You're too scared of ${target}`
  };
};

export default attack;