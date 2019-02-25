// @flow

export function add<T>(set:Set<T>, item:T):Set<T> {
  return new Set([...set, item]);
}

export function remove<T>(set:Set<T>, item:T):Set<T> {
  const s = new Set([...set]);
  s.delete(item);
  return s;
}

export function mutate<T>(set:Set<T>, add:Array<T> = [], remove:Array<T> = []):Set<T> {
  const s = new Set([...set, ...add]);
  for (let r of remove) {
    s.delete(r);
  }
  return s;
}