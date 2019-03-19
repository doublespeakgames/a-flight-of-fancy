// @flow
/**
 * Interact action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Executes verbs on things
 */

import type { ActionHandler, ActionOutput } from '../action-resolver';
import type { ThingId, Thing } from '../model/thing';
import type { World } from '../model/world';
import type { Session } from '../model/session';
import { Synonym } from '../action-resolver';
import { fromEffects, fromRoom, fromInventory } from '../model/thing';
import move from './move';

type Options = {
  exits?:boolean,
  subjectless?:ActionHandler,
  custom?:(session:Session, world:World, subject:string) => ?ActionHandler,
  failure?: (subject:string, object:string) => string
};

export default (verb:string, options:Options = {}):ActionHandler => 
  (session, world, sentence) => {
    if (!sentence.subject) {
      if (typeof options.subjectless === 'string') {
        return { message: options.subjectless };
      }
      if (typeof options.subjectless === 'function') {
        return options.subjectless(session, world, {});
      }
      return { message: `You can't do that.` };
    }
    
    const result = !sentence.object 
      ? simpleHandler(world, verb, sentence.subject, sentence.verb, options) 
      : complexHandler(world, verb, sentence.subject, sentence.object, sentence.verb, options);
    
    return result;
  };

  export function getThings(session:Session, world:World, subject:ThingId):Array<Thing> {
    return [
      fromEffects(session, subject, world),
      fromInventory(session.inventory, subject, world),
      fromRoom(session, world.rooms[session.room], subject)
    ].filter(Boolean);
  }

  function simpleHandler(world, verb, subject, rawVerb, options):ActionOutput {
    return session => {
      const things = getThings(session, world, subject);
      if (!things.length) {

        if (options.custom) {
          const handler = options.custom(session, world, subject);
          if (handler) {
            return handler(session, world, {});
          }
        }

        return {
          message: `There is no ${subject} here.`
        };
      }

      for (let thing of things) {
        if (thing.verbs && thing.verbs[verb]) {
          // ActionOutput | ComplexPhrase | Synonym | string
          const handler = thing.verbs[verb];

          // Synonym
          if (handler instanceof Synonym) {
            return simpleHandler(world, handler.value, subject, rawVerb, options);
          }

          // string
          if (typeof handler === 'string') {
            return { message: handler, context: subject };
          }

          // ComplexPhrase with 'self' support
          if (handler.self) {
            const inner:ActionOutput|string = handler.self;
            if (typeof inner === 'string') {
              return { message: inner, context: subject };
            }
            return [
              { message: '', context: subject },
              inner
            ];
          }

          // ComplexPhrase without 'self' support
          if (typeof handler === 'object' && !Array.isArray(handler) && handler.message === undefined) {
            continue;
          }

          // ActionOutput
          return [
            { message: '', context: subject }, 
            handler 
          ];
        }
        if (options.exits && thing.exit) {
          return move(session, world, { subject: thing.exit });
        }
      }

      const fail = options.failure ? options.failure(subject, '') : `You can't ${rawVerb || verb} the ${subject}`;
      return { message: fail };
    };
  }

  function complexHandler(world, verb, subject, object, rawVerb, options):ActionOutput {
    return session => {
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
        if (!subjectThing.id && (!verbs || typeof verbs[verb] != 'object')) {
          // Subject can neither use nor be used, so short-circuit
          continue;
        }

        for (let objectThing of objectThings) {
          const result = tryApply(world, verb, subjectThing, objectThing) || 
                        tryApply(world, verb, objectThing, subjectThing);
          if (result) {
            return [
              { message: '', context: subject },
              result
            ];
          }
        }
      }

      const fail = options.failure ? options.failure(subject, object) : `You can't ${rawVerb || verb} those together.`;
      return { message: fail };
    }
  }

  function tryApply(world, verb:string, subject, object):?ActionOutput {
    const verbs = subject.verbs;
    if (!verbs) {
      return null;
    }
    // Synonym | SimplePhrase | ComplexPhrase
    const output = verbs[verb];
    if (!output) { return null; }

    // Synonym
    if (output instanceof Synonym) {
      return tryApply(world, output.value, subject, object);
    }

    // ComplexPhrase with support for the object
    if (typeof output === 'object' && !Array.isArray(output) && object.id && output[object.id]) {
      const handler:string|ActionOutput = output[object.id];
      if (typeof handler === 'string') {
        return { message: handler };
      }
      return handler;
    }

    // ComplexPhrase with wildcard support
    if (typeof output === 'object' && !Array.isArray(output) && output.any) {
      const handler:string|ActionOutput = output.any;
      if (typeof handler === 'string') {
        return { message: handler };
      }
      return handler;
    }

    // Unsupported
    return null;
  }