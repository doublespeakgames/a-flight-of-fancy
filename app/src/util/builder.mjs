// @flow

import type { Session } from '../model/session';
import { tryParse } from './number';

export type Predicate = Session => boolean;
export type Builder<T> = {|
  build: Session => T
|};

/* Predicates */

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