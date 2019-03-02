// @flow

import type { ActionHandler, ActionResult } from '../action-resolver';
import Config from '../config';
import { deleteSession } from '../store';

const restart:ActionHandler = (session, world, subject) => {

  if (!Config.dev || !subject) {
    // TODO: This needs confirmation
    deleteSession(session._id);
    return {
      message: `Okay, we'll start over.`,
      close: true
    };
  }

  if (subject === 'tent') {
    return {
      message: 'Skipping ahead to the tent.',
      update: {
        room: 'tent',
        inventory: new Set(),
        flags: {},
        effects: new Set(),
        seen: new Set(),
        gone: new Set()
      }
    };
  }

};

export default restart;