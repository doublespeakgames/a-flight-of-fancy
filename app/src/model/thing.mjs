// @flow

import type { Session } from './session';
import type { World } from './world';
import type { Direction, Room } from './room';
import type { ActionHandler } from '../action-resolver'

export type ThingId = string;
export type UseKey = string;

export type Thing = {|
  keys:Array<string>,
  description:string,
  name?:string,
  take?:ActionHandler|string,
  exit?:Direction,
  useKey?:UseKey,
  use?:{[ThingId]:ActionHandler|string}|string,
  eat?:ActionHandler|string
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

export function fromInventory(inventory:Array<ThingId>, key:string, world:World):?Thing {
  return inventory
    .map(itemKey => world.items[itemKey])
    .find(item => item.keys.includes(key));
}