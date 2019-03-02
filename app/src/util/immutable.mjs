// @flow

export function setAdd<T>(set:Set<T>, ...items:Array<T>):Set<T> {
  return new Set([...set, ...items]);
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

export function mapSet<T>(map:{[string]:T}, key:string|{[string]:?T}, val?:?T):{[string]:T} {
  const update:{[string]:?T} = typeof key === 'string' ? { [key]: val } : key;
  const clone:{[string]:T} = Object.assign({}, map);

  for (let key of Object.keys(update)) {
    const val = update[key];
    if (val != null) {
      clone[key] = val;
    }
    else {
      delete clone[key];
    }
  }

  return clone;
}

export function mapRemove<T>(map:{[string]:T}, key:string):{[string]:T} {
  const ret = Object.assign({}, map);
  delete ret[key];
  return ret;
}