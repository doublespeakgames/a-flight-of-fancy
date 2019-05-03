// @flow

import type { ActionHandler, ActionResult } from '../action-resolver';
import { lookAt } from '../model/room';

const welcome:ActionHandler = (session, world, { subject }) => {

  return [ {
    message: `Welcome to A Flight of Fancy, by doublespeak games. I'll describe the setting, and wait for your commands. You'll know it's time to talk when you hear the bell.`,
  }, lookAt(world) ];

};

export default welcome;