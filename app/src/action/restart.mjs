// @flow

import type { ActionHandler, ActionResult } from '../action-resolver';
import Config from '../config';
import { deleteSession } from '../store';


const restart:ActionHandler = (session, world, { subject }) => {

  if (!Config.teleport || !subject || !world.rooms[subject]) {
    subject = 'pantry';
  }

  // TODO: This needs confirmation
  return {
    message: `Starting at the ${subject}`,
    update: {
      room: subject,
      inventory: new Set(),
      flags: {},
      effects: new Set(),
      seen: new Set(),
      gone: new Set()
    }
  };

};

export default restart;