// @flow
/**
 * Fallback Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles unhandled stuff
 */

import Config from '../config';
import type { Session } from '../model/session';
import type { Action, ActionHandler, ActionResult } from '../action-resolver';

function getMessage(phrase:string, tries:number):string {
  if (tries >= 2) {
    return 'Try simple sentences with verbs like move, take, look, talk, and use.'
  }
  if (tries >= 1) {
    return `I don't understand "${phrase}"`;
  }
  return `You can't "${phrase}"`;
}

const fallback:ActionHandler = (session, world, sentence) => {

  const phrases = world.rooms[session.room].phrases;
  if (phrases) {
    for (let phrase of phrases) {
      // subject is the raw instruction, in this handler
      if (!phrase.keys.includes(sentence.subject)) {
        continue;
      }
      const i = phrase.action.split(':');
      return {
        sessionId: session._id,
        type: i[0],
        sentence: {
          subject: i[1],
          object: i[2]
        }
      };
    }
  }

  return { 
    message: getMessage(sentence.subject || 'do nothing', session.failures),
    update: session => ({ ...session, failures: Math.min(session.failures + 1, 2) })
  };
};

export default fallback;