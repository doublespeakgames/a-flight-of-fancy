// @flow

import type { Session } from './session';
import type { World } from './world';
import type { Direction, Room } from './room';
import type { Synonym, ActionOutput } from '../action-resolver'

export type ThingId = string;

type SimplePhrase = ActionOutput|string;
type ComplexPhrase = {[ThingId]:SimplePhrase};
type Verb = string;

export type Thing = {|
  keys:Array<string>,
  id?:ThingId,
  name?:string,
  exit?:Direction,
  verbs?:{ [Verb]: Synonym|SimplePhrase|ComplexPhrase },
  visibility?:Session => boolean
|};

function getThings(session:Session, room:Room):Array<Thing> {
  if (typeof room.things === 'function') {
    return room.things(session, false);
  }
  return room.things || [];
}

export function fromRoom(session:Session, room:Room, key?:string):?Thing {
  if (!key) {
    return null;
  }
  
  const k = key.toLowerCase();
  return getThings(session, room)
    .filter(t => !(t.id && session.gone.has(t.id)))
    .filter(t => !t.visibility || t.visibility(session))
    .find(t => t.keys.includes(k));
}

export function fromInventory(inventory:Set<ThingId>, key:string, world:World):?Thing {
  return [...inventory]
    .map(itemKey => world.items[itemKey])
    .find(item => item.keys.includes(key));
}

export function fromEffects(session:Session, key:string, world:World):?Thing {
  for (let effect of session.effects) {
    for (let thing of world.effects[effect].things) {
      if (thing.keys.includes(key)) {
        return thing;
      }
    }
  }
  if (world.effects.always) {
    for (let thing of world.effects.always.things) {
      if (thing.keys.includes(key)) {
        return thing;
      }
    }
  }
  return null;
}