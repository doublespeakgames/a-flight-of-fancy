// @flow

import type { Session, SessionDiff } from './model/session';
import type { World } from './model/world';
import type { Updater } from './util/updater';
import type { Value } from './value';
import type { ThingId } from './model/thing';
import type { Direction } from './model/room';

import { getSession, writeSession, getWorld } from './store';
import { lookAt } from './model/room';

import fallback from './action/fallback'
import move from './action/move';
import objectTravel from './action/object-travel';
import inventory from './action/inventory';
import exits from './action/exits';
import interact from './action/interact';
import restart from './action/restart';
import { resolve } from './value';
import Logger from './util/logger';
import { text } from './model/mixins';
import { withSubstitutions } from './pronoun';

export type Action = {|
  sessionId:string,
  type:ActionType,
  sentence:Sentence
|};

export type ActionResult = {|
  message:string,
  update?:SessionDiff,
  close?:boolean,
  context?:ThingId,
  cameFrom?:Direction
|};

export type Sentence = {|
  subject?:string,
  object?:string,
  verb?:string
|};

type OneOrMore<T> = T | Array<T>;
type MaybeAsync<T> = T | Promise<T>;
export type ActionOutput = Value<?OneOrMore<ActionOutput|ActionResult>>;
export type ActionHandler = (session:Session, world:World, sentence:Sentence) => MaybeAsync<ActionOutput>;

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

const defaultIdle:ActionHandler = () => text('Take your time.');

const handlers:{[string]:ActionHandler} = {
  'fallback': fallback,
  'move': move,
  'object-travel': objectTravel,
  'inventory': inventory,
  'exits': exits,
  'restart': restart,
  'idle': defaultIdle,
  'attack': interact('attack', { failure: s => `You can't attack the ${s}` }),
  'give': interact('give', { failure: (s, o) => `The ${o} doesn't want the ${s}` }),
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
    subjectless: (session, world) => lookAt(world, true),
    custom:(session, world, subject) => {
      subject = subject.toLowerCase();
      if (subject === session.room) {
        return () => lookAt(world, true);
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
      const lookRoomId = resolve(room.exits, session)[subject];
      if (lookRoomId) {
        // Check an exit
        if (session.seen.has(lookRoomId)) {
          return () => ({ message: `It leads to ${resolve(world.rooms[lookRoomId].name, session)}` });
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
export function makeSentence(subject:string = '', object:string = '', verb:string = '', context?:string) {
  if (context) {
    subject = withSubstitutions(subject, context);
    object = object ? withSubstitutions(object, context) : object;
  } 
  return {
    subject: formatThing(subject),
    object: formatThing(object),
    verb: formatThing(verb),
  }
}

function processOutput(output:ActionResult|ActionOutput, session:Session, verb:string):?ActionResult {
  if (!output) { return; }
  if (typeof output.message === 'string') {
    // This is an ActionResult, so just return it
    // $FlowFixMe Yes it is
    return output;
  }
  // Gotta be another ActionOutput, so process it
  const o:?(ActionOutput|Array<ActionOutput|ActionResult>) = resolve(output, session, verb);
  if (!o) {
    // Nothing to do
    return;
  }
  const list:Array<ActionOutput|ActionResult> = Array.isArray(o) ? o : [ o ];
  let workingSession = { ...session };
  let workingResult:?ActionResult = null;
  for (let unit of list) {
    const result = processOutput(unit, workingSession, verb);
    if (!result) { continue; }
    // Merge the processed result with the working result and session
    workingResult = {
      message: workingResult ? [workingResult.message, result.message].filter(Boolean).join(' ') : result.message,
      update: workingResult ? { ...workingResult.update, ...result.update } : result.update,
      close: workingResult && workingResult.close || result.close,
      context: result.context || (workingResult ? workingResult.context : undefined),
      cameFrom: result.cameFrom || (workingResult ? workingResult.cameFrom : undefined)
    };

    if (workingResult.close) {
      // Quit early if an action requests to close
      return workingResult;
    }

    workingSession = { ...workingSession, ...workingResult.update };
  }

  return workingResult;
}

function processSSML(message:string):string {
  const noSpeak = message.replace(/<speak>/g, '').replace(/<\/speak>/g, '');
  return `<speak>${noSpeak}</speak>`;
}

export async function resolveAction(action:Action, idleHandler:ActionHandler = defaultIdle):Promise<ActionResult> {
  Logger.info(`Resolving action ${JSON.stringify(action)}`);
  let session = await getSession(action.sessionId);
  if (!session) {
    session = await createSession(action.sessionId);
  }

  const handler = action.type === 'idle' ? idleHandler : handlers[action.type];

  const world = await getWorld(session.world);
  const result:?ActionResult = processOutput(await handler(session, world, action.sentence), session, action.type);

  if (!result) {
    return {
      message: `I'm sorry, something went wrong.`
    }
  }

  if (result.update) {
    writeSession({ ...session, failures: 0, ...result.update });
    Logger.info('Session model updated.');
  }

  result.message = processSSML(result.message);

  Logger.info(`Action resolved with ${JSON.stringify(result)}`);
  return result;

}