// @flow

/**
 * Mixins for Thing behaviours 
 * @author mtownsen
 * @since Feb 2019
 */

import type { SessionDiff } from './session';
import type { Thing, ThingId } from './thing';
import type { Predicate } from '../util/builder';
import type { Updater } from '../util/updater';
import type { ActionOutput } from '../action-resolver';

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
export function takeable(base:Thing, id:ThingId, limited:boolean = false, takeMessage?:string):Thing {
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
        message: takeMessage || `You take ${name}.`,
        update
      };
    }
  }, base.verbs);

  if (limited && !base.visibility) {
    base.visibility = session => !session.gone.has(id);
  }

  return base;
}

export function once(action:string|ActionOutput, key:string):ActionOutput {
  return ss => {
    if (ss.flags[key]) {
      return null;
    }
    const update = { flags: mapSet(ss.flags, key, '1') };
    if (typeof action === 'string') {
      return { 
        message: action,
        update
      };
    } 
    return [
      { message: '', update },
      action
    ];
  };
}

export function maybeDo(p:Predicate, action:string|ActionOutput, or?:string|ActionOutput = null):ActionOutput {
  if (typeof action === 'string') {
    action = { message: action };
  }
  if (typeof or === 'string') {
    or = { message: or };
  }
  return ss => p(ss) ? action : or;
}

export function text(t:string):ActionOutput {
  return { message: t };
}