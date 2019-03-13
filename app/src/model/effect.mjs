// @flow

import type { Session } from './session';
import type { Thing } from './thing';
import type { RoomId } from './room';
import type { ActionOutput } from '../action-resolver';

export type EffectId = string;
export type Effect = {|
  roomEffect?: ActionOutput,
  things: Array<Thing>
|};