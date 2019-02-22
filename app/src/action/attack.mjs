// @flow
/**
 * Attack Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles fighting with actors
 */

import type { Session } from '../model/session';
import type { ActionHandler, ActionResult } from '../action-resolver';

const attack:ActionHandler = (session, world, target = 'foo') => {
  return {
    message: `You're too scared of ${target}`
  };
};

export default attack;