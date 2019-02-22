// @flow

import type { Session, SessionDiff } from './model/session';
import type { World } from './model/world';

import { getSession, writeSession, deleteSession, getWorld } from './store';

import attack from './action/attack';
import look from './action/look';
import move from './action/move';
import take from './action/take';
import talk from './action/talk';
import objectTravel from './action/object-travel';
import use from './action/use';
import inventory from './action/inventory';
import eat from './action/eat';

export type ActionType = 
  'attack' | 
  'look' | 
  'move' | 
  'take' | 
  'talk' | 
  'restart' | 
  'object-travel' | 
  'use' |
  'inventory' |
  'eat';

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

const handlers:{[ActionType]:ActionHandler} = {
  'attack': attack,
  'look': look,
  'move': move,
  'take': take,
  'talk': talk,
  'object-travel': objectTravel,
  'use': use,
  'inventory': inventory,
  'eat': eat
};

async function createSession(id:string):Promise<Session> {
  const world = await getWorld('poc');
  const session = {
    _id: id,
    world: world.id,
    room: world.start,
    flags: {},
    inventory: []
  };
  writeSession(session);
  return session;
}

function processUpdate(oldSession:Session, update:SessionDiff):Session {
  const newSession:Session = Object.assign({}, oldSession, update);
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