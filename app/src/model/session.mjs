// @flow

import type { WorldId } from './world';
import type { RoomId } from './room';
import type { ThingId } from './thing';

export type Session = {
  _id:string,
  world:WorldId,
  room:RoomId,
  flags:{[string]:string},
  inventory:Set<ThingId>,
  gone:Set<ThingId>,
  failures:number
};

export type SessionDiff = {|
  world?:WorldId,
  room?:RoomId,
  flags?:{[string]:string},
  inventory?:Set<ThingId>,
  gone?:Set<ThingId>,
  failures?:number
|};

export function deserialize(json:?Object):?Session {
  if (!json) {
    return null;
  }
  return {
    _id: json._id,
    world: json.world,
    room: json.room,
    flags: json.flags,
    inventory: new Set(json.inventory),
    gone: new Set(json.gone),
    failures: json.failures
  };
}

export function serialize(ss:Session):any {
  return {
    _id: ss._id,
    world: ss.world,
    room: ss.room,
    flags: ss.flags,
    inventory: [...ss.inventory],
    gone: [...ss.gone],
    failures: ss.failures
  };
}