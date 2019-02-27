// @flow
/**
 * Exits Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Looks for exits
 */

import type { Session } from '../model/session';
import type { Room } from '../model/room';
import type { ActionHandler, ActionResult } from '../action-resolver';
import { join } from '../list';
import { resolve } from '../value';

export function getExitText(session:Session, room:Room):string {
  const exits = Object.keys(resolve(session, room.exits));
  const num = exits.length;
  if (num > 1) {
    return `There are exits to the ${join(exits, ', ', ', and ')}.`;
  }
  if (num === 1) {
    return `There is an exit to the ${exits[0]}.`;
  }
  return 'There are no exits.';
}

const exits:ActionHandler = (session, world) => {
  const room = world.rooms[session.room];
  return { message: getExitText(session, room) };
};

export default exits;