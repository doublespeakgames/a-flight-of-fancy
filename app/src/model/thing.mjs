// @flow

import type { Session } from './session';
import type { World } from './world';
import type { Direction, Room } from './room';
import type { Synonym, ActionHandler } from '../action-resolver'

export type ThingId = string;

type SimplePhrase = ActionHandler|string;
type ComplexPhrase = {[ThingId]:SimplePhrase};
type Verb = string;

export type Thing = {|
  keys:Array<string>,
  id?:ThingId,
  name?:string,
  exit?:Direction,
  verbs?:{ [Verb]: Synonym|SimplePhrase|ComplexPhrase }
|}

function getThings(session:Session, room:Room):Array<Thing> {
  if (typeof room.things === 'function') {
    return room.things(session);
  }
  return room.things || [];
}

export function fromRoom(session:Session, room:Room, key?:string):?Thing {
  if (!key) {
    return null;
  }
  
  const k = key.toLowerCase();
  return getThings(session, room).find(t => t.keys.includes(k));
}

export function fromInventory(inventory:Set<ThingId>, key:string, world:World):?Thing {
  return [...inventory]
    .map(itemKey => world.items[itemKey])
    .find(item => item.keys.includes(key));
}