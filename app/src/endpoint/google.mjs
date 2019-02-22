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

const app = Actions.dialogflow();

function getUserId(conv:Conversation):string {
  if (!('userId' in conv.user.storage)) {
    conv.user.storage.userId = uuid();
  }
  return conv.user.storage.userId;
}

async function fulfill(actionType:ActionType, conv:Conversation, params:{[string]:string}) {
  const action:Action = {
    sessionId: `goog-${getUserId(conv)}`,
    type: actionType,
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

app.intent('Default Welcome Intent', fulfill.bind(null, 'look'));
app.intent('Restart', fulfill.bind(null, 'restart'));
app.intent('Move', fulfill.bind(null, 'move'));
app.intent('Object Travel', fulfill.bind(null, 'object-travel'));
app.intent('Take', fulfill.bind(null, 'take'));
app.intent('Attack', fulfill.bind(null, 'attack'));
app.intent('Talk', fulfill.bind(null, 'talk'));
app.intent('Look', fulfill.bind(null, 'look'));
app.intent('Use', fulfill.bind(null, 'use'));
app.intent('Inventory', fulfill.bind(null, 'inventory'));

export default app;
