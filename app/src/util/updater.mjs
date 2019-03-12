// @flow

import type { Session, SessionDiff } from '../model/session';

export type Updater = Session => Session;

const I:Updater = s => s;

export function compose(a:Updater = I, b:Updater = I):Updater {
  return session => b(a(session));
}