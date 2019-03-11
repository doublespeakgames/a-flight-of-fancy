// @flow

import type { ActionResult } from '../action-resolver';
import type { Session } from '../model/session';
import type { Predicate, Builder } from './builder';
import type { RoomEffect } from '../model/room';

import { compose } from './updater';

type Appendable = string | RoomEffect | ActionResult;

type ResultBuilder = {
  ...Builder<?ActionResult>,
  append: (predicate:Appendable|Predicate, toAppend?:Appendable) => ResultBuilder
}

const merge = (a:ActionResult, b:ActionResult):ActionResult => ({
  message: `${a.message} ${b.message}`,
  update: compose(a.update, b.update)
});

function getParams(a, b):[?Predicate, Appendable] {
  if (!b) {
    //$FlowFixMe I know this is right
    return [null, a];
  }
  //$FlowFixMe I know this is right
  return [a, b];
}

function getNext(session, toAppend):?ActionResult {
  if (typeof toAppend === 'string') {
    return { message: toAppend };
  }
  if (typeof toAppend === 'function') {
    return toAppend(session, session.room);
  }
  if (typeof toAppend === 'object') {
    return toAppend;
  }
}

function append(prev:Session => ?ActionResult, a:Appendable|Predicate, b?:Appendable):ResultBuilder {
  const [ p, toAppend ] = getParams(a, b);
  const build = session => {
    const base = prev(session);
    const next = getNext(session, toAppend);
    return base && next ? merge(base, next) : base || next;
  }
  return {
    build,
    append: append.bind(null, build)
  };
}

export default function(initial:Appendable):ResultBuilder {
  const build = session => getNext(session, initial);
  const builder:ResultBuilder = {
    build,
    append: append.bind(null, build)
  };
  return builder;
}