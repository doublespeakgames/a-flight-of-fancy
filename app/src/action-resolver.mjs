// @flow

import type { Session, SessionDiff } from './model/session';
import type { World } from './model/world';

import { getSession, writeSession, getWorld } from './store';

import attack from './action/attack';
import look from './action/look';
import move from './action/move';
import take from './action/take';
import talk from './action/talk';

export type ActionType = 'attack' | 'look' | 'move' | 'take' | 'talk';
export type Action = {
  sessionId:string,
  type:ActionType,
  subject?:string
};

export type Response = {
  message:string,
  update?:SessionDiff,
  close?:boolean
};

export type RootActionHandler = (session:Session, world:World, subject?:string) => Response;

const handlers:{[ActionType]:RootActionHandler} = {
  'attack': attack,
  'look': look,
  'move': move,
  'take': take,
  'talk': talk
};

async function createSession(id:string):Promise<Session> {
  const world = await getWorld('poc');
  const session = {
    _id: id,
    world: world.id,
    room: world.start
  };
  writeSession(session);
  return session;
}

export async function resolve(action:Action):Promise<Response> {
  let session = await getSession(action.sessionId);
  if (!session) {
    session = await createSession(action.sessionId);
  }
  const world = await getWorld(session.world);
  const response = await handlers[action.type](session, world, action.subject);
  if (response.update) {
    const newSession:Session = Object.assign({}, session, response.update);
    writeSession(newSession);
  }
  return response;
}