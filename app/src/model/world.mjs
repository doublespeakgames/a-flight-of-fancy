// @flow
import type { Room, RoomId } from './room';
import type { Thing, ThingId } from './thing';
import type { Effect, EffectId } from './effect';
import type { SoundId, SoundPath, SoundProvider } from './sound';
import type { Value } from '../value';

export type WorldId = string;
export type World = {|
  id: WorldId,
  start: RoomId,
  rooms: { [RoomId]: Room },
  items: { [ThingId]: Thing },
  effects: { [EffectId]: Effect },
  sounds: { [SoundProvider]: { [SoundId]: Value<SoundPath> } }
|}