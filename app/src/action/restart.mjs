// @flow

import type { ActionHandler, ActionResult } from '../action-resolver';
import Config from '../config';
import { deleteSession } from '../store';
import { lookAt } from '../model/room';

const restart:ActionHandler = (session, world, { subject }) => {

  let teleport = true;
  if (!Config.teleport || !subject || !world.rooms[subject]) {
    subject = 'pantry';
    teleport = false;
  }

  const restart = {
    message: teleport ? `Starting at the ${subject}` : `Okay, we'll start over.`,
    update: {
      room: subject,
      inventory: new Set(),
      flags: {},
      effects: new Set(),
      seen: new Set(),
      gone: new Set()
    }
  };

  const look = lookAt(world);

  return [ restart, look ];
};

export default restart;