// @flow

import type { Thing } from './thing';
import type { Session } from './session';

type ExitMap = { [Direction]:RoomId };
export type Lock = Session => ?string;
export type Direction = string;
export type RoomId = string;
export type Room = {|
  name: string|(Session => string),
  description: string|(Session => string),
  exits: ExitMap | (Session => ExitMap),
  locks?: { [Direction]:Lock},
  things?: Array<Thing>|(Session => Array<Thing>),
  phrases?: Array<{keys:Array<string>, action:string}>
|};