// @flow

import type { Session } from '../model/session';
import type { Builder, Predicate } from './builder';

type MessageBuilder = {
    ...Builder<string>,
    append: (predicate:string|Predicate, text?:string, or?:string) => MessageBuilder
};

function append(prev:(Session => string), a:string|Predicate, b?:string, c?:string):MessageBuilder {
  const or:string = c || '';
  const text:string = typeof a === 'string' ? a : b || '';
  const predicate = typeof a === 'function' ? a : null;
  const build = session => `${prev(session)}${(!predicate || predicate(session)) ? text : or}`;
  return {
    build,
    append: append.bind(null, build)
  };
}

export default function message(initial:string):MessageBuilder {
  const build = session => initial;
  return {
    build,
    append: append.bind(null, build)
  };
}

