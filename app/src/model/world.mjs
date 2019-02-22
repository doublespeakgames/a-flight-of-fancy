// @flow
import type { Room, RoomId } from './room';
import type { Thing, ThingId } from './thing';

export type WorldId = string;
export type World = {|
  id: WorldId,
  start: RoomId,
  rooms: { [RoomId]: Room },
  items: { [ThingId]: Thing }
|}