// @flow

import type { Thing } from './thing';
import type { Session } from './session';
import type { World } from './world';
import type { ActionResult } from '../action-resolver';
import type { Value } from '../value';

import { resolve } from '../value';

type ExitMap = { [Direction]:RoomId };
export type Lock = Session => ?string;
export type Direction = string;
export type RoomId = string;
export type Room = {|
  name: Value<string>,
  description: Value<string>,
  exits: Value<ExitMap>,
  locks?: { [Direction]:Lock},
  things?: Value<Array<Thing>>,
  phrases?: Array<{keys:Array<string>, action:string}>,
  entryEffect?: (session:Session, world:World) => ?ActionResult
|};

export function describe(session:Session, world:World, room:Room, short:boolean = false):string {
  const desc = short ? `You are in ${resolve(session, room.name)}.` : resolve(session, room.description);
  const effects = [...session.effects]
    .map(effectId => resolve(session, world.effects[effectId].description))
    .filter(Boolean).join(' ');

  return effects ? `${desc} ${effects}` : desc;
}