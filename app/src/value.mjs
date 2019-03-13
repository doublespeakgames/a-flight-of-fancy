// @flow

import type { Session } from './model/session';

export type Value<T:Object> = T | (session:Session, verb?:string) => T;

export function resolve<T:Object>(value:Value<T>, session:Session, verb?:string):T {
  if (typeof value === 'function') {
    return value(session, verb);
  }
  return value;
}