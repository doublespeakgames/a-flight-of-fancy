// @flow

import type { ActionHandler } from '../action-resolver';
import { fromRoom, fromInventory } from '../model/thing';
import move from './move';

type Override = {|
  keys: Set<string>,
  handler:ActionHandler
|};

type Options = {
  exits?:boolean,
  subjectless?:ActionHandler,
  override?:Array<Override>
};

const o:Options = {
  id:'foo'
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

  function simpleHandler(session, world, verb, subject, options) {

    if (options.override) {
      const override = options.override.find(o => o.keys.has(subject));
      if (override) {
        return override.handler(session, world);
      }
    }

    const things = [
      fromRoom(world.rooms[session.room], subject),
      fromInventory(session.inventory, subject, world)
    ].filter(Boolean);

    if (!things.length) {
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

    const subjectThings = [
      fromRoom(world.rooms[session.room], subject),
      fromInventory(session.inventory, subject, world)
    ].filter(Boolean);
    if (!subjectThings.length) {
      return {
        message: `There is no ${subject} here.`
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
      const verbs = subjectThing.verbs;
      if (!subjectThing.useKey && (!verbs || typeof verbs.use != 'object')) {
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
    if (typeof verbs[verb] === 'object' && object.useKey && verbs[verb][object.useKey]) {
      const handler = verbs[verb][object.useKey];
      if (typeof handler === 'string') {
        return { message: handler };
      }
      return handler(session, world);
    }
    return null;
  }