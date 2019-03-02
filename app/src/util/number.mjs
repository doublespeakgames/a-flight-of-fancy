// @flow
export function tryParse(s:string, def:number):number {
  if (isNaN(s)) {
    return def;
  }
  return parseInt(s);
}