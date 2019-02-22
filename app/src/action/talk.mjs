// @flow
/**
 * Talk Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles speaking with actors
 */

import type { Session } from '../model/session';
import type { ActionHandler, ActionResult } from '../action-resolver';

const talk:ActionHandler = (session, world, subject = 'foo') => {
  return {
    message: `${subject} ignores you. What a jerk.`
  };
};

export default talk;