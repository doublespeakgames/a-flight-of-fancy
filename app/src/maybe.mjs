// @flow

export type Maybe<A> = {
  bind:<B>(fn:A => Maybe<B>) => Maybe<B>,
  map:<B>(fn:A => B) => Maybe<B>,
  or: (def:A) => A
};


export function Just<A>(val:A):Maybe<A> {
  return {
    bind: <B>(fn) => fn(val),
    map: <B>(fn) => Just(fn(val)),
    or: def => val
  };
};

export const Nothing:Maybe<any> = {
  bind: fn => Nothing,
  map: fn => Nothing,
  or: def => def
};

export function wrap<A>(val:?A):Maybe<A> {
  if (val == null) {
    return Nothing;
  }
  return Just(val);
}