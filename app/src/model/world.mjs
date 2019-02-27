// @flow
import type { Room, RoomId } from './room';
import type { Thing, ThingId } from './thing';
import type { Effect, EffectId } from './effect';

export type WorldId = string;
export type World = {|
  id: WorldId,
  start: RoomId,
  rooms: { [RoomId]: Room },
  items: { [ThingId]: Thing },
  effects: { [EffectId]: Effect }
|}