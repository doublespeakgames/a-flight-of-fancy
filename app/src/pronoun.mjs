// @flow

const pronouns = new Set([ 'it', 'one', 'her', 'him', 'them', 'one of them', 'some of them' ]);
const regex = new RegExp(`(^|\\s)(${[...pronouns].join('|')})($|\\s)`);

export function withSubstitutions(text:string, noun:string):string {
  return text.replace(regex, `$1${noun}$3`);
}