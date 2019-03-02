// @flow

import type { ActionResult } from '../action-resolver';
import type { Session } from '../model/session';
import type { Predicate, Builder } from './builder';
import message from './message';

// TODO: Should this even be a thing?

type ResultBuilder = {
  ...Builder<ActionResult>,
  append: (predicate:string|Predicate, text?:string) => ResultBuilder
}

export default function(initialText:string):ResultBuilder {

  let messageBuilder = message(initialText);
  const builder = {
    build: session => ({
      message: messageBuilder.build(session)
      // TODO: Support update
    }),
    append: (...args) => {
      messageBuilder = messageBuilder.append(...args);
      return builder;
    }
  };
  return builder;
}