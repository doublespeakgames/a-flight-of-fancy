// @flow
/**
 * Inventory Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Checks your inventory
 */

import type { Session } from '../model/session';
import type { ActionHandler, ActionResult } from '../action-resolver';
import { fromInventory } from '../model/thing';

const inventory:ActionHandler = (session, world, sentence) => {

  if (sentence.subject) {
    return {
      message: fromInventory(session.inventory, sentence.subject, world) ? `Yes.` : `No.`
    };
  }

  if (session.inventory.size === 0) {
    return { message: `You aren't carrying anything.` };
  }

  const list = [...session.inventory].map(k => {
    const item = world.items[k];
    return item.name || item.keys[0];
  });

  if (list.length > 1) {
    list[list.length - 1] = `and ${list[list.length - 1]}`;
  }

  return {
    message: `You are carrying ${list.join(', ')}.`
  };

};

export default inventory;