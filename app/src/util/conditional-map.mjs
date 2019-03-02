// @flow

import type { Session } from '../model/session';
import type { Builder, Predicate } from './builder'

type MapBuilder<T> = {
  ...Builder<{[string]:T}>,
  and:(p:Predicate, key:string, val:T) => MapBuilder<T>
};

function and<T>(prev:(Session => {[string]:T}), p:Predicate, key:string, val:T):MapBuilder<T> {
  const build = session => {
    const base = prev(session); // Assume we're handed an object that's safe to modify
    if (p(session)) {
      base[key] = val;
    }
    return base;
  };
  return {
    build,
    and: and.bind(null, build)
  };
}

export default function<T>(base:{[string]:T}):MapBuilder<T> {
  const ret:{[string]:T} = { ...base };
  const build = session => ({ ...base });
  return {
    build,
    and: and.bind(null, build)
  };
}