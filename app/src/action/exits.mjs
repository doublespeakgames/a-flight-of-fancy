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
import { join } from '../util/list';
import { resolve } from '../value';

export function getExitText(session:Session, room:Room):ActionResult {
  const exits = Object.keys(resolve(room.exits, session));
  const num = exits.length;
  if (num > 1) {
    return {
      message: `There are exits to the ${join(exits, ', ', ', and ')}.`
    };
  }
  if (num === 1) {
    return { 
      message: `There is an exit to the ${exits[0]}.`,
      context: exits[0]
    };
  }
  return { message: 'There are no exits.' };
}

const exits:ActionHandler = (session, world) => {
  const room = world.rooms[session.room];
  return getExitText(session, room);
};

export default exits;