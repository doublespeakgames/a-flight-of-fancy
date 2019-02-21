// @flow

import type { WorldId } from './world';
import type { RoomId } from './room';

export type Session = {
  _id:string,
  world:WorldId,
  room:RoomId
};

export type SessionDiff = {
  world?:WorldId,
  room?:RoomId
};