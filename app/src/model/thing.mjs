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

export function fromRoom(room:Room, key?:string):?Thing {
  if (!key) {
    return null;
  }
  
  var k = key.toLowerCase();
  if (room.things != null) {
    return room.things.find(t => t.keys.includes(k));
  }

  return null;
}

export function fromInventory(inventory:Set<ThingId>, key:string, world:World):?Thing {
  return [...inventory]
    .map(itemKey => world.items[itemKey])
    .find(item => item.keys.includes(key));
}