// @flow

/**
 * Mixins for Thing behaviours 
 * @author mtownsen
 * @since Feb 2019
 */

import type { Thing, ThingId } from './thing';
import type { RoomEffect } from './room';
import type { Predicate } from '../util/builder';
import type { Updater } from '../util/updater';
import type { ActionResult } from '../action-resolver';

import { mapSet, setAdd } from '../util/immutable';
import { compose } from '../util/updater';

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
      const update:Updater = session => {
        const ss = {
          ...session,
          inventory: setAdd(session.inventory, id)
        };
        if (limited) {
          ss.gone = setAdd(session.gone, id);
        }
        return ss;
      };
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
  return (session, roomId) => {
    if (session.flags[key]) {
      return null;
    }
    const base:?ActionResult = typeof text === 'string' ? {
      message: text
    } : text(session, roomId);

    if (!base) { 
      return null;
    }

    const update:Updater = s => ({ ...s, flags: mapSet(s.flags, key, '1') });
    base.update = compose(base.update, update);

    return base;
  }
}

export function maybeDo(p:Predicate, effect:RoomEffect):RoomEffect {
  return (session, roomId) => p(session) ? effect(session, roomId) : null;
}