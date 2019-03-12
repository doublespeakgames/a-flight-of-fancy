// @flow

import type { Thing } from './thing';
import type { Session } from './session';
import type { World } from './world';
import type { ActionResult } from '../action-resolver';
import type { Value } from '../value';

import { resolve } from '../value';
import { compose } from '../util/updater';
import { getExitText } from '../action/exits';

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

/* TODO:::
 * I want to do a big refactor regarding this stuff. Ideally, 
 * both messages and model updates would be represented by a chain
 * of composable Session => [Message, NewSession] functions.
 * This would consolidate ActionHandler and RoomEffect and remove
 * the need to pass Session once to get an ActionResult, then again 
 * into the update function to regenerate the model.
 */
export type RoomEffect = (session:Session, roomId:RoomId) => ?ActionResult;

export function lookAt(session:Session, world:World, roomId:RoomId, short:boolean = false):ActionResult {

  const room = world.rooms[roomId];
  const article = room.article || 'in'; 

  const finalResult:ActionResult = {
    message: short ? `You are ${article} ${resolve(session, room.name)}. ${getExitText(session, room)}` : resolve(session, room.description)
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