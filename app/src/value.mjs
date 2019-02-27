// @flow

import type { Session } from './model/session';

export type Value<T:Object> = T | (Session => T);

export function resolve<T:Object>(session:Session, value:Value<T>):T {
  if (typeof value === 'function') {
    return value(session);
  }
  return value;
}