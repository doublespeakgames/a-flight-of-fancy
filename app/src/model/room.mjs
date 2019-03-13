// @flow

import type { Thing } from './thing';
import type { Session } from './session';
import type { World } from './world';
import type { ActionOutput, ActionResult } from '../action-resolver';
import type { Value } from '../value';

import { resolve } from '../value';
import { getExitText } from '../action/exits';
import { setAdd } from '../util/immutable';

export type ExitMap = { [Direction]:RoomId };
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
  effect?: ActionOutput,
  leaveMessage?: (to:RoomId, dir:Direction) => string,
  article?: string
|};

export const lookAt = (world:World, preventShort:bool = false):ActionOutput => ss => { 
  const room = world.rooms[ss.room];
  const article = room.article || 'in';

  const oldSeen = ss.seen;

  const effects = [
    room.effect,
    ...[...ss.effects].map(id => world.effects[id].roomEffect)
  ].filter(Boolean);

  const exits = ss => !preventShort && oldSeen.has(ss.room) ? {
    message: getExitText(ss, world.rooms[ss.room])
  } : null;

  return [{
    message: !preventShort && ss.seen.has(ss.room) ? `You are ${article} ${resolve(ss, room.name)}.` : resolve(ss, room.description),
    update: !preventShort && ss.seen.has(ss.room) ? undefined : { seen: setAdd(ss.seen, ss.room) }
  }, ...effects, exits ]; 
};