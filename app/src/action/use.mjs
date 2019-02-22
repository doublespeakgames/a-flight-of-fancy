// @flow
/**
 * Use Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles the using of stuff, sometimes with other stuff
 */

import type { Session } from '../model/session';
import type { Thing } from '../model/thing';
import type { ActionHandler, ActionResult } from '../action-resolver';
import { fromRoom, fromInventory } from '../model/thing';
import move from './move';

const use:ActionHandler = (session, world, subject, object) => {
  if (!subject) {
    return {
      message: `Use what?`
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

  if (!object) {
    for (let item of subjectThings) {
      if (typeof item.use === 'string') {
        return {
          message: item.use
        };
      }
      if (typeof item.use === 'object' && item.use['self']) {
        return item.use['self'](session, world);
      }
      if (item.exit) {
        return move(session, world, item.exit);
      }
    }
    return {
      message: `You can't use that.`
    };
  }

  const objectThings = [
    fromRoom(world.rooms[session.room], object),
    fromInventory(session.inventory, object, world)
  ].filter(Boolean);

  if (!objectThings.length) {
    return {
      message: `There is no ${object} here.`
    };
  }

  for (let subjectThing of subjectThings) {

    if (!subjectThing.useKey && typeof subjectThing.use != 'object') {
      // Subject can neither use nor be used, so short-circuit
      continue;
    }

    for (let objectThing of objectThings) {
      const result = tryUse(session, world, subjectThing, objectThing) || 
                     tryUse(session, world, objectThing, subjectThing);
      if (result) {
        return result;
      }
    }
  }

  return {
    message: `Those things don't work together.`
  };

};

function tryUse(session, world, thingOne, thingTwo):?ActionResult {
  if (typeof thingOne.use === 'object' && thingTwo.useKey && thingOne.use[thingTwo.useKey]) {
    return thingOne.use[thingTwo.useKey](session, world);
  }
  return null;
}

export default use;