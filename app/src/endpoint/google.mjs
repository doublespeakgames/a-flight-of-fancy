// @flow
/**
 * Google Endpoint
 * @author mtownsend
 * @since Feb 2019
 * 
 * Communicates with Google DialogFlow
 */

import Actions from 'actions-on-google';
import Move from '../action/move';
import Take from '../action/take';
import Talk from '../action/talk';
import Attack from '../action/attack';

function fulfill(conv, result) {
  if (result.close) {
    conv.close(result.message);
  }
  else {
    conv.ask(result.message);
  }
}

const app = Actions.dialogflow();
app.intent('Move', (conv, { direction }) => fulfill(conv, Move(direction)));
app.intent('Take', (conv, { item }) => fulfill(conv, Take(item)));
app.intent('Attack', (conv, { actor }) => fulfill(conv, Attack(actor)));
app.intent('Talk', (conv, { actor }) => fulfill(conv, Talk(actor)));

export default app;
