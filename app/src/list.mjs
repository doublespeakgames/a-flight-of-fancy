// @flow
/** 
 * Utility functions for dealing with lists
 * @author mtownsend
 * @since Feb 2019
 */

export function join<T>(list:Array<T>, sep:string = '', last:string = sep):string {
  const len = list.length;
  return list.reduce((acc, cur, idx) => {
    const s = idx === 0 ? '' : idx === len - 1 ? last : sep;
    return `${acc}${s}${String(cur)}`;
  }, '');
}

export function random<T>(list:Array<T>):T {
  return list[Math.floor(Math.random() * list.length)];
}