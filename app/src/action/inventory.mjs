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

const inventory:ActionHandler = (session, world, subject) => {

  if (subject) {
    return {
      message: fromInventory(session.inventory, subject, world) ? `Yes.` : `No.`
    };
  }

  const list = [...session.inventory].map(k => {
    const item = world.items[k];
    return item.name || item.keys[0];
  });

  if (list.length > 1) {
    list[list.length - 1] = `and ${list[list.length - 1]}`;
  }

  return {
    message: `You are carrying ${list.join(', ')}`
  };

};

export default inventory;