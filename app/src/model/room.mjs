// @flow

import type { Thing } from './thing';
import type { Session } from './session';

export type Lock = Session => ?string;
export type Direction = string;
export type RoomId = string;
export type Room = {|
  name: string,
  description: string|(Session => string),
  exits: { [Direction]:RoomId },
  locks?: { [Direction]:Lock},
  things?: Array<Thing>,
  phrases?: Array<{keys:Array<string>, action:string}>
|};