// @flow

export function setAdd<T>(set:Set<T>, item:T):Set<T> {
  return new Set([...set, item]);
}

export function setRemove<T>(set:Set<T>, item:T):Set<T> {
  const s = new Set([...set]);
  s.delete(item);
  return s;
}

export function setMutate<T>(set:Set<T>, add:Array<T> = [], remove:Array<T> = []):Set<T> {
  const s = new Set([...set, ...add]);
  for (let r of remove) {
    s.delete(r);
  }
  return s;
}

export function mapSet<T>(map:{[string]:T}, key:string|{[string]:T}, val?:T):{[string]:T} {
  const update = typeof key === 'string' ? { [key]: val } : key;
  return Object.assign({}, map, update);
}