// @flow

import type { Session, SessionDiff } from './model/session';
import type { World } from './model/world';

import { getSession, writeSession, deleteSession, getWorld } from './store';
import { lookAt } from './model/room';

import fallback from './action/fallback'
import move from './action/move';
import objectTravel from './action/object-travel';
import inventory from './action/inventory';
import exits from './action/exits';
import interact from './action/interact';
import { resolve } from './value';

export type Action = {|
  sessionId:string,
  type:ActionType,
  subject?:string,
  object?:string
|};

export type ActionResult = {|
  message:string,
  update?:SessionDiff,
  close?:boolean
|};

export type ActionHandler = (session:Session, world:World, subject?:string, object?:string) => ActionResult | Action;

export class Synonym {
  value:string;
  constructor(verb:string) {
    this.value = verb;
  }
}

const INV_LOOK_KEYS = new Set([
  'inventory', 
  'my inventory', 
  'bag', 
  'my bag', 
  'pocket', 
  'pockets', 
  'my pocket', 
  'my pockets'
]);

const EXIT_LOOK_KEYS = new Set([
  'exits', 
  'exit', 
  'doors', 
  'door', 
  'ways out', 
  'way out', 
  'directions'
]);

const handlers:{[string]:ActionHandler} = {
  'fallback': fallback,
  'move': move,
  'object-travel': objectTravel,
  'inventory': inventory,
  'exits': exits,
  'attack': interact('attack', { failure: s => `You can't attack the ${s}` }),
  'give': interact('give', { failure: (s, o) => `The ${s} doesn't want the ${o}` }),
  'open': interact('open'),
  'close': interact('close'),
  'take': interact('take'),
  'eat': interact('eat'),
  'talk': interact('talk', { failure: s => `You can't talk to the ${s}`}),
  'use': interact('use', { exits: true }),
  'tie': interact('tie'),
  'untie': interact('untie'),
  'light': interact('light'),
  'look': interact('look', {
    failure: s => `The ${s} is unremarkable`,
    subjectless: (session, world) => lookAt(session, world, session.room),
    custom:(session, world, subject) => {
      subject = subject.toLowerCase();
      if (subject === session.room) {
        return () => lookAt(session, world, session.room);
      }
      if (INV_LOOK_KEYS.has(subject)) {
        // Check your inventory
        return inventory;
      }
      if (EXIT_LOOK_KEYS.has(subject)) {
        // Enumerate possible exits
        return exits;
      }
      const room = world.rooms[session.room];
      const lookRoomId = resolve(session, room.exits)[subject];
      if (lookRoomId) {
        // Check an exit
        if (session.seen.has(lookRoomId)) {
          return () => ({ message: `It leads to ${resolve(session, world.rooms[lookRoomId].name)}` });
        }
        return () => ({ message: `You don't know where it leads.` });
      }
      return null;
    }
  })
};

export type ActionType = $Keys<typeof handlers>;

async function createSession(id:string):Promise<Session> {
  const world = await getWorld('poc');
  const session = {
    _id: id,
    world: world.id,
    room: world.start,
    flags: {},
    inventory: new Set(),
    gone: new Set(),
    seen: new Set([world.start]),
    effects: new Set(),
    failures: 0
  };
  writeSession(session);
  return session;
}

const determiner = /^(a|the|my) /i;
function formatThing(thing:?string):string {
  if (!thing) { return ''; }
  return thing.toLowerCase().replace(determiner, '');
}

function processUpdate(oldSession:Session, update:SessionDiff):Session {
  // $FlowFixMe Object.assign({}, oldSession) is *obviously* of type Session, idiot
  const newSession:Session = Object.assign({}, oldSession, { failures: 0 }, update);
  return newSession;
}

export async function resolveAction(action:Action):Promise<ActionResult> {

  if (action.type === 'restart') {
    // TODO: This needs confirmation
    await deleteSession(action.sessionId);
    return {
      message: `Okay, we'll start over.`,
      close: true
    };
  }

  let session = await getSession(action.sessionId);
  if (!session) {
    session = await createSession(action.sessionId);
  }
  const world = await getWorld(session.world);
  const result = handlers[action.type](session, world, formatThing(action.subject), formatThing(action.object));
  if (result.message) { // This is an ActionResult
    if (result.update) {
      writeSession(processUpdate(session, result.update));
    }
    return result;
  }

  // $FlowFixMe This is obviously an Action at this point =/
  const r:Action = result;
  
  return resolveAction(r);
}