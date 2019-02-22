// @flow
/**
 * Consume Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles the consumption of stuff
 */

import type { Session } from '../model/session';
import type { Thing } from '../model/thing';
import type { ActionHandler, ActionResult } from '../action-resolver';
import { fromRoom, fromInventory } from '../model/thing';

const eat:ActionHandler = (session, world, subject, object) => {
  if (!subject) {
    return {
      message: `You can't do that.`
    };
  }

  const subjectThings = [
    fromRoom(world.rooms[session.room], subject),
    fromInventory(session.inventory, subject, world)
  ].filter(Boolean);

  if (!subjectThings.length) {
    return {
      message: `There is no ${subject} here.`
    };
  }

  for (let thing of subjectThings) {
    if (typeof thing.eat === 'string') {
      return {
        message: thing.eat
      };
    }
    if (typeof thing.eat === 'function') {
      return thing.eat(session, world);
    }
  }

  return {
    message: `You can't eat that.`
  };

};

function tryUse(session, world, thingOne, thingTwo):?ActionResult {
  if (typeof thingOne.use === 'object' && thingTwo.useKey && thingOne.use[thingTwo.useKey]) {
    return thingOne.use[thingTwo.useKey](session, world);
  }
  return null;
}

export default eat;