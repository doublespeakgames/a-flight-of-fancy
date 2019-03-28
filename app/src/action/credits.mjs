// @flow
/**
 * Credits Action
 * @author mtownsend
 * @since March 2019
 * 
 * Toot my horn
 */

import type { Session } from '../model/session';
import type { Room } from '../model/room';
import type { ActionHandler, ActionResult } from '../action-resolver';
import { join } from '../util/list';
import { resolve } from '../value';

const Credits:ActionHandler = (session, world) => world.credits;
export default Credits;