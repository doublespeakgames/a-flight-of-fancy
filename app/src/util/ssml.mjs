// @flow

type Voice = { text:string, pitch:PitchValue };
type PitchValue = string;
type DialogueBlock = string | Voice;
type DialogueBuilder = {
  append: DialogueBlock => DialogueBuilder,
  pause: number => DialogueBuilder,
  build: void => string
};

export const Pitch:{[string]:PitchValue} = Object.seal({
  HIGHEST: '+6st',
  HIGH: '+3st',
  MED_HIGH: '+1st',
  MED_LOW: '-1st',
  LOW: '-3st',
  LOWEST: '-6st'
});

function renderBlock(block:DialogueBlock):string {
  if (typeof block === 'string') {
    return block;
  }
  return `<prosody pitch="${block.pitch}">${block.text}</prosody>`;
}

export default function ssml(initial:DialogueBlock):DialogueBuilder {
  let val = renderBlock(initial);
  const builder = {
    append: (block:DialogueBlock) => {
      val = `${val} ${renderBlock(block)}`;
      return builder;
    },
    pause: seconds => {
      val = `${val}<break time="${seconds}s" />`;
      return builder;
    },
    build: () => `<speak>${val}</speak>`
  };
  return builder;
}