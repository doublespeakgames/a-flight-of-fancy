// @flow

import type { Session } from './session';
import type { World } from './world';
import type { Room } from './room';

export type ActionHandler = (session:Session, world:World) => Response;

export type Thing = {|
  keys:Array<string>,
  description:string,
  take?:ActionHandler
|}

export function findInRoom(room:Room, key:string):?Thing {
  var k = key.toLowerCase();
  if (room.things != null) {
    return room.things.find(t => t.keys.includes(k));
  }

  return null;
}