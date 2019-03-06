// @flow

/**
 * Mixins for Thing behaviours 
 * @author mtownsen
 * @since Feb 2019
 */

import type { Thing, ThingId } from './thing';
import type { SessionDiff } from './session';
import type { RoomEffect } from './room';
import type { Predicate } from '../util/builder';
import { mapSet, setAdd } from '../util/immutable';

type LockOptions = {|
  stateKey:string,
  keyId:ThingId,
  unlockMessage?:string
|};

// Adds a use key for unlocking, plus open and close
export function locked(base:Thing, { stateKey , keyId, unlockMessage }:LockOptions):Thing {
  const name = base.name || 'it';
  base.verbs = Object.assign({
    'open': session => {
      const state = session.flags[stateKey];
      if (!state) {
        return { message: `${name} is locked, and won't open.` };
      }
      if (state === 'open') {
        return { message: `${name} is already open.` };
      }
      return {
        message: `You open ${name}`,
        update: {
          flags: mapSet(session.flags, stateKey, 'open')
        }
      };
    },
    'close': session => {
      const state = session.flags[stateKey];
      if (state !== 'open') {
        return { message: `${name} is already closed.` };
      }
      return {
        message: `You close ${name}`,
        update: { flags: mapSet(session.flags, stateKey, 'unlocked') }
      };
    },
    'use': {}
  }, base.verbs);

  base.verbs.use[keyId] = session => {
    const state = session.flags[stateKey];
    if (state) {
      return { message: `${name} is already unlocked.` };
    }
    return {
      message: unlockMessage || `You unlock ${name}.`,
      update: { flags: mapSet(session.flags, stateKey, 'unlocked') }
    };
  };
  
  return base;
}

// Lets you pick up a thing, putting it in your inventory
export function takeable(base:Thing, id:ThingId, limited:?boolean = false):Thing {
  base = {...base}; // clone
  const name = base.name || 'it';

  base.verbs = Object.assign({
    'take': session => {
      if (session.inventory.has(id)) {
        return { message: `You already have ${name}.` };
      }
      const update:SessionDiff = {
        inventory: setAdd(session.inventory, id)
      };
      if (limited) {
        update.gone = setAdd(session.gone, id);
      }
      return {
        message: `You take ${name}.`,
        update
      };
    }
  }, base.verbs);

  if (limited && !base.visibility) {
    base.visibility = session => !session.gone.has(id);
  }

  return base;
}

// Displays a message (or does a thing) only once
export function once(text:string|RoomEffect, key:string):RoomEffect {
  return (session, world, roomId) => {
    if (session.flags[key]) {
      return null;
    }
    const base = typeof text === 'string' ? {
      message: text,
      update: {}
    } : text(session, world, roomId);

    if (!base) { 
      return null;
    }

    base.update = { ...(base.update || {}), flags: mapSet(session.flags, key, '1') };

    return base;
    
  }
}

export function maybeDo(p:Predicate, effect:RoomEffect):RoomEffect {
  return (session, world, roomId) => p(session) ? effect(session, world, roomId) : null;
}