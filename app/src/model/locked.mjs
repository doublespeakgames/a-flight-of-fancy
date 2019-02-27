// @flow

import type { Thing, ThingId } from './thing';
import { mapSet } from '../immutable';

type Options = {|
  stateKey:string,
  keyId:ThingId,
  unlockMessage?:string
|};

export default function(base:Thing, { stateKey , keyId, unlockMessage }:Options):Thing {
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
    'use': {
      [keyId]: session => {
        const state = session.flags[stateKey];
        if (state) {
          return { message: `${name} is already unlocked.` };
        }
        return {
          message: unlockMessage || `You unlock ${name}.`,
          update: { flags: mapSet(session.flags, stateKey, 'unlocked') }
        };
      }
    }
  }, base.verbs);
  
  return base;
}