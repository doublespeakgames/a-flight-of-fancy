// @flow

import type { Session } from './model/session';

export type Value<T:Object> = T | (session:Session, playerMoved:bool) => T;

export function resolve<T:Object>(value:Value<T>, session:Session, playerMoved:bool):T {
  if (typeof value === 'function') {
    return value(session, playerMoved);
  }
  return value;
}