// @flow

import type { EffectId } from '../model/effect';
import type { RoomId } from '../model/room';
import type { Session } from '../model/session';
import { tryParse } from './number';

export type Predicate = Session => boolean;
export type Builder<T> = {|
  build: Session => T
|};

/* Predicates */

export function both(a:Predicate, b:Predicate):Predicate {
  return session => a(session) && b(session);
}

export function not(p:Predicate):Predicate {
  return session => !p(session);
}

export function ifHere(key:string):Predicate {
  return session => !session.gone.has(key);
}

export function ifFlagGT(key:string, val:number):Predicate {
  return session => tryParse(session.flags[key], 0) > val;
}

export function ifFlagGTE(key:string, val:number):Predicate {
  return session => tryParse(session.flags[key], 0) >= val;
}

export function ifFlagIs(key:string, val:string):Predicate {
  return session => session.flags[key] === val;
}

export function ifAt(room:RoomId):Predicate {
  return session => session.room === room;
}

export function ifEffect(effect:EffectId):Predicate {
  return session => session.effects.has(effect);
}

export function ifSeen(room:RoomId):Predicate {
  return session => session.seen.has(room);
}