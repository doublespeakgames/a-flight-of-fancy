// @flow

import type { Thing } from './Thing';

export type Direction = string;
export type RoomId = string;
export type Room = {|
  name: string,
  description: string,
  exits: { [Direction]:RoomId },
  things?: Array<Thing>
|};