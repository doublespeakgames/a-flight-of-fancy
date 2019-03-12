// @flow

import type { Thing } from './thing';
import type { Session } from './session';
import type { World } from './world';
import type { ActionResult } from '../action-resolver';
import type { Value } from '../value';

import { resolve } from '../value';
import { compose } from '../util/updater';

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
  effect?: RoomEffect,
  leaveMessage?: (to:RoomId, dir:Direction) => string,
  article?: string
|};

// TODO: This is used for more than room effects now, so it should be moved and renamed
export type RoomEffect = (session:Session, roomId:RoomId) => ?ActionResult;

export function lookAt(session:Session, world:World, roomId:RoomId, short:boolean = false):ActionResult {

  const room = world.rooms[roomId];
  const article = room.article || 'in'; 

  const finalResult:ActionResult = {
    message: short ? `You are ${article} ${resolve(session, room.name)}.` : resolve(session, room.description)
  };

  const effects = [
    room.effect,
    ...[...session.effects].map(id => world.effects[id].roomEffect)
  ].filter(Boolean);

  return effects
    .map(effect => effect(session, roomId))
    .filter(Boolean)
    .reduce((result, effect) => {
      return {
        message: [result.message, effect.message].filter(Boolean).join(' '),
        update: compose(result.update, effect.update)
      }
    }, finalResult);
}