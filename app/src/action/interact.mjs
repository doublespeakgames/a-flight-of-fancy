// @flow
/**
 * Interact action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Executes verbs on things
 */

import type { ActionHandler } from '../action-resolver';
import type { ThingId, Thing } from '../model/thing';
import type { World } from '../model/world';
import type { Session } from '../model/session';
import { Synonym } from '../action-resolver';
import { fromEffects, fromRoom, fromInventory } from '../model/thing';
import move from './move';

type Options = {
  exits?:boolean,
  subjectless?:ActionHandler,
  custom?:(session:Session, world:World, subject:string) => ?ActionHandler
};

export default (verb:string, options:Options = {}):ActionHandler => 
  (session, world, subject, object) => {
    if (!subject) {
      if (typeof options.subjectless === 'string') {
        return { message: options.subjectless };
      }
      if (typeof options.subjectless === 'function') {
        return options.subjectless(session, world);
      }
      return { message: `You can't do that.` };
    }
    
    if (!object) {
      return simpleHandler(session, world, verb, subject, options);
    }

    return complexHandler(session, world, verb, subject, object, options);

  };

  export function getThings(session:Session, world:World, subject:ThingId):Array<Thing> {
    return [
      fromEffects(session, subject, world),
      fromInventory(session.inventory, subject, world),
      fromRoom(session, world.rooms[session.room], subject)
    ].filter(Boolean);
  }

  function simpleHandler(session, world, verb, subject, options) {

    const things = getThings(session, world, subject);
    if (!things.length) {

      if (options.custom) {
        const handler = options.custom(session, world, subject);
        if (handler) {
          return handler(session, world);
        }
      }

      return {
        message: `There is no ${subject} here.`
      };
    }

    for (let thing of things) {
      if (thing.verbs) {
        const handler = thing.verbs[verb];
        if (typeof handler === 'function') {
          return handler(session, world);
        }
        if (typeof handler === 'string') {
          return { message: handler };
        }
        if (handler instanceof Synonym) {
          return simpleHandler(session, world, handler.value, subject, options);
        }
        if (typeof handler === 'object') {
          const inner = handler['self'];
          if (typeof inner === 'string') {
            return { message: inner };
          }
          if (typeof inner === 'function') {
            return inner(session, world);
          }
        }
      }
      if (options.exits && thing.exit) {
        return move(session, world, thing.exit);
      }
    }

    return { message: `You can't ${verb} the ${subject}` };
  }

  function complexHandler(session, world, verb, subject, object, options) {

    const subjectThings = getThings(session, world, subject);
    if (!subjectThings.length) {
      return {
        message: `There is no ${subject} here.`
      };
    }

    const objectThings = getThings(session, world, object);
    if (!objectThings.length) {
      return {
        message: `There is no ${object} here.`
      };
    }

    for (let subjectThing of subjectThings) {
      const verbs = subjectThing.verbs;
      if (!subjectThing.id && (!verbs || typeof verbs.use != 'object')) {
        // Subject can neither use nor be used, so short-circuit
        continue;
      }

      for (let objectThing of objectThings) {
        const result = tryApply(session, world, verb, subjectThing, objectThing) || 
                      tryApply(session, world, verb, objectThing, subjectThing);
        if (result) {
          return result;
        }
      }
    }

    return {
      message: `You can't ${verb} those together.`
    };
  }

  function tryApply(session, world, verb:string, subject, object) {
    const verbs = subject.verbs;
    if (!verbs) {
      return null;
    }
    if (verbs[verb] instanceof Synonym) {
      return tryApply(session, world, verbs[verb].value, subject, object);
    }
    if (typeof verbs[verb] === 'object' && object.id && verbs[verb][object.id]) {
      const handler = verbs[verb][object.id];
      if (typeof handler === 'string') {
        return { message: handler };
      }
      return handler(session, world);
    }
    return null;
  }