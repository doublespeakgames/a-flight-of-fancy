// @flow
import type { Room, RoomId } from './room';

export type WorldId = string;
export type World = {|
  id: WorldId,
  start: RoomId,
  rooms: { [RoomId]: Room }
|}