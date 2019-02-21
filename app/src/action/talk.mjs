// @flow
/**
 * Talk Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles speaking with actors
 */

import type { Session } from '../model/session';
import type { RootActionHandler, Response } from '../action-resolver';

const talk:RootActionHandler = (session, world, subject = 'foo') => {
  return {
    message: `${subject} ignores you. What a jerk.`
  };
};

export default talk;