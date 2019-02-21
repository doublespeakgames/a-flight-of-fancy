// @flow
/**
 * Take Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles the taking of items
 */

import type { Session } from '../model/session';
import type { ActionHandler, Response } from '../action-resolver';

const take:ActionHandler = (session, world, subject = 'foo') => {
  return {
    message: `${subject} darts out of your grasp. What?`
  };
};

export default take;