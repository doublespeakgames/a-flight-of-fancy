// @flow

type Voice = { text:string, pitch:PitchValue };
type PitchValue = string;
type DialogueBlock = string | Voice;
type DialogueBuilder = {
  append: DialogueBlock => DialogueBuilder,
  pause: number => DialogueBuilder,
  audio: string => DialogueBuilder,
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
    return block.replace(/<speak>/g, '').replace(/<\/speak>/g, '');;
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
    audio: path => {
      val = `${val}<audio src="${path}" />`;
      return builder;
    },
    build: () => `<speak>${val}</speak>`
  };
  return builder;
}