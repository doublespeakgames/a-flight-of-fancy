// @flow

import type { Session } from './session';
import type { Thing } from './thing';
import type { RoomId, RoomEffect } from './room';
import type { ActionResult } from '../action-resolver';

export type EffectId = string;
export type Effect = {|
  roomEffect?: RoomEffect,
  things: Array<Thing>
|};