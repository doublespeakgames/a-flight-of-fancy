// @flow
/**
 * Fallback Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles unhandled stuff
 */

import type { Session, SessionDiff } from '../model/session';
import type { ActionHandler, ActionResult } from '../action-resolver';

function getMessage(tries:number):string {
  if (tries >= 3) {
    return 'Try simple sentences with verbs like move, take, look, talk, and use.'
  }
  if (tries >= 2) {
    return `I don't understand that`;
  }
  return `You can't do that`;
}

const fallback:ActionHandler = (session, world, subject) => {
  const tries = isNaN(session.flags.tries) ? 0 : parseInt(session.flags.tries);
  return { 
    message: getMessage(tries),
    update: { flags: { tries: String(Math.min(tries + 1, 3)) } }
  };
};

export default fallback;