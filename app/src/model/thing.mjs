// @flow

import type { Session } from './session';
import type { World } from './world';
import type { Direction, Room } from './room';
import type { ActionResult } from '../action-resolver'

export type ActionHandler = (session:Session, world:World) => ActionResult;

export type Thing = {|
  keys:Array<string>,
  description:string,
  take?:ActionHandler|string,
  exit?:Direction
|}

export function findInRoom(room:Room, key:string):?Thing {
  var k = key.toLowerCase();
  if (room.things != null) {
    return room.things.find(t => t.keys.includes(k));
  }

  return null;
}