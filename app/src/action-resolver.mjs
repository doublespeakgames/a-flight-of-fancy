// @flow

import type { Session, SessionDiff } from './model/session';
import type { World } from './model/world';

import { getSession, writeSession, deleteSession, getWorld } from './store';

import fallback from './action/fallback'
import move from './action/move';
import objectTravel from './action/object-travel';
import inventory from './action/inventory';
import interact from './action/interact';

export type Action = {
  sessionId:string,
  type:ActionType,
  subject?:string,
  object?:string
};

export type ActionResult = {|
  message:string,
  update?:SessionDiff,
  close?:boolean
|};

export type ActionHandler = (session:Session, world:World, subject?:string, object?:string) => ActionResult;

export class Synonym {
  value:string;
  constructor(verb:string) {
    this.value = verb;
  }
}

const handlers:{[string]:ActionHandler} = {
  'fallback': fallback,
  'move': move,
  'object-travel': objectTravel,
  'inventory': inventory,
  'attack': interact('attack'),
  'give': interact('give'),
  'open': interact('open'),
  'close': interact('close'),
  'take': interact('take'),
  'eat': interact('eat'),
  'talk': interact('talk'),
  'use': interact('use', { exits: true }),
  'tie': interact('tie'),
  'look': interact('look', { 
    subjectless: (session, world) => {
      const desc = world.rooms[session.room].description;
      return { message: typeof desc === 'string' ? desc : desc(session) }
    },
    override: [{
      keys: new Set([
        'inventory', 
        'my inventory', 
        'bag', 
        'my bag', 
        'pocket', 
        'pockets', 
        'my pocket', 
        'my pockets']),
      handler: inventory
    }]
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
    failures: 0
  };
  writeSession(session);
  return session;
}

function processUpdate(oldSession:Session, update:SessionDiff):Session {
  const newSession:Session = Object.assign({}, oldSession, { failures: 0 }, update);

  if (update.flags) {
    newSession.flags = Object.assign({}, oldSession.flags, update.flags);
  }
  return newSession;
}

export async function resolve(action:Action):Promise<ActionResult> {

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
  const result = await handlers[action.type](session, world, action.subject, action.object);
  if (result.update) {
    writeSession(processUpdate(session, result.update));
  }
  return result;
}