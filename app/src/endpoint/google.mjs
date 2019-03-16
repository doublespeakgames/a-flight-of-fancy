// @flow
/**
 * Google Endpoint
 * @author mtownsend
 * @since Feb 2019
 * 
 * Communicates with Google DialogFlow
 */

import Actions from 'actions-on-google';
import { resolveAction, makeSentence } from '../action-resolver';
import uuid from 'uuid/v1';
import { text } from '../model/mixins';
import ssml from '../util/ssml';
import { resolve } from '../value';

import type { Conversation } from 'actions-on-google';
import type { Sentence, Action, ActionType } from '../action-resolver';

const CONFIDENCE_THRESHOLD = 0.6;
const LAST_RESPONSE = 'last-response';

const app = Actions.dialogflow();

function getUserId(conv:Conversation):string {
  if (!('userId' in conv.user.storage)) {
    conv.user.storage.userId = uuid();
  }
  return conv.user.storage.userId;
}

function idleHandler(session, world) {
  return {
    message: ssml(`I'll wait.`)
              .audio(resolve(world.sounds.google.idle, session))
              .build()
  };
}

async function fulfill(actionType:ActionType, conv:Conversation, params:{[string]:string}) {  

  const confidence = conv.body.queryResult.intentDetectionConfidence;
  const queryText = conv.body.queryResult.queryText;
  const isFallback = actionType === 'fallback' || confidence < CONFIDENCE_THRESHOLD;
  const sentence = makeSentence(!isFallback ? params.subject : queryText, params.object, params.verb);

  const action:Action = {
    sessionId: `goog-${getUserId(conv)}`,
    type: !isFallback ? actionType : 'fallback',
    sentence
  };
  const result = await resolveAction(action, idleHandler);
  conv.contexts.set(LAST_RESPONSE, 1, { message: result.message });
  if (result.close) {
    conv.close(result.message);
  }
  else {
    conv.ask(result.message);
  }
}

app.intent('Idle', fulfill.bind(null, 'idle'));
app.intent('Fallback', fulfill.bind(null, 'fallback'));
app.intent('Welcome', fulfill.bind(null, 'look'));
app.intent('Restart', fulfill.bind(null, 'restart'));
app.intent('Move', fulfill.bind(null, 'move'));
app.intent('Object Travel', fulfill.bind(null, 'object-travel'));
app.intent('Take', fulfill.bind(null, 'take'));
app.intent('Attack', fulfill.bind(null, 'attack'));
app.intent('Talk', fulfill.bind(null, 'talk'));
app.intent('Look', fulfill.bind(null, 'look'));
app.intent('Use', fulfill.bind(null, 'use'));
app.intent('Inventory', fulfill.bind(null, 'inventory'));
app.intent('Exits', fulfill.bind(null, 'exits'));
app.intent('Consume', fulfill.bind(null, 'eat'));
app.intent('Open', fulfill.bind(null, 'open'));
app.intent('Close', fulfill.bind(null, 'close'));
app.intent('Give', fulfill.bind(null, 'give'));
app.intent('Tie', fulfill.bind(null, 'tie'));
app.intent('Untie', fulfill.bind(null, 'untie'));
app.intent('Light', fulfill.bind(null, 'light'));

export default app;
