// @flow

import type { Session } from './session';
import type { World } from './world';
import type { Direction, Room } from './room';
import type { ActionHandler } from '../action-resolver'

export type Thing = {|
  keys:Array<string>,
  description:string,
  take?:ActionHandler|string,
  exit?:Direction
|}

export function findInRoom(room:Room, key?:string):?Thing {
  if (!key) {
    return null;
  }
  
  var k = key.toLowerCase();
  if (room.things != null) {
    return room.things.find(t => t.keys.includes(k));
  }

  return null;
}