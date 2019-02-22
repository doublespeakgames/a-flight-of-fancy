// @flow

import type { WorldId } from './world';
import type { RoomId } from './room';
import type { ThingId } from './thing';

export type Session = {
  _id:string,
  world:WorldId,
  room:RoomId,
  flags:{[string]:string},
  inventory:Array<ThingId>
};

export type SessionDiff = {|
  world?:WorldId,
  room?:RoomId,
  flags?:{[string]:string},
  inventory?:Array<ThingId>
|};