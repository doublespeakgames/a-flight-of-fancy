// @flow

import type { Session } from './session';
import type { Thing } from './thing';


export type EffectId = string;
export type Effect = {|
  description?:string|(Session => ?string),
  things: Array<Thing>
|};