// @flow
/**
 * Google Endpoint
 * @author mtownsend
 * @since Feb 2019
 * 
 * Communicates with Google DialogFlow
 */

import Actions from 'actions-on-google';
import { resolve } from '../action-resolver';
import uuid from 'uuid/v1';

import type { Conversation } from 'actions-on-google';
import type { Action, ActionType } from '../action-resolver';

const CONFIDENCE_THRESHOLD = 0.6;

const app = Actions.dialogflow();

function getUserId(conv:Conversation):string {
  if (!('userId' in conv.user.storage)) {
    conv.user.storage.userId = uuid();
  }
  return conv.user.storage.userId;
}

async function fulfill(actionType:ActionType, conv:Conversation, params:{[string]:string}) {  

  const confidence = conv.body.queryResult.intentDetectionConfidence;

  const action:Action = {
    sessionId: `goog-${getUserId(conv)}`,
    type: confidence >= CONFIDENCE_THRESHOLD ? actionType : 'fallback',
    subject: params['subject'],
    object: params['object']
  };
  const result = await resolve(action);
  if (result.close) {
    conv.close(result.message);
  }
  else {
    conv.ask(result.message);
  }
}

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
app.intent('Consume', fulfill.bind(null, 'eat'));
app.intent('Open', fulfill.bind(null, 'open'));
app.intent('Close', fulfill.bind(null, 'close'));
app.intent('Give', fulfill.bind(null, 'give'));

export default app;
