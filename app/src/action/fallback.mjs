// @flow
/**
 * Fallback Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles unhandled stuff
 */

import type { Session, SessionDiff } from '../model/session';
import type { Action, ActionHandler, ActionResult } from '../action-resolver';

function getMessage(tries:number):string {
  if (tries >= 2) {
    return 'Try simple sentences with verbs like move, take, look, talk, and use.'
  }
  if (tries >= 1) {
    return `I don't understand that`;
  }
  return `You can't do that`;
}

const fallback:ActionHandler = (session, world, subject) => {

  const phrases = world.rooms[session.room].phrases;
  if (phrases) {
    for (let phrase of phrases) {
      // subject is the raw instruction, in this handler
      if (!phrase.keys.includes(subject)) {
        continue;
      }
      const i = phrase.action.split(' ');
      return {
        sessionId: session._id,
        type: i[0],
        subject: i[1],
        object: i[2]
      };
    }
  }

  return { 
    message: getMessage(session.failures),
    update: { failures: Math.min(session.failures + 1, 2) }
  };
};

export default fallback;