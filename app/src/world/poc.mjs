// @flow

import type { World } from '../model/world';
import type { ExitMap } from '../model/room';
import type { ActionResult } from '../action-resolver';

import { Synonym } from '../action-resolver';
import { setAdd, setRemove, setMutate, mapSet, mapRemove } from '../util/immutable';
import { random, flatMap } from '../util/list';
import { tryParse } from '../util/number';
import message from '../util/message';
import map from '../util/conditional-map';
import { not, both, ifSeen, ifAt, ifHere, ifFlag, ifFlagGTE, ifFlagIs, ifEffect } from '../util/builder';
import { text, maybeDo, once, locked, takeable } from '../model/mixins';
import ssml, { Pitch } from '../util/ssml';

//#region Shared Things
const threadDirs = {
  'kitchen': 'east',
  'well': 'south',
  'tunnel': 'south',
  'maze-1': 'east',
  'maze-2': 'north',
  'maze-3': 'west'
};
const goblins = {
  'keys': [ 'goblin', 'goblins', 'tiny goblin', 'tiny goblins', 'small goblin', 'small goblins' ],
  'verbs': {
    'look': 'The goblins are no larger than rats, and in constant motion. They carry small bags, and appear to be collecting bits of gravel.',
    'take': 'The goblins easily avoid your attempts at capture.',
    'talk': 'The goblins chitter unintelligibly.',
    'give': new Synonym('use'),
    'attack': new Synonym('use'),
    'tie': new Synonym('use'),
    'use': {
      'thread': 'You could, if only you could catch a goblin first.',
      'stone': session => ({
        message: `As soon as you produce the stone, it is gone.`,
        update: { inventory: setRemove(session.inventory, 'stone') }
      }),
      'knife': 'The goblins easily avoid your attempts at violence.',
      'food': `The goblins chitter disgustedly`,
    }
  }
};
const walls = {
  'keys': [ 'wall', 'walls' ],
  'verbs': {
    'look': 'The walls are unremarkable.'
  }
};
const floor = {
  'keys': [ 'floor', 'terrain' ],
  'verbs': {
    'look': 'The floor is unremarkable.'
  }
};
const ceiling = {
  'keys': [ 'ceiling', 'roof' ],
  'verbs': {
    'look': 'The ceiling is unremarkable'
  }
};
const useBinoculars = session => {
  if (session.room !== 'bluff-top') {
    return { message: `You see nothing special.` };
  }
  if (tryParse(session.flags.explore, 0) > 1) {
    return { message: `You don't find anything new.` };
  }
  return {
    message: 'You lift the binoculars to your eyes, searching the distance for only a moment before you spot your ambition. The tree from your dream, huge and gnarled, splits the canopy about a mile east of camp. To the south, a thin line of smoke rises from the bush. You update your map.',
    update: { flags: mapSet(session.flags, 'explore', '2') }
  };
}
function recipe(ailmentKeys:Array<string>, recipe:string) {
  return {
    'keys': flatMap(ailmentKeys, ailment => [ `recipe for ${ailment}`, `${ailment} recipe`, ailment]),
    'verbs': {
      'look': recipe,
      'take': new Synonym('look'),
      'use': new Synonym('look')
    }
  };
}
const herbNames = ['valerian', 'lavender', 'maypop', 'ginger', 'mint', 'garlic', 'echinacea'];
const ingredients = [ 
  ...herbNames, 
  ...herbNames.map(k => `p-${k}`),
  'valerian-lavender', 'valerian-lavender-heat'
];
const potpourriResult = (...consumed) => session => ({
  message: `That doesn't seem right. At least your results smell nice.`,
  update: { inventory: setMutate(session.inventory, [ 'potpourri' ], consumed.filter(Boolean)) }
});
function makePotpourri(herbKey?:string) {
  const useMap = {};
  for (let i of ingredients) {
    useMap[i] = potpourriResult(herbKey, i);
  }
  return useMap;
}
const herbs = {
  'valerian': {
    'id': 'valerian',
    'name': 'some valerian',
    'keys': [ 'valerian', 'valerian root' ],
    'verbs': {
      'look': 'Branched clusters of tiny pink flowers with pointed leaves.',
      'use': {
        'self': `You could process it, with the right tools.`,
        ...makePotpourri('valerian')
      }
    }
  },

  'lavender': {
    'id': 'lavender',
    'name': 'some lavender',
    'keys': [ 'lavender' ],
    'verbs': {
      'look': 'Whorls of purple flowers with feather-like leaves.',
      'use': {
        'self': `You could process it, with the right tools.`,
        ...makePotpourri('lavender')
      }
    }
  },

  'maypop': {
    'id': 'maypop',
    'name': 'some maypop',
    'keys': [ 'maypop', 'passion flower', 'passionflower', 'passion-flower', 'passion vine' ],
    'verbs': {
      'look': 'Extravagent violet flowers with palmate leaves.',
      'use': {
        'self': `You could process it, with the right tools.`,
        ...makePotpourri('maypop')
      }
    }
  },

  'ginger': {
    'id': 'ginger',
    'name': 'some ginger',
    'keys': [ 'ginger', 'ginger root', 'gingerroot' ],
    'verbs': {
      'look': 'Pale yellow flowers with long, broad leaves.',
      'use': {
        'self': `You could process it, with the right tools.`,
        ...makePotpourri('ginger')
      }
    }
  },

  'mint': {
    'id': 'mint',
    'name': 'some mint',
    'keys': [ 'mint', 'pepper mint', 'peppermint' ],
    'verbs': {
      'look': 'Small purple flowers with dark green toothed leaves.',
      'use': {
        'self': `You could process it, with the right tools.`,
        ...makePotpourri('mint')
      }
    }
  },

  'garlic': {
    'id': 'garlic',
    'name': 'some garlic',
    'keys': [ 'garlic' ],
    'verbs': {
      'look': 'Clustered white flowers with broad, grass-like leaves.',
      'use': {
        'self': `You could process it, with the right tools.`,
        ...makePotpourri('garlic')
      }
    }
  },

  'echinacea': {
    'id': 'echinacea',
    'name': 'some echinacea',
    'keys': [ 'echinacea', 'coneflower', 'cone flower' ],
    'verbs': {
      'look': 'Large, round flowers with narrow toothed leaves.',
      'use': {
        'self': `You could process it, with the right tools.`,
        ...makePotpourri('echinacea')
      }
    }
  }
};
const drowsyTree = `You begin to drowse, and the tree's branches swim in your vision. You find yourself mesmerized by the interplay of light and shadow as the woody tendrils sway in the misty breeze. And there, directly below, the cave yawns, extending deep into the earth like the gullet of an antediluvian worm.`;
const touchAmber = ss => ({
  message: `You place your hand on the glassy surface. The amber is warm to the touch, and your fingers tingle as if thawing from a deep-rooted cold. And then you are somewhere else. You stand on the edge of a wide pit, its depths churning with flickering shadows. Four huge stone pillars support the ceiling and, far above you, a rope descends from an opening in the arching rock. You blink. How long have you been here?`,
  update: { 
    room: 'pit', 
    effects: setAdd(ss.effects, 'giant') ,
    flags: mapSet(ss.flags, 'giant', 'kitchen-2')
  }
});
const catVoice = text => ({ text, pitch: Pitch.HIGH });
const childVoice = text => ({ text, pitch: Pitch.MED_HIGH });
//#endregion

const world:World = {
  'id': 'poc',
  'start': 'pantry',

  //#region Rooms
  'rooms': {

    //#region Pantry
    'pantry': {
      'name': 'the pantry',
      'description': 'You are in a cramped, dark space. Shelves line the walls, and dim light seeps through a door to the north.',
      'exits': {
        'north': 'kitchen'
      },
      'things': [floor, ceiling, {
        'keys': ['shelf', 'shelves', 'shelving', 'wall', 'walls', 'pantry'],
        'verbs': {
          'look': session => {
            const thread = session.gone.has('thread') ? '' : ' A large spool of thread rests in one corner.';
            return { message: `The shelves are littered with moldering foodstuffs.${thread}` };
          }
        }
      }, {
        'keys': [ 'door', 'light', 'kitchen', 'door to the north' ],
        'exit': 'north',
        'verbs': {
          'look': 'The door hangs slightly off its hinges, letting in a bit of feeble light.',
          'open': 'The door swings loosely',
          'close': 'The door swings loosely'
        }
      }, takeable({
        'id': 'thread',
        'name': 'the thread',
        'keys': ['thread', 'spool', 'spool of thread', 'large spool', 'large spool of thread', 'string'],
        'verbs': {
          'look': 'The spool looks to contain several yards of thread.'
        }
      }, 'thread', true), takeable({
        'keys': ['food', 'foodstuffs', 'foodstuff', 'food stuff', 'food stuffs', 'stuff'],
        'name': 'some mouldy food',
        'verbs': {
          'look': 'It\'s not very appetizing',
          'eat': `You don't want to eat that.`
        }
      }, 'food')]
    },
    //#endregion

    //#region Kitchen
    'kitchen': {
      'name': 'the kitchen',
      'description': 'You are in what appears to be a monstrous kitchen. Crude knives hang above a well-worn cuttingboard, and a large pot bubbles over an open fire. There is a pantry on the southern wall, next to a small cage. A doorway leads east.',
      'exits': {
        'south': 'pantry',
        'east': 'well'
      },
      'effect': session => {
        if (session.flags.stone === 'goblin' && session.flags.cage === 'open') {
          return {
            message: 'The tiny goblin leaps from the cage, disappearing with the stone.',
            update: { flags: mapRemove(session.flags, 'stone') }
          };
        }
        return  null;
      },
      'things': [walls, floor, ceiling, takeable({
        'name': 'a knife',
        'keys': ['knife', 'knives', 'crude knife', 'crude knives'],
        'verbs': {
          'look': 'The knives are large and pitted, and not very clean.'
        }
      }, 'knife'), {
        'keys': ['pot', 'large pot', 'bubbling pot', 'big pot', 'cauldron'],
        'verbs': {
          'look': session => {
            const cloth = session.gone.has('cloth') ? '' : ' A greasy cloth is draped over the lip.';
            return { message: `The pot is huge and rusted, and a foul-smelling liquid boils violently inside.${cloth}` }
          },
          'use': {
            'food': session => ({
              message: 'You drop the mouldy food into the pot',
              update: { inventory: setRemove(session.inventory, 'food') }
            }),
            'goblin': 'The goblin easily avoids you.'
          }
        }
      }, {
        'keys': ['fire', 'open fire', 'cooking fire', 'flame', 'flames'],
        'verbs': {
          'look': 'Rotten wood burns beneath the pot, hissing acrid black smoke.',
          'light': new Synonym('use'),
          'use': {
            'bone': `By itself, the bone isn't flammable.`,
            'cloth': `The greasy cloth would burn well, but you don't want to lose it.`,
            'torch': session => ({
              message: 'You hold your improvised torch in the fire until it catches',
              update: { inventory: setMutate(session.inventory, ['lit-torch'], ['torch']) }
            }),
            'lit-torch': `It's already lit.`
          }
        }
      }, {
        'keys': ['wood', 'rotten wood', 'log', 'stick', 'logs', 'sticks'],
        'verbs': {
          'look': `It's burning.`,
          'take': `It's too hot to pick up.`
        }
      }, {
        'keys': ['pantry', 'rickety pantry'],
        'exit': 'south',
        'verbs': {
          'look': 'The pantry is just large enough for a person to enter.',
          'open': 'The pantry door swings loosely.',
          'close': 'The pantry door swings loosely.'
        }
      }, {
        'keys': [ 'door', 'doorway', 'well', 'wellhouse', 'well house', 'well-house' ],
        'exit': 'east',
        'verbs': {
          'look': `It's less a door, and more an absence of wall.`
        }
      }, {
        'keys': ['cutting board', 'cuttingboard', 'board'],
        'verbs': {
          'look': 'The cuttingboard is a thick piece of knotted wood, deeply grooved from years of use.',
          'use': {
            'knife': 'You cut a few more notches into the board'
          }
        }
      }, takeable({
        'id': 'cloth',
        'name': 'the cloth',
        'keys': ['cloth', 'greasy cloth', 'rag', 'greasy rag'],
        'verbs': {
          'look': 'The cloth is a rough burlap, smeared with rancid fat.'
        }
      }, 'cloth', true), {
        'keys': ['liquid', 'boiling liquid' ],
        'verbs': {
          'look': 'It looks worse than it smells.',
          'eat': 'It tastes worse than it looks.'
        }
      }, {
        'keys': ['stone', 'rock', 'ruby', 'glowing stone', 'gem', 'jewel'],
        'visibility': session => session.flags.stone === 'cage',
        'verbs': {
          'look': 'The stone gleams inside the cage.',
          'take': session => {
            if (session.flags.cage !== 'open') {
              return { message: 'The cage door is closed.' };
            }
            if (session.inventory.has('stone')) {
              return { message: 'You already have a stone.' };
            }
            return {
              message: 'You take the stone out of the cage.',
              update: {
                inventory: setAdd(session.inventory, 'stone'),
                flags: mapRemove(session.flags, 'stone')
              }
            };
          }
        }
      }, {
        'keys': ['goblin', 'tiny goblin'],
        'visibility': session => session.flags.stone === 'goblin',
        'verbs': {
          'look': 'The goblin jitters nervously in the cage, clutching its stone tightly.',
          'talk': 'The goblin chitters angrily.',
          'tie': new Synonym('use'),
          'use': {
            'thread': session => {
              if (session.flags.cage === 'open') {
                return {
                  message: 'The goblin dodges past you, disappearing down the hall with its stone.',
                  update: { flags: mapRemove(session.flags, 'stone') }
                };
              }
              return {
                message: 'You tie one end of the thread securely to the goblin, and the other to the cage.',
                update: {
                  inventory: setRemove(session.inventory, 'thread'),
                  flags: mapSet(session.flags, 'thread', 'goblin')
                }
              };
            }
          }
        }
      }, locked({
        'keys': ['cage', 'small cage', 'lock', 'sturdy lock', 'cage door'],
        'name': 'the cage',
        'verbs': {
          'look': session => {
            if (session.flags.it !== 'freed') {
              return { message: 'Inside the cage, a strange creature huddles furtively.' };
            }

            const door = session.flags.cage === 'open' ? 'open' : 'closed';
            let contents;
            switch (session.flags.stone) {
              case 'cage':
                contents = 'There is a glowing stone in the cage.'; break;
              case 'goblin':
                contents = 'There is a tiny goblin in the cage.'; break;
              default:
                contents = 'The cage is empty.'
            }
            
            return { message: `${contents} The door is ${door}.` };
          },
          'open': session => {
            if (session.flags.cage === 'open') {
              return { message: 'The cage is already open.' };
            }
            if (!session.flags.cage) {
              return { message: 'The cage is secured with a sturdy lock, and will not open.' };
            }
            if (session.flags.thread === 'goblin') {
              return {
                message: 'You open the cage door and the goblin bursts out, trailing thread.',
                update: {
                  flags: mapSet(session.flags, { 'stone': null, 'cage': 'open' }),
                  effects: setMutate(session.effects, [ 'thread' ], [ 'goblin' ])
                }
              };
            }
            if (session.flags.stone === 'goblin') {
              return {
                message: 'You open the cage door and the goblin bursts out, fleeing with the stone.',
                update: { flags: mapSet(session.flags, { 'stone': null, 'cage': 'open' }) }
              };
            }
            if (session.flags.stone === 'cage' && session.effects.has('goblin')) {
              return {
                message: 'You open the cage and the tiny goblin jumps inside, grabbing for the stone.',
                update: {
                  flags: mapSet(session.flags, 'stone', 'goblin'),
                  effects: setRemove(session.effects, 'goblin')
                }
              };
            }
            if (session.flags.it !== 'freed') {
              return {
                message: `You lift the latch and open the cage door. The cat-thing inside leaps deftly out, landing atop the pantry. It stares at you from its perch and, when you blink, it is gone.`,
                update: {
                  flags: mapSet(session.flags, { 'it': 'freed', 'cage': 'open' }),
                  gone: setAdd(session.gone, 'creature')
                }
              };
            }
            return { 
              message: 'You open the cage.',
              update: { flags: mapSet(session.flags, 'cage', 'open') }
            };
          },
          'use': {
            'goblin': 'The goblin remains out of reach. Perhaps with some bait...',
            'stone': session => {
              if (session.flags.cage !== 'open') {
                return { message: 'The cage door is closed.' }
              }
              if (session.flags.stone === 'cage') {
                return { message: 'There is already a stone in the cage.' };
              }
              if (session.effects.has('goblin')) {
                return {
                  message: 'You place the stone in the cage. The goblin scampers inside after it.',
                  update: {
                    inventory: setRemove(session.inventory, 'stone'),
                    flags: mapSet(session.flags, 'stone', 'goblin'),
                    effects: setRemove(session.effects, 'goblin')
                  }
                };
              }
              return {
                message: 'You place the glowing stone in the cage.',
                update: {
                  inventory: setRemove(session.inventory, 'stone'),
                  flags: mapSet(session.flags, 'stone', 'cage')
                }
              };
            }
          }
        }
      }, { stateKey: 'cage', keyId: 'keys', unlockMessage: `You try three keys before one turns in the lock with a loud click. The caged creature's ears perk.`}), {
        'id': 'creature',
        'keys': ['creature', 'strange creature', 'it', 'cat', 'kitty' ],
        'verbs': {
          'look': 'The creature is cat-like, but covered in dark shining scales. Its face is unnervingly human, and it watches you with keen eyes.',
          'use': 'The cage imprisoning it is closed.',
          'untie': new Synonym('use'),
          'take': new Synonym('use'),
          'give': {
            'food': 'It looks at you, disgustedly.'
          },
          'talk': (session, world) => {
            if (session.flags['it']) {
              return { message: 'It just watches you, expectantly.' }
            }
            return {
              message: ssml(catVoice('"Oh, hello again."'))
                        .append('the creature chirps.')
                        .append(catVoice(`"Are you going to let me out now? You always let me out."`))
                        .build(),
              update: { flags: mapSet(session.flags, 'it', 'spoke') }
            };
          }
        }
      }],
      'phrases': [{
        keys: [ 'unlock cage', 'unlock the cage', 'unlock lock', 'unlock the lock', 'unlockcage'],
        action: 'use:keys:lock'
      }]
    },
    //#endregion

    //#region Wellhouse 
    'well': {
      'name': 'the wellhouse',
      'description': session => {
        const hound = session.flags.hound ? 'lies in the corner' : 'squats in the corner, gnawing at a large bone';
        return `In the center of this room is an old stone well, its rope descending deep below the rocky floor. A beastly hound ${hound}. There are doors to the west and south and, behind the hound, a hall stretches north.`;
      },
      'exits': session => { 
        return {
          'west': 'kitchen',
          'south': 'tunnel',
          'north': session.inventory.has('lit-torch') ? 'bedroom-lit' : 'bedroom'
        }; 
      },
      'locks': {
        'south': session => session.flags.door ? null : `The door is locked, and won't open.`,
        'north': session => session.flags.hound ? null : `The hound snaps at you, and you reconsider.`
      },
      'things': [walls, floor, ceiling, {
        'keys': [ 'well', 'stone well', 'old well', 'old stone well', 'crank', 'large crank', 'wooden crank', 'large wooden crank' ],
        'verbs': {
          'move': 'The well is too narrow to fit inside',
          'use': {
            'self': ss => ({
              message: `You spin the crank, and the rope ${ss.flags.well === 'up' ? 'lowers' : 'rises'}.`,
              update: { flags: mapSet(ss.flags, 'well', ss.flags.well === 'up' ? 'down' : 'up') }
            }),
            'stone': ss => ({
              message: 'You toss the stone down the well, and its light fades from view.',
              update: { inventory: setRemove(ss.inventory, 'stone') }
            })
          },
          'look': 'The well is narrow, and constructed of natural stone with a large wooden crank supporting a coil of thick rope. A sizable bell is secured to the crankshaft.'
        }
      }, {
        'keys': [ 'rope', 'long rope', 'well rope' ],
        'verbs': {
          'move': `The rope is damp and slippery, and you can't get a good grip.`,
          'use': new Synonym('move'),
          'look': ss => ({ 
            message: ss.flags.well === 'up' 
              ? 'At the end of the rope is a crude iron hook. Nothing hangs from it.'
              : 'The end of the rope is obscured in darkness, well below the chamber floor.' 
          })
        }
      }, {
        'keys': [ 'bell', 'sizeable bell', 'large bell' ],
        'verbs': {
          'look': 'The bell is heavy and broad. It looks quite loud.',
          'use': 'The bell clangs loudly.',
          'take': `You try to pull the bell off the crankshaft, but it doesn't budge.`
        }
      }, {
        'keys': [ 'hook', 'iron hook', 'crude iron hook', 'crude hook' ],
        'visibility': ifFlagIs('well', 'up'),
        'verbs': {
          'look': 'A crescent of roughly shaped iron hangs from the end of the rope.'
        }
      }, locked({
        'keys': [ 'door', 'locked door', 'south door', 'southern door', 'door to the south', 'stone door', 'south' ],
        'name': 'the door',
        'exit': 'south',
        'verbs': {
          'look': session => {
            const lock = session.flags.door ? 'unlocked' : 'locked';
            return { message: `The southern door is made of heavy stone. It is ${lock}.` }
          }
        }
      }, { stateKey: 'door', keyId: 'keys', unlockMessage: 'The second key on the ring turns, and the southern door unlocks.' }), {
        'keys': [ 'hall', 'hallway' ],
        'exit': 'north',
        'verbs': {
          'look': ({ flags: { hound }}) => {
            if (!hound) {
              return { message: 'Your vision of the hallway is blocked by the massive hound.' }
            }
            return { message: 'The hallway is unlit, leading into total darkness.' }
          }
        }
      }, {
        'keys': ['hound', 'beastly hound', 'beast', 'dog', 'wolf'],
        'verbs': {
          'look': session => {
            if (session.flags.hound === 'dead') {
              const bone = session.gone.has('dog-bone') ? '' : ' next to a gnawed bone';
              return { message: `The hound lies, unmoving, on the floor${bone}. Its fur is matted with dark blood.` }
            }
            if (session.flags.hound === 'fed') {
              const bone = session.gone.has('dog-bone') ? '' : ', its bone forgotten';
              return { message: `The hound looks back at you adoringly${bone}.`}
            }
            return { message: 'The hound is twice the size it should be, and gnaws erratically on a long bone. It is chained to the wall with a short loop of iron links, but watches you hungrily.' }
          },
          'talk': session => {
            if (session.flags.hound === 'dead') {
              return { message: `The hound doesn't respond.` };
            }
            if (session.flags.hound === 'fed') {
              return { message: `The hound yips in response.` };
            }
            return { message: 'The hound snarls in response.' };
          },
          'use': {
            'self': session => {
              if (session.flags.hound === 'dead') {
                return { message: `The hound doesn't react.` };
              }
              if (session.flags.hound === 'fed') {
                return { message: 'You scratch the hound behind its ears.' };
              }
              return { message: 'The hound snaps at you, and you reconsider.' };
            },
            'knife': session => {
              if (session.flags.hound === 'dead') {
                return { message: 'The hound is already dead.' };
              }
              const bone = session.gone.has('dog-bone') ? '' : ' The bone it was gnawing clatters to the ground.'
              return {
                message: `The hound is massive but chained, and you easily out-maneuver it. Your knife slips between its ribs, and its life pours hotly onto the floor.${bone}`,
                update: { flags: mapSet(session.flags, 'hound', 'dead') }
              }
            },
            'food': session => { 
              if (session.flags.hound === 'dead') {
                return { message: `The hound doesn't react.` }
              }
              if (session.flags.hound === 'fed' ) {
                return { message: 'The hound is already sated.' };
              }
              return {
                message: `The hound snaps up the food greedily, discarding the bone. Its demeanor softens.`,
                update: {
                  inventory: setRemove(session.inventory, 'food'),
                  flags: mapSet(session.flags, 'hound', 'fed')
                }
              }
            }
          },
          'attack': new Synonym('use'),
          'give': new Synonym('use')
        }
      }, {
        'keys': ['chain', 'links'],
        'verbs': {
          'look': 'The chain looks secure'
        }
      }, {
        'keys': ['bone', 'bones', 'long bone', 'gnawed bone', 'femur', 'long femur', 'gnawed femur', `hound's bone`, `dog's bone`],
        'id': 'dog-bone',
        'verbs': {
          'look': 'The bone looks like a human femur. Small scraps of meat still cling to it.',
          'take': session => {
            if (!session.flags.hound) {
              return { message: `The hound snaps at you, and you reconsider.` };
            }
            return {
              message: 'You take the bone',
              update: {
                gone: setAdd(session.gone, 'dog-bone'),
                inventory: setAdd(session.inventory, 'bone')
              }
            };
          }
        }
      }, {
        'keys': [ 'kitchen' ],
        'exit': 'west',
        'verbs': {
          'look': `The kitchen is to the west.`
        }
      }, {
        'keys': [ 'bedroom', 'bed room' ],
        'exit': 'north',
        'verbs': {
          'look': `The bedroom is to the north.`
        }
      }, {
        'keys': [ 'tunnel', 'maze', 'mossy tunnel' ],
        'exit': 'south',
        'verbs': {
          'look': 'The tunnels are to the south.'
        }
      }],
      'phrases': [{
        keys: ['feed the dog', 'feed the hound', 'feed dog', 'feed hound', 'feed the beastly hound'],
        action: 'give:food:dog'
      }, {
        keys: ['unlock door', 'unlock the door', 'unlock south door', 'unlock the south door', 'unlock the southern door'],
        action: 'use:key:door'
      }]
    },
    //#endregion

    //#region Darkness
    'bedroom': {
      'name': 'darkness',
      'description': 'It is too dark to see. A loud, rhythmic rumbling fills the room. Faint light outlines a hall to the south.',
      'things': [{
        'keys': ['hall', 'hallway', 'well', 'wellhouse', 'well house', 'well-house'],
        'exit': 'south',
        'verbs': {
          'look': 'The hall leads south.'
        }
      }],
      'exits': {
        'south': 'well'
      }
    },
    //#endregion Bedroom

    //#region Bedroom-lit
    'bedroom-lit': {
      'name': 'the bedroom',
      'description': `Illuminated by torchlight, you can see that you are in a small bedroom. Immediately in front of you, a bog giant snores loudly atop a bed of filthy straw. Against the back wall is a heavy wooden trunk. A hallway leads south.`,
      'things': [walls, floor, ceiling, {
        'keys': ['hall', 'hallway', 'well', 'wellhouse', 'well house', 'well-house'],
        'exit': 'south',
        'verbs': {
          'look': 'The hall leads south.'
        }
      }, locked({
        'name': 'the trunk',
        'keys': ['trunk', 'wooden trunk', 'heavy wooden trunk', 'chest', 'wooden chest', 'heavy wooden chest', 'lid'],
          'verbs': {
            'look': session => ({ message: session.flags.trunk === 'open' 
                ? 'The trunk is filled with glowing red stones.' 
                : `The trunk is made from thick wooden boards, banded with rusting iron. The wood is swollen from moisture, and bits of moss are growing in the seams. The lid is closed.` }),
            'use': {
              'stone': session => {
                if (session.flags.trunk !== 'open') {
                  return { message: 'The trunk is closed.' };
                }
                return {
                  message: 'You return the stone to the trunk.',
                  update: { inventory: setRemove(session.inventory, 'stone') }
                };
              }
            }
          }
      }, { stateKey: 'trunk', keyId: 'keys', unlockMessage: 'The lock fits the first key you try, and clicks open.' }), {
        'keys': [ 'moss' ],
        'verbs': {
          'look': 'The moss grows in the seams of a large wooden trunk.'
        }
      }, takeable({
        'name': 'a glowing stone',
        'keys': ['stone', 'stones', 'redstone', 'redstones', 'red stone', 'red stones', 'glowing stone', 'glowing red stone', 'ruby', 'rubies', 'all the stones', 'all of the stones', 'more stones', 'another stone'],
        'visibility': session => session.flags.trunk === 'open',
        'verbs': {
          'look': 'The stones are walnut-sized, and glitter brilliantly in the torchlight.'
        }
      }, 'stone'), takeable({
        'name': 'some filthy straw',
        'keys': ['straw', 'bed', 'bed of straw', 'straw bed', `giant's bed`, 'filthy straw', 'bed of filthy straw'],
        'verbs': {
          'look': session => {
            const keys = session.flags.belt && !session.gone.has('keys') ? ' A large keyring is nestled amongst the filth.' : '';
            return { message: `The straw smells awful but the giant, sprawled in the center, doesn't seem to care.${keys}` };
          },
          'use': {
            'lit-torch': `You're quite certain that the giant would kill you.`
          }
        }
      }, 'straw'), {
        'keys': ['giant', 'bog giant', 'beast', 'monster', 'creature'],
        'verbs': {
          'look': session => {
            const belt = session.flags['belt'] ? '' : ` Around its waist is tied a belt of rough twine, from which hangs a large key-ring.`;
            return { message: `The giant is enormous, with wide drooping features and a ponderous girth. Its hide is the texture of waterlogged driftwood, and is stippled with patches of multicoloured lichens.${belt}` };
          },
          'use': {
            'knife': `You're quite certain that the giant would kill you.`,
            'self': `You're quite certain that the giant would kill you.`
          },
          'attack': new Synonym('use'),
          'talk': new Synonym('use')
        }
      }, {
        'keys': ['belt', 'twine', 'twine belt', `giant's belt`],
        'verbs': {
          'look': session => ({ message: session.flags['belt'] 
              ? 'The belt has been split, but remains trapped beneath the giant.' 
              : `A length of hempen twine loops around the giant's waist, supporting a large key-ring.` }),
          'take': session => ({ message: session.flags['belt'] 
              ? `The sleeping giant's bulk holds it in place.` 
              : `The belt is tied securely around the giant's waist.` }),
          'untie': 'The knot is tied too tightly for human hands.',
          'attack': new Synonym('use'),
          'use': {
            'knife': session => {
              if (session.flags['belt']) {
                return { message: `It's already been cut.` };
              }
              return {
                message: 'You carefully slip the knife beneath the twine and pull. It catches for a moment but then the belt gives way, spilling the key-ring into the straw.',
                update: { flags: mapSet(session.flags, 'belt', 'cut') }
              };
            }
          }
        }
      }, {
        'keys': ['keyring', 'key-ring', 'key ring', 'large keyring', 'keys', 'key', `giant's keyring`, `giant's keys`],
        'id': 'keys',
        'verbs': {
          'look': session => {
            const belt = session.flags['belt'] ? '' : ` The keyring is threaded onto the giant's belt.`;
            return { message: `An iron ring holds a handful of misshapen keys.${belt}` };
          },
          'take': session => {
            if (session.flags['belt']) {
              return {
                message: 'You take the keys.',
                update: {
                  inventory: setAdd(session.inventory, 'keys'),
                  gone: setAdd(session.gone, 'keys')
                }
              }
            }
            return { message: `The giant's belt loops through the key-ring, holding it in place.` };
          },
          'use': {
            'self': `The giant's belt loops through the key-ring, holding it in place.`,
            'knife': `You can't cut the iron key-ring. Perhaps something else?`
          }
        }
      }, {
        'keys': ['lichen', 'lichens', 'multicoloured lichens', 'multicolored lichens', 'multicoloured lichen', 'multicolored lichen'],
        'verbs': {
          'look': 'The lichens are numerous and varied, ranging in colour from dull green to brilliant crimson.'
        }
      }],
      'phrases': [{
        'keys': [ 'unlock the trunk', 'unlock trunk', 'unlock the wooden trunk', 'unlock the heavy trunk', 'unlock the heavy wooden trunk', 'unlock the chest', 'unlock the wooden chest', 'unlock the heavy chest', 'unlock the heavy wooden chest'],
        'action': 'use:key:trunk'
      }, {
        'keys': [ 'wake the giant', 'wake up the giant', 'wake the bog giant', 'wake up the bog giant'],
        'action': 'use:giant'
      }],
      'exits': {
        'south': 'well'
      }
    },
    //#endregion Bedroom-lit

    //#region Mossy Tunnel
    'tunnel': {
      'name': 'a mossy tunnel',
      'description': `You are in a cavernous tunnel. On the walls, bioluminescent moss glows faintly. There is a door to the north, and the passage continues to the south. Tiny goblins dart about your feet, visible only for a moment before vanishing deeper into darkness.`,
      'exits': session => { 
        return {
          'north': 'well',
          'south': session.effects.has('thread') ? 'maze-1' : 'maze'
        }; 
      },
      'effect': session => {
        if (!session.inventory.has('stone') || session.effects.has('goblin') || session.effects.has('thread')) {
          return { message: '', update: { flags: mapRemove(session.flags, 'lost') } };
        }
        return {
          message: 'The goblins appear entranced by your glowing stone, and begin trailing you.',
          update: {
            effects: setAdd(session.effects, 'goblin'),
            flags: mapRemove(session.flags, 'lost')
          }
        };
      },
      'things': [floor, ceiling, goblins, {
        'keys': [ 'moss', 'bioluminescent moss', 'bioluminescence', 'walls', 'wall', 'moss on the wall', 'moss on the walls' ],
        'verbs': {
          'look': 'The moss covers large swaths of the rock walls, and emits a soft green light.',
          'take': `You don't need the moss.`
        }
      }, {
        'keys': [ 'gravel' ],
        'verbs': {
          'look': 'Fragments of rock litter the tunnel floor.'
        }
      }, {
        'keys': [ 'dark', 'darkness' ],
        'exit': 'south',
        'verbs': {
          'look': `You don't see much.`
        }
      }, {
        'keys': [ 'well', 'wellhouse', 'well house', 'well-house' ],
        'exit': 'north',
        'verbs': {
          'look': 'The wellhouse is to the north.'
        }
      }]
    },
    //#endregion

    //#region Maze
    'maze': {
      'name': 'a maze',
      'leaveMessage': (to, _) => {
        if (to === 'tunnel') {
          return `Somehow, you find yourself back at the maze's entrance.`;
        }
        return random([
          `You get turned around.`,
          `You lose your bearings.`,
          `You are hopelessly lost.`
        ])
      },
      'things': [ walls, ceiling, goblins, {
        'keys': [ 'rock' ],
        'verbs': {
          'take': `You don't want the rock.`,
          'look': `Does it look familiar? Maybe not...`,
          'use': {
            'thread': `Tethering a rock won't do any good.`
          }
        }
      }, {
        'keys': [ 'door', 'tunnel', 'tunnels', 'floor', 'ground' ],
        'verbs': {
          'look': `This tunnel looks the same as every other tunnel. You realize that you are hopelessly lost.`,
          'use': {
            'thread': `Tethering that won't do any good.`
          }
        }
      } ],
      'effect': session => { 
        const lost = isNaN(session.flags.lost) ? 0 : parseInt(session.flags.lost);
        return {
          message: lost < 2 ? random([
            `The goblins seem to know where they're going.`, 
            'Are you moving in circles?', 
            'The tunnels all look the same.'
          ]) : 'This tunnel looks familiar.',
          update: { flags: mapSet(session.flags, 'lost', String(Math.min(3, lost + 1))) }
        }; 
      },
      'description': 'The tunnels here are twisting and elusive. Tiny goblins skitter purposefully to and fro. Passages extend in all directions.',
      'exits': session => {
        const dest = parseInt(session.flags.lost) >= 3 ? 'tunnel' : 'maze';
        return {
          'north': dest,
          'east': dest,
          'south': dest,
          'west': dest
        }; 
      }
    },
  // 'maze-1': 'east',
  // 'maze-2': 'north',
  // 'maze-3': 'west'
    'maze-1': {
      'name': 'a maze',
      'description': 'The tunnels here are twisting and elusive. Tiny goblins skitter purposefully to and fro. Passages extend in all directions.',
      'things': [ goblins ],
      'exits': {
        'north': 'maze',
        'south': 'maze',
        'east': 'maze-2',
        'west': 'maze'
      }
    },
    'maze-2': {
      'name': 'a maze',
      'description': 'This tunnel looks the same as all the rest, but the flow of goblins is increasing. Passages extend in all directions.',
      'things': [ goblins ],
      'exits': {
        'north': 'maze-3',
        'south': 'maze',
        'east': 'maze',
        'west': 'maze'
      }
    },'maze-3': {
      'name': 'a maze',
      'description': 'The air in this tunnel is cleaner, and you think you hear scraps of birdsong. The goblins are all around. Passages extend in all directions.',
      'things': [ goblins ],
      'exits': {
        'north': 'maze',
        'south': 'maze',
        'east': 'maze',
        'west': 'mouth'
      }
    },
    //#endregion

    //#region Cave Mouth
    'mouth': {
      'name': 'the mouth of a cave',
      'description': session => {
        const goblin = session.flags.goblin ? '' : ' Just ahead, a tiny goblin struggles at the end of a thread extending back into darkness.';
        return `Before you, the tunnel ends abruptly in a verdant bloom of flora. Daylight streams between hanging vines, casting long shadows on the rocky footing.${goblin} The cave opens to the west, and a tunnel leads back to the east.`;
      },
      'exits': {
        'east': 'tunnel',
        'west': 'swamp-dream'
      },
      'things': [walls, floor, ceiling, {
        'keys': ['goblin', 'tiny goblin', 'sruggling goblin', 'thread', 'string', 'tether', 'knot'],
        'visibility': session => !session.flags.goblin,
        'verbs': {
          'look': 'The goblin thrashes about at the end of its tether.',
          'untie': new Synonym('use'),
          'take': new Synonym('use'),
          'talk': 'The goblin chitters angrily.',
          'use': session => ({
            message: 'You untie the squirming goblin, and it sprints off into the underbrush.',
            update: { flags: mapSet(session.flags, 'goblin', 'freed') }
          })
        }
      }, {
        'keys': ['vines', 'hanging vines', 'flora', 'plants', 'ferns', 'underbrush', 'exit', 'mouth', 'mouth of the cave', 'cave mouth', 'sunlight', 'light', 'daylight', 'sun', 'outside'],
        'exit': 'west',
        'verbs': {
          'look': 'The mouth of the cave is choked with hanging vines and large-leafed ferns, rustling gently with the inward current.'
        }
      }]
    },
    //#endregion

    //#region Swamp Dream
    'swamp-dream': {
      'name': 'a swamp',
      'effect': session => ({
        message: `You start in your sleeping bag, briefly disoriented. The same dream, every night, for the past twenty-eight weeks. The heat of the day is already upon you, and large insects drone outside the tent walls. The swamp, you remember. You're finally here.`,
        update: { room: 'tent', inventory: new Set() }
      }),
      'description': `You emerge from the cave into a dense swamp. Behind you, its roots framing the mouth of the cave, a huge gnarled tree rises above the canopy. Sunlight flickers through the tree's branches, and you squint against the sudden brightness. Defiantly, the light continues to fill your vision until the image of the swamp is just a memory. Until the memory, too, is gone...`,
      'things': [],
      'exits': {}
    },
    //#endregion

    //#region Tent
    'tent': {
      'name': 'your tent',
      'description': session => {
        const pack = !session.gone.has('pack') ? 'Your expedition pack sits in one corner, and a' : 'A';
        return `The tent is close and stifling. ${pack} zippered flap opens to the east.`
      },
      'things': [{
        'id': 'pack',
        'keys': ['pack', 'backpack', 'back pack', 'expedition pack'],
        'verbs': {
          'look': 'The backpack is ultralight, with a springsteel frame and numerous straps. It is full of useful equipment.',
          'open': new Synonym('take'),
          'take': session => ({
            message: 'You strap the pack onto your shoulders. It contains supplies gathered over countless weeks of rigourous preparation, including some rope, a map, and a multitool.',
            update: {
              inventory: setAdd(session.inventory, 'rope', 'map', 'multitool'),
              gone: setAdd(session.gone, 'pack')
            }
          })
        }
      }, {
        'exit': 'east',
        'keys': ['flap', 'tent flap', 'door', 'tent door'],
        'verbs': {
          'look': 'A thin layer of nylon between you and the morass.',
          'open': 'You unzip the tent.',
          'close': 'You zip up the tent.'
        }
      }, {
        'keys': [ 'bag', 'sleeping bag', 'sleepingbag' ],
        'verbs': {
          'open': 'You unzip the sleeping bag.',
          'close': 'You zip the sleeping bag.',
          'look': `The sleeping bag is light and brightly coloured. It's just big enough for one.`,
          'use': session => ({
            message: `${session.effects.has('drugged') ? 'Tired as you are, y' : 'Y'}our body is filled with restless energy, and you can't sleep.`
          })
        }
      }, {
        'keys': [ 'swamp' ],
        'exit': 'east',
        'verbs': {
          'look': `You can't see the swamp from inside the tent.`
        }
      }],
      'exits': {
        'east': 'camp'
      },
      'phrases': [{
        'keys': [ 'take a nap', 'nap', 'fall asleep', 'go to sleep', 'lie down', 'lay down' ],
        'action': 'use:sleeping bag'
      }]
    },
    //#endregion

    //#region Camp
    'camp': {
      'name': 'camp',
      'description': message('The camp is situated on a low rise, somewhat protected from the sucking mire that surrounds it. Nearby, a jeep is buried up to its doors in mud. Your tent is pitched on the western slope')
                      .append(ifFlagGTE('explore', 1), '. On your map is marked a bluff to the north')
                      .append(ifFlagGTE('explore', 2), ', the tree to the east')
                      .append(both(ifFlagGTE('explore', 2), not(ifSeen('garden'))), ', and mysterious smoke to the south')
                      .append(both(ifFlagGTE('explore', 2), ifSeen('garden')), ', and a cabin to the south')
                      .append('.')
                      .build,
      'exits': map({ 'west': 'tent' })
                .and(ifFlagGTE('explore', 1), 'north', 'bluff')
                .and(ifFlagGTE('explore', 2), 'east', 'tree')
                .and(ifFlagGTE('explore', 2), 'south', 'garden')
                .build,
      'things': [{
        'keys': [ 'tent' ],
        'exit': 'west',
        'verbs': {
          'look': 'The tent is made of lightweight nylon, and hugs the ground like the cocoon of some enormous insect.'
        }
      }, {
        'keys': [ 'jeep', 'stuck jeep', 'buried jeep', 'wheels', 'algae' ],
        'verbs': {
          'take': new Synonym('use'),
          'use': 'The jeep is thoroughly stuck.',
          'look': [
            text('The jeep is dented, and spattered with mud and algae. Its wheels have sunk completely into the sodden terrain.'),
            maybeDo(ifHere('binoculars'), `A pair of binoculars sits on the driver's seat.`)
          ]
        }
      }, takeable({
        'name': 'the binoculars',
        'keys': [ 'binoculars', 'pair of binoculars' ],
        'verbs': {
          'look': 'The binoculars are new, but grime already cakes the hinges.'
        }
      }, 'binoculars', true), {
        'keys': [ 'swamp', 'mire', 'morass', 'bog', 'terrain', 'mud', 'ground', 'trees', 'vines', 'sucking mire' ],
        'verbs': {
          'look': `The swamp is a vast bed of loamy muck, hooded by a dense tangle of stunted trees and creeping vines. Navigating it will be treacherous if you don't know where you're going.`
        }
      }, {
        'keys': [ 'bluff', 'cliff' ],
        'visibility': ifFlagGTE('explore', 1),
        'exit': 'north',
        'verbs': {
          'look': `It's just to the north.`
        }
      }, {
        'keys': [ 'tree', 'gnarled tree', 'huge tree' ],
        'visibility': ifFlagGTE('explore', 2),
        'exit': 'east',
        'verbs': {
          'look': `It's an hour's hike to the east.`
        }
      }, {
        'keys': [ 'smoke', 'mysterious smoke', 'cabin', 'house', 'garden' ],
        'visibility': ifFlagGTE('explore', 2),
        'exit': 'south',
        'verbs': {
          'look': `It's somewhere to the south.`
        }
      }]
    },
    //#endregion

    //#region Bluff
    'bluff': {
      'article': 'at',
      'name': 'the foot of a bluff',
      'description': message('Rising out of the swamp, a tall bluff presents a sheer face of dripping stone. Small rocks pebble the ground, having fallen from above, and tenacious trees cling to the upper ridge. ')
                      .append(ifFlagIs('bluff', 'roped'), 'A rope scales the rock face to the north, and y', 'Y')
                      .append('our camp lies to the south.')
                      .build,
      'exits': map({ 'south': 'camp' })
                .and(ifFlagIs('bluff', 'roped'), 'north', 'bluff-top')
                .build,
      'things': [{
        'visibility': session => !!session.flags.bluff,
        'keys': [ 'rope', 'up' ],
        'exit': 'north',
        'verbs': {
          'look': 'The rope dangles from a tree atop the bluff.',
          'take': `The rope won't come down.`
        }
      }, {
        'keys': [ 'bluff', 'cliff', 'face', 'cliff face', 'up' ],
        'verbs': {
          'look': 'The bluff is thirty feet high, composed mainly of shale rock, and crowned with squat trees. Moisture glistens on its surface, making the prospect of a climb quite dangerous.',
          'tie': new Synonym('use'),
          'attack': new Synonym('use'),
          'use': {
            'self': `Your hands can't find purchase on the slick rock.`,
            'rope': `The rope falls limply at your feet.`,
            'weighted-rope': `The weighted rope clatters off the rock face, and lands at your feet.`
          }
        }
      }, {
        'keys': [ 'tree', 'trees', 'tenacious tree', 'tenacious trees' ],
        'verbs': {
          'look': 'The trees at the top of the bluff are woody and rugged, with thick trunks and grasping branches.',
          'tie': new Synonym('use'),
          'attack': new Synonym('use'),
          'use': {
            'self': `You can't reach the trees.`,
            'rope': 'The rope falls limply at your feet.',
            'weighted-rope': session => ({
              message: 'You hurl the rope at a particularly sturdy-looking tree, and it snags tightly in the branches.',
              update: {
                inventory: setRemove(session.inventory, 'weighted-rope'),
                flags: mapSet(session.flags, 'bluff', 'roped')
              }
            })
          }
        }
      }, takeable({
        'keys': [ 'rock', 'rocks', 'stone', 'stones', 'shale', 'pebble', 'pebbles', 'small rocks', 'small rock'],
        'name': 'a rock',
        'verbs': {
          'look': 'Flakes of fallen shale litter the ground.',
          'tie': new Synonym('use'),
          'use': {
            'rope': session => ({
              message: 'You lash a stone to the end of your rope.',
              update: {
                inventory: setMutate(session.inventory, [ 'weighted-rope' ], [ 'rope' ])
              }
            }),
            'weighted-rope': 'The rope is already weighted.'
          }
        }
      }, 'shale'), {
        'keys': [ 'camp', 'campsite', 'camp site' ],
        'exit': 'south',
        'verbs': {
          'look': 'It is just to the south.'
        }
      }]
    },
    //#endregion

    //#region Bluff Top
    'bluff-top': {
      'article': 'on',
      'name': 'the top of a bluff',
      'description': 'At its top, the bluff is rocky and sparse. Below you, the swamp spreads wide across the horizon, thick and dark and alive.',
      'exits': { 'south': 'bluff' },
      'things': [{
        'keys': [ 'rope', 'down' ],
        'exit': 'south',
        'verbs': {
          'look': 'The rope hangs down the edge of the bluff.',
          'take': 'The rope is hopelessly tangled in a tree.'
        }
      }, {
        'keys': [ 'horizon', 'swamp', 'sky' ],
        'verbs': {
          'look': `You think you can make something out on the horizon, but it's not clear.`,
          'use': {
            'binoculars': useBinoculars
          }
        }
      }, {
        'keys': [ 'camp', 'campsite', 'camp site' ],
        'verbs': {
          'look': 'The bright colours of your tent peek through the trees below.'
        }
      }, {
        'keys': [ 'smoke', 'line of smoke', 'thin line of smoke', 'thin smoke' ],
        'visibility': ifFlagGTE('explore', 2),
        'verbs': {
          'look': 'The smoke traces a thin wavering line into the sky.'
        }
      }, {
        'keys': [ 'tree', 'gnarled tree', 'huge tree', 'big tree' ],
        'visibility': ifFlagGTE('explore', 2),
        'verbs': {
          'look': 'The tree is taller by half than anything around it, and its dull bark contrasts starkly against the verdant backdrop.'
        }
      }],
      'phrases': [{
        'keys': [ 'go down' ],
        'action': 'move:south'
      }]
    },
    //#endregion

    //#region Tree
    'tree': {
      'article': 'by',
      'name': 'the gnarled tree',
      'effect': maybeDo(not(ifEffect('drugged')), once('The land beneath the tree is unbroken, lacking even a trace of the cave from your dreams. In its place is a peculiar itch in the back of your mind. Desire, tinged with a deep sensation of loss.', 'tree')),
      'description': message('You stand at the base of a huge gnarled tree, its roots ')
                      .append(ifEffect('drugged'), 
                        'perfectly framing the mouth of a deep cave, descending to the east. ', 
                        'embedded in a rocky outcropping like veins of a strange precious metal. ')
                      .append('Camp is to the west, and ')
                      .append(both(ifFlagGTE('explore', 2), not(ifSeen('garden'))), 'the mysterious smoke ')
                      .append(both(ifFlagGTE('explore', 2), ifSeen('garden')), 'the cabin ')
                      .append('is roughly to the south')
                      .append('.')
                      .build,
      'exits': map({ 'west': 'camp', 'south': 'garden' })
                .and(ifEffect('drugged'), 'east', 'cave')
                .build,
      'things': [{
        'keys': [ 'tree', 'gnarled tree', 'huge tree', 'big tree' ],
        'verbs': {
          'look': session => ({
            message: session.effects.has('drugged') 
                      ? drowsyTree 
                      : 'The tree looms over you like the skeleton of a long-dead horror. Its branches are bare and twisted, and coated with a scabrous ashen bark. Nothing grows nearby.'
          })
        }
      }, {
        'keys': [ 'cave' ],
        'visibility': ifEffect('drugged'),
        'exit': 'east',
        'verbs': {
          'look': 'The cave, etched in stone, plunges past the roots of the tree, deep beneath the swamp. It has always been here.'
        }
      }, {
        'keys': [ 'land', 'ground', 'rock', 'outcropping', 'roots', 'rocky outcropping', 'cave', 'soil' ],
        'verbs': {
          'look': session => ({
            message: session.effects.has('drugged') 
                      ? drowsyTree 
                      : 'The land beneath the tree is unbroken, lacking even a trace of the cave from your dreams. In its place is a peculiar itch in the back of your mind; desire, tinged with a deep feeling of loss.'
          })
        }
      }, {
        'keys': [ 'camp', 'campsite', 'camp site' ],
        'exit': 'west',
        'verbs': {
          'look': `It is an hour's hike to the west.`
        }
      }, {
        'keys': [ 'smoke', 'mysterious smoke', 'cabin', 'house', 'garden' ],
        'exit': 'south',
        'verbs': {
          'look': `It is somewhere to the south.`
        }
      }]
    },
    //#endregion

    //#region Garden
    'garden': {
      'name': 'an overgrown garden',
      'description': 'This area of the swamp was, at one time, a curated garden. Flowering plants, vegetables, and herbs, once in neat rows, now spill across their bounds, forming a thick fragrant tapestry. Smoke rises from the chimney of an old cabin to the west. Camp is to the north, and the tree is roughly east.',
      'exits': {
        'north': 'camp',
        'east': 'tree',
        'west': 'cabin'
      },
      'things': [{
        'keys': [ 'plants', 'herbs', 'garden', 'flowers', 'flowering plants' ],
        'verbs': {
          'look': 'Flowers and herbs of all kinds adorn the neglected garden.',
          'take': `You'll need to know what you're looking for.`
        }
      }, {
        'keys': [ 'tree', 'gnarled tree', 'huge tree' ],
        'exit': 'east',
        'verbs': {
          'look': `It's somewhere to the east.`
        }
      }, {
        'keys': [ 'camp', 'camp site', 'campsite' ],
        'exit': 'north',
        'verbs': {
          'look': `It's a ways to the north.`
        }
      }, {
        'keys': [ 'cabin', 'old cabin', 'smoke', 'chimney', 'inside', 'house' ],
        'exit': 'west',
        'verbs': {
          'look': `The cabin is small, with sun-bleached paint peeling from weathered wood walls. A thin trail of smoke rises from the chimney.`
        }
      },
      takeable(herbs.valerian, 'valerian'),
      takeable(herbs.lavender, 'lavender'),
      takeable(herbs.maypop, 'maypop'),
      takeable(herbs.ginger, 'ginger'),
      takeable(herbs.mint, 'mint'),
      takeable(herbs.garlic, 'garlic'),
      takeable(herbs.echinacea, 'echinacea')
      ]
    },
    //#endregion

    //#region Cabin
    'cabin': {
      'name': 'a small cabin',
      'description': 'The interior of the cabin is warm and dank. A woman sits by the only window, watching you intently. A faded hutch rests against one wall, and a door to the east leads outside.',
      'exits': { 'east': 'garden' },
      'things': [{
        'keys': [ 'woman', 'lady', 'girl', 'person', 'her', 'them' ],
        'verbs': {
          'look': 'The woman is neither old nor young, with long stringy hair and a tired complexion. She stares back at you, tenuous and wistful.',
          'talk': ssml(`"It took my little boy while I was out." the woman says. "The tree. You know the one I mean. If anyone's here, it's because of that tree."`)
                  .pause(1)
                  .append(`Her eyes lock with yours, and her tone hardens. "He always was a dreamer, poor child. That's how it gets in. But all paths run two ways."`)
                  .build()
        }
      }, {
        'keys': [ 'door', 'outside', 'garden' ],
        'exit': 'east',
        'verbs': {
          'look': 'The door leads outside.'
        }
      }, {
        'keys': [ 'window', 'only window' ],
        'verbs': {
          'look': 'The window looks out over the garden, and is the sole source of light in the cabin.'
        }
      }, {
        'keys': [ 'hutch', 'weathered hutch', 'desk', 'counter', 'cabinet' ],
        'verbs': {
          'look': 'On its shelves, the hutch contains a series of books on herbalism. On the counter below, a large mortar sits next to an oil burner.'
        }
      }, {
        'keys': [ 'book', 'books', 'herbalism', 'book on herbalism', 'recipe', 'recipes', 'medicinal recipe', 'medicinal recipes' ],
        'verbs': {
          'use': new Synonym('look'),
          'take': `You're not a thief.`,
          'look': 'The books describe medicines for curing various ailments. You find recipes for nausea, insomnia, and infection.'
        }
      }, {
        'keys': [ 'mortar' ],
        'verbs': {
          'look': 'The mortar is made from chipped stone, and is stained with the pigment of countless herbs.',
          'take': `You're not a thief.`,
          'use': {
            'valerian': session => ({
              message: 'You grind the valerian root into a paste.',
              update: { inventory: setMutate(session.inventory, [ 'p-valerian' ], [ 'valerian' ]) }
            }),
            'ginger': session => ({
              message: 'You grind the ginger root into a paste.',
              update: { inventory: setMutate(session.inventory, [ 'p-ginger' ], [ 'ginger' ]) }
            }),
            'garlic': session => ({
              message: 'You grind the garlic into a paste.',
              update: { inventory: setMutate(session.inventory, [ 'p-garlic' ], [ 'garlic' ]) }
            }),
            'lavender': session => ({
              message: 'You grind the lavender into a powder.',
              update: { inventory: setMutate(session.inventory, [ 'p-lavender' ], [ 'lavender' ]) }
            }),
            'maypop': session => ({
              message: 'You grind the maypop into a powder.',
              update: { inventory: setMutate(session.inventory, [ 'p-maypop' ], [ 'maypop' ]) }
            }),
            'mint': session => ({
              message: 'You grind the mint into a powder.',
              update: { inventory: setMutate(session.inventory, [ 'p-mint' ], [ 'mint' ]) }
            }),
            'echinacea': session => ({
              message: 'You grind the echinacea into a powder.',
              update: { inventory: setMutate(session.inventory, [ 'p-echinacea' ], [ 'echinacea' ]) }
            })
          }
        }
      }, {
        'keys': [ 'burner', 'oil burner', 'flame' ],
        'verbs': {
          'look': 'The burner consists of a low wick beneath a shallow dish. It could be used to heat various mixtures.',
          'take': `You're not a thief.`,
          'use': {
            ...makePotpourri(),
            'valerian-lavender': session => ({
              message: 'You heat the purple mixture on the oil burner',
              update: { inventory: setMutate(session.inventory, [ 'valerian-lavender-heat' ], [ 'valerian-lavender' ]) }
            }),
            'ginger-mint': session => ({
              message: 'You heat the green mixture on the oil burner',
              update: { inventory: setMutate(session.inventory, [ 'ginger-mint-heat' ], [ 'ginger-mint' ]) }
            }),
            'garlic-ginger': session => ({
              message: 'You heat the yellow mixture on the oil burner',
              update: { inventory: setMutate(session.inventory, [ 'garlic-ginger-heat' ], [ 'garlic-ginger' ]) }
            })
          }
        }
      },
      recipe([ 'nausea' ], 'Grind lavender into a fine powder, and add to a heated paste of ginger and mint leaves.'),
      recipe([ 'insomnia' ], 'Mix powdered lavender with valerian paste, and heat. Add powdered maypop.'),
      recipe([ 'infection' ], 'Heat a blended paste of garlic and ginger, and then add powdered echinacea.')
      ]
    },
    //#endregion

    //#region Cave
    'cave': {
      'name': 'a nebulous cave',
      'description': 'The tunnel is long and winding. Fragments of shadow dance just inside the periphery of your vision, but when you turn to look there is nothing. The cave continues to the east.',
      'effect': session => ({
        message: '',
        update: { inventory: new Set(), effects: new Set() }
      }),
      'exits': {
        'east': 'sap'
      },
      'things': [{        
        'keys': [ 'shadow', 'shadows', 'fragment', 'fragments', 'fragments of shadow', 'fragment of shadow' ],
        'name': 'shadows',
        'verbs': {
          'look': 'You are alone in the darkness.'
        }
      }, {
        'keys': [ 'tunnel', 'tunnels', 'cave' ],
        'exit': 'east',
        'verbs': {
          'look': `The tunnel is singular and immeasurable. You can no longer remember how you got here, or for how long you've been descending.`
        }
      }, walls, ceiling, floor]
    },
    //#endregion

    //#region Sap room
    'sap': {
      'name': 'a glowing chamber',
      'description': 'You stand in a narrow chamber, deep in the earth. Thick, sinewy roots snake in and out of the stone walls, oozing a viscous crimson liquid. At the far end of the chamber, the strange sap has coalesced into a shining mirror of ruddy amber. It glows with an inexplicable inner light.',
      'things': [{
        'keys': [ 'walls', 'wall', 'roots', 'stone', 'rock', 'wood' ],
        'verbs': {
          'look': 'The roots tunneling through the walls are so pervasive that the chamber is as much wood as it is stone.'
        }
      }, {
        'keys': [ 'liquid', 'sap', 'strange sap', 'mirror', 'amber', 'glass', 'surface', 'crimson liquid', 'viscous crimson liquid', 'viscous liquid', 'oozing liquid' ],
        'verbs': {
          'look': 'The amber is the colour of smoldering embers, and forms an unbroken sheet of smooth glass. In its shining surface, you swear you see the image of a small child, one hand pressed desperately against the outward face.',
          'use': {
            'self': touchAmber,
            'player': touchAmber
          }
        }
      }, {
        'keys': [ 'image', 'child', 'boy', 'small child' ],
        'verbs': {
          'look': 'The image is silent and unmoving. It stares out at you, hopelessly.',
          'talk': 'There is no reply.',
          'use': {
            'self': touchAmber,
            'player': touchAmber
          }
        }
      }],
      'exits': {}
    },
    //#endregion

    //#region Pit
    'pit': {
      'article': 'at',
      'name': 'the precipice of a pit',
      'description': message(`You stand on the edge of a wide pit, its depths churning with flickering shadows. `)
                      .append(ifFlag('pillars'), 'Tiny goblins tear at four huge stone pillars ', 'Four huge stone pillars support the ceiling ')
                      .append('and, far above you, ')
                      .append(ifFlagIs('giantState', '4'), 'you can see ', `a rope descends from `)
                      .append(`an opening in the arching rock.`)
                      .append(ifFlagIs('bucket', 'well'), ' A wooden bucket dangles from its end.')
                      .append(ifFlag('cat'), ' A cat-like creature is perched nearby, observing you with curiosity.')
                      .append(' A tunnel leads south.')
                      .build,
      'exits': {
        'south': 'mine'
      },
      'things': [ walls, {
        'visibility': not(ifFlagIs('giantState', '4')),
        'keys': [ 'rope', 'hook', 'iron hook', 'crude iron hook', 'ceiling', 'opening' ],
        'verbs': {
          'use': { 
            'self': `The rope is damp and slippery, and you can't get a good grip.`,
            'full-bucket': ss => ({
              message: 'You hang the laden bucket on the iron hook and, somewhere far above, a bell jingles. Heavy footsteps reverberate through the ceiling.',
              update: { flags: mapSet(ss.flags, { giant: 'well-2', giantState: '0' }), inventory: setRemove(ss.inventory, 'full-bucket') }
            }),
            'bucket': ss => ({
              message: 'You hang the bucket on the iron hook.',
              update: { flags: mapSet(ss.flags, 'bucket', 'well'), inventory: setRemove(ss.inventory, 'bucket') }
            })
          },
          'move': `The rope is damp and slippery, and you can't get a good grip.`,
          'look': [
            text('A rope hangs from an opening in the stone ceiling. On its end is'),
            maybeDo(ifFlag('bucket'), 'a wooden bucket dangling from'),
            text('a crude iron hook.')
          ]
        }
      }, {
        'keys': [ 'bucket', 'wooden bucket', 'empty bucket', 'empty wooden bucket' ],
        'visibility': ifFlag('bucket'),
        'verbs': {
          'look': 'The wooden bucket dangles from an iron hook.',
          'take': ss => [{
            message: 'You remove the wooden bucket from the hook.',
            update: { inventory: setAdd(ss.inventory, 'bucket'), flags: mapRemove(ss.flags, 'bucket') }
          },
          maybeDo(ifFlag('giantState'), once(ss => ({ 
            message: 'A fine ruby powder of glowing residue spills out into your pockets.',
            update: { inventory: setAdd(ss.inventory, 'ore-dust') }
          }), 'bucket-dust'))]
        }
      }, {
        'keys': [ 'pit', 'pitt', 'wide pit', 'wide pitt', 'shadows', 'flickering shadows', 'flickers', 'roiling shadows', 'floor' ],
        'verbs': {
          'look': [
            text(`The darkened bottom of the pit churns and flashes, as if brimming with vigorous obsidian fish. Flat, black scales litter the ground near the pit's edge.`),
            once('As you stare into the abyss, a small darting shape splits from the throng, effortlessly scaling the pit wall to rest on the ground just beside you.', 'cat')
          ]
        }
      }, {
        'visibility': ifFlag('cat'),
        'keys': [ 'cat', 'kitty', 'creature', 'shape', 'black shape', 'small shape', 'small black shape', 'small dark shape', 'darting shape', 'small darting shape', 'shadow', 'cat-like creature', 'cat like creature' ,'cat thing', 'fish' ],
        'verbs': {
          'look': 'The creature looks vaguely feline, but black and scaled. Its eyes shine with intelligence.',
          'talk': ssml(catVoice('"How did this get here? Intriguing."'))
                    .append('The creature puzzles.')
                    .append(catVoice('"For so long, this place was ours alone. Will you also devour us? Plunder our home?"'))
                    .append('It appraises you silently for a moment.')
                    .append(catVoice('"No, you are unlike the thing that came before. Bring it down to us, and we will feast."'))
                    .build(),
          'use': {
            'paint': `You don't need that to be covered in ore.`
          }
        }
      }, takeable({
        'keys': [ 'scale', 'scales', 'flat scale', 'flat scales', 'black scale', 'black scales', 'flat black scale', 'flat black scales' ],
        'name': 'a scale',
        'verbs': {
          'look': 'The scales are four inches long, broad, and taper to a rounded point. They have the finish of polished obsidian.'
        }
      }, 'scale'), {
        'keys': [ 'pillars', 'pillar', 'stone pillars', 'stone pillar', 'huge stone pillars', 'huge stone pillar', 'huge pillars', 'huge pillar' ],
        'verbs': {
          'look': [
            text('Cyclopean stone pillars ring the pit, opposing one another at the cardinal points.'),
            maybeDo(ifFlag('pillars'), 'A horde of tiny goblins are quickly reducing them to rubble.', 'They appear structural.')
          ],
          'use': {
            'ore-dust': `The dust refuses to cling to the pillars.`,
            'paint': ss => {
              if (ss.flags.pillars) {
                return text('The pillars are already painted with glowing ore.');
              }
              return {
                message: 'You paint the huge pillars with glowing grease. Immediately, a horde of tiny goblins streams into the room and begins to tear at the supports. The chamber trembles.',
                update: { 
                  inventory: setRemove(ss.inventory, 'paint'), 
                  flags: mapSet(ss.flags, 'pillars', 'holey') 
                }
              };
            }
          }
        }
      }, {
        'keys': [ 'mine' ],
        'exit': 'south',
        'verbs': {
          'look': 'The mine is to the south.'
        }
      }, {
        'keys': [ 'goblins', 'goblin', 'tiny goblins', 'tiny goblins' ],
        'visibility': ifFlag('pillars'),
        'verbs': {
          'look': 'The goblins are tearing pieces out of the pillars with wild abandon.',
          'talk': 'The goblins singlemindedly ignore you.'
        }
      }]
    },
    //#endregion

    //#region Mine
    'mine': {
      'name': 'a busy mine',
      'description': 'The walls of this room are rough and irregular, and spotted with deposits of a glowing red mineral. Tiny goblins tear frantically at the deposits with their bare hands, leaving large piles of luminous ore strewn about the chamber. A tall ladder is set into an alcove on the western wall, and a tunnel leads north.',
      'exits': {
        'north': 'pit',
        'west': 'ledge'
      },
      'things': [ ceiling, floor, {
        'keys': [ 'goblins', 'tiny goblins', 'goblin', 'tiny goblin' ],
        'verbs': {
          'look': 'The goblins are singularly focused on the ore deposits, whipped into a frenzy by the crimson glow.',
          'talk': 'The goblins singlemindedly ignore you.'
        }
      }, {
        'keys': [ 'ore', 'or', 'oar', 'glowing ore', 'luminous or', 'glowing or', 'luminous or', 'glowing oar', 'luminous oar', 'stone', 'rock', 'mineral', 'stones', 'rocks', 'pile', 'piles', 'pile of ore', 'piles of ore', 'pile of or', 'piles of or', 'pile of oar', 'piles of oar', 'pile of stone', 'piles of stone', 'pile of rock', 'piles of rock', 'red mineral', 'strange mineral', 'strange red mineral' ],
        'verbs': {
          'look': 'Large piles of loose rock are strewn about the chamber. Fine particles of a strange red mineral nestle amongst the stones, glowing faintly.',
          'take': 'The ore is too loose to carry in your hands.',
          'use': {
            'full-bucket': 'The bucket is already full of ore.',
            'bucket': ss => ({
              message: 'You fill the bucket with glowing ore.',
              update: { inventory: setMutate(ss.inventory, [ 'full-bucket' ], [ 'bucket' ]) }
            }),
            'paint': 'The rocks are already covered in ore.'
          }
        }
      }, {
        'keys': [ 'walls', 'wall' ], 
        'verbs': {
          'look': 'The walls are rough and irregular, and dusted with slivers of a softly glowing mineral.',
          'use': {
            'paint': 'The walls already glow with the strange red mineral.'
          }
        }
      }, {
        'keys': [ 'ladder', 'small ladder', 'alcove', 'small alcove', 'up' ],
        'exit': 'west',
        'verbs': {
          'take': `It's far too large to carry with you.`,
          'look': 'The ladder is small and made from crudely lashed sticks. It should support your weight.'
        }
      }, {
        'keys': [ 'pit' ],
        'exit': 'north',
        'verbs': {
          'look': 'The pit is to the north.'
        }
      }]
    },
    //#endregion

    //#region Ledge
    'ledge': {
      'article': 'on',
      'name': 'an earthen ledge',
      'description': message('At the top of the ladder is a small earthen ledge, barely large enough to accomodate passage. The soil on the opposite wall has been cleared away, exposing a ')
                      .append(ifFlag('pried'), 'hole leading north.', 'face of irregular wooden boards.')
                      .append(' The ladder descends to the east.')
                      .build,
      'exits': map({ 'east': 'mine' })
                .and(ifFlag('pried'), 'north', 'pantry-2')
                .build,
      'things': [{
        'keys': [ 'ladder', 'small ladder', 'crude ladder', 'down' ],
        'exit': 'east',
        'verbs': {
          'look': 'The ladder is small and made from crudely lashed sticks. It should support your weight.'
        }
      }, {
        'keys': [ 'mine' ],
        'exit': 'east',
        'verbs': {
          'look': 'The mine is down the ladder, to the east.'
        }
      }, {
        'keys': [ 'board', 'boards', 'wooden boards', 'wooden board', 'face', 'wall', 'crack', 'cracks' ],
        'verbs': {
          'look': 'The boards are roughly shaped knotted wood, and smell of must and rot.',
          'take': new Synonym('use'),
          'use': {
            'self': ss => ({
              message: ss.flags.pried 
                ? `It's too big to carry around.` 
                : `You can't fit your fingers into the cracks between the boards.`
            }),
            'scale': ss => { 
              if (ss.flags.pried) {
                return { message: 'The path has already been cleared.' };
              }
              return { 
                message: `You fit the scale into a space between two boards, and lever them apart. Working quickly, you remove boards until a path is cleared to the north.`,
                update: { flags: mapSet(ss.flags, 'pried', '1') }
              }; 
            }
          }
        }
      }, {
        'keys': [ 'ledge', 'earthen ledge', 'small earthen ledge', 'small ledge', 'soil' ],
        'verbs': {
          'look': 'The ledge is small and dusty, and looks to have been cut hastily out of the soil.'
        }
      }, {
        'keys': [ 'hole' ],
        'visibility': ifFlag('pried'),
        'exit': 'north',
        'verbs': {
          'look': 'The hole is barely large enough to pass through.'
        }
      }]
    },
    //#endregion

    //#region Pantry 2
    'pantry-2': {
      'name': 'the pantry',
      'description': message('You are in a cramped, dark space. Shelves line the walls, and a small child huddles in the corner')
                      .append(ifHere('bucket'), ' next to a wooden bucket')
                      .append(ifFlagIs('giant', 'kitchen-2'), '. The sound of chopping meat echoes ', '. Dim light seeps ')
                      .append('through a door to the north, and there is a hole in the southern wall.')
                      .build,
      'exits': {
        'north': 'kitchen-2',
        'south': 'ledge'
      },
      'things': [floor, ceiling, {
        'keys': ['shelf', 'shelves', 'shelving', 'wall', 'walls', 'pantry'],
        'verbs': {
          'look': session => {
            const thread = session.gone.has('thread') ? '' : ' A large spool of thread rests in one corner.';
            return { message: `The shelves are littered with moldering foodstuffs.${thread}` };
          }
        }
      }, {
        'keys': [ 'door', 'light', 'kitchen', 'north', 'door to the north' ],
        'exit': 'north',
        'verbs': {
          'look': ss => ({
            message: ss.flags.giant === 'kitchen-2' 
              ? 'You spy frightful movement through the ill-fitted door.' 
              : 'The door hangs slightly off its hinges, letting in a bit of feeble light.'
          }),
          'open': 'The door swings loosely',
          'close': 'The door swings loosely'
        }
      }, takeable({
        'keys': ['food', 'foodstuffs', 'foodstuff', 'food stuff', 'food stuffs', 'stuff'],
        'name': 'some mouldy food',
        'verbs': {
          'look': 'It\'s not very appetizing',
          'eat': `You don't want to eat that.`
        }
      }, 'food'), {
        'keys': [ 'child', 'small child', 'boy', 'small boy' ],
        'verbs': {
          'look': 'The child looks no older than seven years, and presses himself tightly into the corner as if to escape through the walls. His knees are tucked beneath his chin, and he shivers nervously.',
          'talk': ssml(childVoice(`"You're here!"`))
                    .append('the child exclaims.')
                    .append(childVoice(`"But now we're both trapped... The giant won't let either of us leave."`))
                    .build()
        }
      }, takeable({
        'keys': [ 'bucket', 'wooden bucket' ],
        'name': 'the bucket',
        'verbs': {
          'look': 'The bucket is made from mildewed wood with a handle of thick twine. It is blessedly empty.'
        }
      }, 'bucket', true)]
    },
    //#endregion

    //#region Kitchen 2
    'kitchen-2': {
      'name': 'the kitchen',
      'description': message('You are in what appears to be a monstrous kitchen. ')
                      .append(ifFlagIs('giant', 'kitchen-2'), 
                        'A hideous giant stands at a well-worn cuttingboard, chopping unidentifiable gobs of meat with a rusted cleaver.', 
                        'Crude knives hang above a well-worn cuttingboard, and a large pot bubbles over an open fire.')
                      .append(' There is a pantry on the southern wall, next to a small cage. A doorway leads east.')
                      .build,
      'exits': {
        'south': 'pantry-2',
        'east': 'well-2'
      },
      'things': [walls, floor, ceiling, takeable({
        'name': 'a knife',
        'keys': ['knife', 'knives', 'crude knife', 'crude knives'],
        'verbs': {
          'look': 'The knives are large and pitted, and not very clean.'
        }
      }, 'knife'), {
        'keys': ['pot', 'large pot', 'bubbling pot', 'big pot', 'cauldron'],
        'verbs': {
          'look': `The pot is huge and rusted, and a foul-smelling liquid boils violently inside.`,
          'use': {
            'food': session => ({
              message: 'You drop the mouldy food into the pot',
              update: { inventory: setRemove(session.inventory, 'food') }
            })
          }
        }
      }, {
        'keys': ['fire', 'open fire', 'cooking fire', 'flame', 'flames'],
        'verbs': {
          'look': 'Rotten wood burns beneath the pot, hissing acrid black smoke.'
        }
      }, {
        'keys': ['wood', 'rotten wood', 'log', 'stick', 'logs', 'sticks'],
        'verbs': {
          'look': `It's burning.`,
          'take': `It's too hot to pick up.`
        }
      }, {
        'keys': ['pantry', 'rickety pantry'],
        'exit': 'south',
        'verbs': {
          'look': 'The pantry is just large enough for a person to enter.',
          'open': 'The pantry door swings loosely.',
          'close': 'The pantry door swings loosely.'
        }
      }, {
        'keys': [ 'door', 'doorway', 'well', 'wellhouse', 'well house', 'well-house' ],
        'exit': 'east',
        'verbs': {
          'look': `It's less a door, and more an absence of wall.`
        }
      }, {
        'keys': ['cutting board', 'cuttingboard', 'board'],
        'verbs': {
          'look': 'The cuttingboard is a thick piece of knotted wood, deeply grooved from years of use. It is covered in large globs of slowly melting fat.',
          'use': {
            'knife': 'You cut a few more notches into the board'
          }
        }
      }, takeable({
        'keys': ['fat', 'melting fat', 'slowly melting fat', 'glob of fat', 'globs of fat', 'glob of melting fat', 'globs of melting fat', 'glob of slowly melting fat', 'globs of slowly melting fat'],
        'name': 'a handful of fat',
        'verbs': {
          'look': 'The fat is gelatinous and pliable, with a pale yellow tinge. It smells awful.'
        }
      }, 'fat'), {
        'keys': ['liquid', 'boiling liquid' ],
        'verbs': {
          'look': 'It looks worse than it smells.',
          'eat': 'It tastes worse than it looks.'
        }
      }, locked({
        'keys': ['cage', 'small cage', 'lock', 'sturdy lock', 'cage door'],
        'name': 'the cage',
        'verbs': {
          'look': 'The cage is empty'
        }
      }, { stateKey: 'cage', keyId: 'keys' })],
      'phrases': [{
        keys: [ 'unlock cage', 'unlock the cage', 'unlock lock', 'unlock the lock', 'unlockcage'],
        action: 'use:keys:lock'
      }]
    },
    //#endregion

    //#region Well 2
    'well-2': {
      'name': 'the wellhouse',
      'description': message(`In the center of this room `)
                      .append(ifFlagIs('giant', 'well-2'), 
                        `a hideous giant stands at an old stone well, cranking ponderously.`, 
                        `is an old stone well, its rope descending deep below the rocky floor.`)
                      .append(` A beastly hound squats in the corner. There are doors to the west and south and, behind the hound, a hall stretches north.`)
                      .build,
      'locks': {
        'north': _ => 'The hound snaps at you, and you reconsider.',
        'south': _ => `The door is locked, and won't open.`
      },
      'exits': {
        'west': 'kitchen-2',
        'south': 'nowhere',
        'north': 'nowhere'
      },
      'things': []
    },
    //#endregion

    //#region Bedroom 2
    'bedroom-2': {
      'name': 'the bedroom',
      'description': '',
      'exits': {},
      'things': []
    },
    //#endregion

  },
  //#endregion

  //#region Items
  'items': {

    'knife': {
      'keys': ['knife', 'crude knife'],
      'name': 'a knife',
      'id': 'knife',
      'verbs': {
        'look': 'The knife is large and pitted, and not very clean.',
        'use': {
          'self': `You don't want to cut yourself.`,
          'food': `You cut the food into small pieces.`
        }
      }
    },

    'food': {
      'keys': ['food', 'moldy food', 'mouldy food', 'mould', 'mold'],
      'name': 'some mouldy food',
      'id': 'food',
      'verbs': {
        'look': 'It\'s not very appetizing',
        'eat': `You don't want to eat that.`,
        'use': `You don't want to eat that.`
      }
    },

    'bone': {
      'keys': ['bone', 'femur', 'long bone', 'long femur'],
      'name': 'a long bone',
      'id': 'bone',
      'verbs': {
        'look': 'The bone looks like a human femur. Small scraps of meat still cling to it.'
      }
    },
    
    'cloth': {
      'id': 'cloth',
      'name': 'the cloth',
      'keys': ['cloth', 'greasy cloth', 'rag', 'greasy rag'],
      'name': 'a greasy cloth',
      'verbs': {
        'look': 'The cloth is a rough burlap, smeared with rancid fat.',
        'tie': new Synonym('use'),
        'use': {
          'bone': session => ({
            message: 'You wrap the cloth tightly around one end of the bone, making an improvised torch',
            update: { inventory: setMutate(session.inventory, ['torch'], ['cloth', 'bone']) }
          })
        }
      }
    },

    'torch': {
      'id': 'torch',
      'keys': ['torch', 'bone', 'cloth'],
      'name': 'an improvised torch',
      'verbs': {
        'look': 'A greasy cloth is secured to the end of a long bone. It is not lit.'
      }
    },
    
    'lit-torch': {
      'id': 'lit-torch',
      'keys': ['torch', 'bone', 'cloth', 'lit torch', 'lit bone', 'lit cloth'],
      'name': 'a lit torch',
      'verbs': {
        'look': 'Flames sputter from a greasy cloth atop a long bone.'
      }
    },

    'keys': {
      'id': 'keys',
      'keys': ['keys', 'keyring', 'key ring', 'key', `giant's keys`, `giant's keyring`, `giant's key`],
      'name': 'a ring of keys',
      'verbs': {
        'look': 'An iron ring holds a handful of misshapen keys.'
      }
    },

    'stone': {
      'id': 'stone',
      'keys': [ 'stone', 'ruby', 'rock', 'glowing stone', 'glowing ruby', 'red stone', 'redstone', 'gem', 'red gem', 'glowing gem', 'glowing red gem' ],
      'name': 'a glowing stone',
      'verbs': {
        'look': 'The stone is walnut-sized and gleams enticingly.'
      }
    },

    'thread': {
      'id': 'thread',
      'keys': [ 'thread', 'spool', 'spool of thread', 'large spool', 'large spool of thread', 'string' ],
      'name': 'a spool of thread',
      'verbs': {
        'look': 'The spool looks to contain several yards of thread.',
        'tie': new Synonym('use'),
        'use': {
          'player': `Tethering yourself won't do any good.`,
          'stone': 'The stone bafflingly slips out of every knot you tie.'
        }
      }
    },

    'straw': {
      'id': 'straw',
      'keys': [ 'straw', 'filthy straw' ],
      'name': 'some filthy straw',
      'verbs': {
        'look': 'The straw smells awful.'
      }
    },

    'binoculars': {
      'id': 'binoculars',
      'keys': [ 'binoculars', 'pair of binoculars' ],
      'verbs': {
        'look': 'The binoculars are new, but grime already cakes the hinges.',
        'use': useBinoculars
      }
    },

    'rope': {
      'id': 'rope',
      'name': 'some rope',
      'keys': [ 'rope' ],
      'verbs': {
        'look': `The rope is made from braided nylon, and is wrapped tightly into a mountaineer's coil.`,
        'use': `The rope isn't attached to anything.`
      }
    },

    'weighted-rope': {
      'id': 'weighted-rope',
      'name': 'a weighted rope',
      'keys': [ 'rope', 'rock', 'stone' ],
      'verbs': {
        'look': 'The climbing rope is weighted with a chunk of shale.',
        'use': `The rope isn't attached to anything.`
      }
    },

    'multitool': {
      'id': 'multitool',
      'name': 'a multitool',
      'keys': ['multitool', 'multi tool', 'multi-tool', 'tool'],
      'verbs': {
        'look': 'Pliers, a screwdriver, and a very sharp knife in a compact steel sheath.'
      }
    },

    'map': {
      'id': 'map',
      'name': 'a map',
      'keys': [ 'map' ],
      'verbs': {
        'use': new Synonym('look'),
        'look': session => {
          let desc = 'Topographic data for a few square miles of undeveloped swamp land. Your campsite is marked in red';
          const explore = tryParse(session.flags.explore, 0);
          if (explore === 0) {
            return {
              message: `${desc}. There is a high point just north of camp that could be useful in surveiling the area.`,
              update: { flags: mapSet(session.flags, 'explore', '1') }
            };
          }
          if (explore >= 1) {
            desc = `${desc}, along with a bluff to its north`;
          }
          if (explore >= 2) {
            desc = `${desc}, the tree to its east`;
            if (!session.seen.has('garden')) {
              desc = `${desc}, and mysterious smoke to its south`;
            }
            else {
              desc = `${desc}, and a cabin to its south`;
            }
          }
          return { message: `${desc}.` };
        }
      }
    },

    'shale': {
      'id': 'shale',
      'name': 'a rock',
      'keys': [ 'rock', 'stone', 'shale' ],
      'verbs': {
        'look': 'A piece of rough shale, roughly the size of your fist.',
        'tie': new Synonym('use'),
        'use': {
          'rope': session => ({
            message: 'You lash the stone to the end of the rope.',
            update: { inventory: setMutate(session.inventory, [ 'weighted-rope' ], [ 'rope', 'shale' ]) }
          }),
          'weighted-rope': 'The rope is already weighted.'
        }
      }
    },

    ...herbs,
    'p-valerian': {
      'id': 'p-valerian',
      'name': 'valerian paste',
      'keys': [ 'valerian paste', 'valerian' ],
      'verbs': {
        'look': 'A paste of ground valerian root.',
        'use': {
          ...makePotpourri('p-valerian'),
          'p-lavender': session => ({
            message: 'You combine the valerian and lavender into a purple paste.',
            update: { inventory: setMutate(session.inventory, [ 'valerian-lavender' ], [ 'p-valerian', 'p-lavender' ]) }
          })
        }
      }
    },
    'p-lavender': {
      'id': 'p-lavender',
      'name': 'powdered lavender',
      'keys': [ 'powdered lavender', 'lavender powder', 'lavender' ],
      'verbs': {
        'look': 'A powder of ground lavender.',
        'use': {
          ...makePotpourri('p-lavender'),
          'p-valerian': session => ({
            message: 'You combine the valerian and lavender into a purple paste.',
            update: { inventory: setMutate(session.inventory, [ 'valerian-lavender' ], [ 'p-valerian', 'p-lavender' ]) }
          }),
          'ginger-mint-heat': session => ({
            message: 'You add the powdered lavender to the mixture. This should serve as an antinauseant.',
            update: { inventory: setMutate(session.inventory, [ 'antinauseant' ], [ 'ginger-mint-heat', 'p-lavender' ]) }
          })
        }
      }
    },
    'p-maypop': {
      'id': 'p-maypop',
      'name': 'powdered maypop',
      'keys': [ 'powdered maypop', 'maypop', 'maypop powder' ],
      'verbs': {
        'look': 'A powder of ground maypop.',
        'use': { 
          ...makePotpourri('p-maypop'),
          'valerian-lavender-heat': session => ({
            message: 'You add the powdered maypop to the mixture. This should function as a sedative.',
            update: { inventory: setMutate(session.inventory, [ 'sedative' ], [ 'valerian-lavender-heat', 'p-maypop' ]) }
          })
        }
      }
    },
    'p-ginger': {
      'id': 'p-ginger',
      'name': 'ginger paste',
      'keys': [ 'ginger paste', 'ginger' ],
      'verbs': {
        'look': 'A paste of ground ginger.',
        'use': {
          ...makePotpourri('p-ginger'),
          'p-mint': session => ({
            message: 'You combine the ginger and mint into a green paste.',
            update: { inventory: setMutate(session.inventory, [ 'ginger-mint' ], [ 'p-ginger', 'p-mint' ]) }
          }),
          'p-garlic': session => ({
            message: 'You combine the garlic and ginger into a yellow paste.',
            update: { inventory: setMutate(session.inventory, [ 'garlic-ginger' ], [ 'p-ginger', 'p-garlic' ]) }
          })
        }
      }
    },
    'p-mint': {
      'id': 'p-mint',
      'name': 'powdered mint',
      'keys': [ 'powdered mint', 'mint', 'mint powder' ],
      'verbs': {
        'look': 'A powder of ground mint.',
        'use': {
          ...makePotpourri('p-mint'),
          'p-ginger': session => ({
            message: 'You combine the ginger and mint into a green paste.',
            update: { inventory: setMutate(session.inventory, [ 'ginger-mint' ], [ 'p-ginger', 'p-mint' ]) }
          })
        }
      }
    },
    'p-garlic': {
      'id': 'p-garlic',
      'name': 'garlic paste',
      'keys': [ 'garlic paste', 'garlic' ],
      'verbs': {
        'look': 'A paste of ground garlic.',
        'use': {
          ...makePotpourri('p-garlic'),
          'p-ginger': session => ({
            message: 'You combine the garlic and ginger into a yellow paste.',
            update: { inventory: setMutate(session.inventory, [ 'garlic-ginger' ], [ 'p-ginger', 'p-garlic' ]) }
          })
        }
      }
    },
    'p-echinacea': {
      'id': 'p-echinacea',
      'name': 'powdered echinacea',
      'keys': [ 'powdered echinacea', 'echinacea powder', 'echinacea' ],
      'verbs': {
        'look': 'A powder of ground echinacea.',
        'use': {
          ...makePotpourri('p-echinacea'),
          'garlic-ginger-heat': session => ({
            message: 'You add the powdered echinacea to the mixture. This should serve to heal an infection.',
            update: { inventory: setMutate(session.inventory, [ 'antibiotic' ], [ 'garlic-ginger-heat', 'p-echinacea' ]) }
          })
        }
      }
    },
    'potpourri': {
      'id': 'potpourri',
      'name': 'some potpourri',
      'keys': [ 'potpourri' ],
      'verbs': {
        'look': 'A useless, but fragrant, combination of herbs.',
        'use': makePotpourri()
      }
    },
    'valerian-lavender': {
      'id': 'valerian-lavender',
      'name': 'a purple paste',
      'keys': [ 'purple paste', 'purple mixture', 'mixture', 'paste' ],
      'verbs': {
        'look': 'A purple paste of crushed lavender and valerian root.',
        'use': makePotpourri('valerian-lavender')
      }
    },
    'valerian-lavender-heat': {
      'id': 'valerian-lavender-heat',
      'name': 'a heated mixture of lavendar and valerian',
      'keys': [ 'purple paste', 'purple mixture', 'mixture', 'paste', 'heated purple paste', 'heated purple mixture', 'heated mixture', 'heated paste' ],
      'verbs': {
        'look': 'A heated purple paste of crushed lavender and valerian root.',
        'use': {
          ...makePotpourri('valerian-lavender-heat'),
          'p-maypop': session => ({
            message: 'You add the powdered maypop to the mixture. This should function as a sedative.',
            update: { inventory: setMutate(session.inventory, [ 'sedative' ], [ 'valerian-lavender-heat', 'p-maypop' ]) }
          })
        }
      }
    },
    'ginger-mint': {
      'id': 'ginger-mint',
      'name': 'a green paste',
      'keys': [ 'green paste', 'green mixture', 'mixture', 'paste' ],
      'verbs': {
        'look': 'A green paste of crushed ginger root and mint leaves.',
        'use': makePotpourri('ginger-mint')
      }
    },
    'ginger-mint-heat': {
      'id': 'ginger-mint-heat',
      'name': 'a heated green paste',
      'keys': [ 'green paste', 'green mixture', 'mixture', 'paste', 'heated green paste', 'heated green mixture', 'heated mixture', 'heated paste' ],
      'verbs': {
        'look': 'A heated green paste of crushed ginger root and mint leaves.',
        'use': {
          ...makePotpourri('ginger-mint-heat'),
          'p-lavender': session => ({
            message: 'You add the powdered lavender to the mixture. This should settle an upset stomach.',
            update: { inventory: setMutate(session.inventory, [ 'antinauseant' ], [ 'ginger-mint-heat', 'p-lavender' ]) }
          })
        }
      }
    },
    'garlic-ginger': {
      'id': 'garlic-ginger',
      'name': 'a yellow paste',
      'keys': [ 'yellow paste', 'yellow mixture', 'mixture', 'paste' ],
      'verbs': {
        'look': 'A yellow paste of crushed garlic and ginger root.',
        'use': makePotpourri('garlic-ginger')
      }
    },
    'garlic-ginger-heat': {
      'id': 'garlic-ginger-heat',
      'name': 'a heated yellow paste',
      'keys': [ 'yellow paste', 'yellow mixture', 'mixture', 'paste', 'heated yellow paste', 'heated yellow mixture', 'heated mixture', 'heated paste' ],
      'verbs': {
        'look': 'A heated yellow paste of crushed garlic and ginger root.',
        'use': {
          ...makePotpourri('garlic-ginger-heat'),
          'p-echinacea': session => ({
            message: 'You add the powdered echinacea to the mixture. This should serve to heal an infection.',
            update: { inventory: setMutate(session.inventory, [ 'antibiotic' ], [ 'garlic-ginger-heat', 'p-echinacea' ]) }
          })
        }
      }
    },
    'antinauseant': {
      'id': 'antinauseant',
      'name': 'an herbal antinauseant',
      'keys': [ 'antinauseant', 'herbal antinauseant' ],
      'verbs': {
        'look': 'A pungeant paste that promises to settle the stomach.',
        'eat': new Synonym('use'),
        'take': new Synonym('use'),
        'use': session => ({
          message: `You swallow the medicine.`,
          update: { inventory: setRemove(session.inventory, 'antinauseant') }
        })
      }
    },
    'antibiotic': {
      'id': 'antibiotic',
      'name': 'an herbal antibiotic',
      'keys': [ 'antibiotic', 'herbal antibiotic' ],
      'verbs': {
        'look': 'A fragrant poultice to heal infected wounds.',
        'eat': new Synonym('use'),
        'take': new Synonym('use'),
        'use': session => ({
          message: `You swallow the medicine.`,
          update: { inventory: setRemove(session.inventory, 'antibiotic') }
        })
      }
    },
    'sedative': {
      'id': 'sedative',
      'name': 'an herbal sedative',
      'keys': [ 'sedative', 'insomnia potion', 'herbal sedative', 'sleeping potion' ],
      'verbs': {
        'look': 'The paste is dark green and smells of flowers',
        'eat': new Synonym('use'),
        'take': new Synonym('use'),
        'use': session => ({
          message: message(`You swallow the medicine.`)
                    .append(ifAt('tree'), ` ${drowsyTree}`)
                    .build(session),
          update: {
            inventory: setRemove(session.inventory, 'sedative'),
            effects: setAdd(session.effects, 'drugged')
          }
        })
      }
    },

    'scale': {
      'id': 'scale',
      'name': 'a large scale',
      'keys': [ 'scale', 'large scale', 'black scale', 'obsidian scale', 'cat scale' ],
      'verbs': {
        'look': 'The scale is four inches long, broad, and tapers to a rounded point. It has the finish of polished obsidian.'
      }
    },

    'bucket': {
      'id': 'bucket',
      'name': 'a wooden bucket',
      'keys': [ 'bucket', 'wooden bucket' ],
      'verbs': {
        'look': 'The bucket is made from mildewed wood with a handle of thick twine.',
        'use': {
          'self': 'You could fill it with something.',
          'ore-dust': 'There is not nearly enough dust to fill the bucket.',
          'scale': 'The bucket could hold a lot more than that.'
        }
      }
    },

    'full-bucket': {
      'id': 'full-bucket',
      'name': 'a bucket full of glowing ore',
      'keys': [ 'bucket', 'full bucket', 'ore', 'bucket of ore', 'bucket of glowing ore', 'bucket full of ore', 'bucket full of glowing ore' ],
      'verbs': {
        'look': 'The bucket is full to the brim with faintly glowing ore.'
      }
    },

    'fat': {
      'id': 'fat',
      'name': 'a handful of fat',
      'keys': [ 'fat', 'handful of fat', 'hand full of fat', 'glob of fat' ],
      'verbs': {
        'look': 'The fat is gelatinous and pliable, with a pale yellow tinge. It smells awful.',
        'use': {
          'ore-dust': ss => ({
            message: 'You blend the ore dust into the fat, creating a softly glowing crimson grease.',
            update: { inventory: setMutate(ss.inventory, [ 'paint' ], [ 'fat', 'ore-dust' ]) }
          })
        }
      }
    },

    'ore-dust': {
      'keys': [ 'residue', 'powder', 'fine powder', 'ruby powder', 'ruby dust', 'fine ruby powder', 'glowing residue', 'dust', 'ore dust', 'glowing dust', 'crumbling ore' ],
      'id': 'ore-dust',
      'name': 'some glowing dust',
      'verbs': {
        'look': 'The dust glows with a soft crimson light.'
      }
    },

    'paint': {
      'keys': [ 'grease', 'red grease', 'glowing grease', 'paint', 'red paint', 'crimson paint', 'glowing paint', 'glowing red paint', 'glowing crimson paint' ],
      'id': 'paint',
      'name': 'some glowing grease',
      'verbs': {
        'look': 'The gelatinous amalgam glows with a soft red light. It smells awful.',
        'use': {
          'self': 'You could cover something in glowing ore.',
          'scale': `You don't need that to be covered in ore.`,
          'knife': `You don't need that to be covered in ore.`,
          'bucket': `You don't need that to be covered in ore.`,
        }
      }
    }
  },
  
  //#endregion

  //#region Global Effects
  'effects': {

    'always': {
      'things': [{
        'id': 'player',
        'keys': [ 'me', 'self', 'myself', 'body', 'head', 'arm', 'arms', 'leg', 'legs', 'hand', 'hands', 'waist', 'foot', 'feet' ],
        'verbs': {
          'look': `It's you.`
        }
      }]
    },

    'goblin': {
      'roomEffect': session => {
        if (session.room === 'maze' || session.room === 'tunnel') {
          return { message: 'One of the goblins is following you.' };
        }
        if (session.room === 'bedroom-lit' && session.flags.trunk === 'open') {
          return {
            message: 'The tiny goblin rushes feverishly to the open trunk, shoves a stone into its bag, and disappears down the hall.',
            update: { effects: setRemove(session.effects, 'goblin') }
          };
        }
        if (session.room === 'kitchen' && session.flags.stone === 'cage') {
          if (session.flags.cage === 'open') {
            return {
              message: 'The tiny goblin jumps into the cage, grabbing for the stone.',
              update: {
                effects: setRemove(session.effects, 'goblin'),
                flags: mapSet(session.flags, 'stone', 'goblin')
              }
            };
          }
          return { message: 'The tiny goblin runs circles around the cage, trying to find a way to the stone.' };
        }
        return { message: 'A tiny goblin is following you.' };
      },
      'things': [{
        'id': 'goblin',
        'keys': [ 'goblin', 'tiny goblin' ],
        'verbs': {
          'look': 'The goblin stays well out of reach, but remains fixated on the stone you are carrying.',
          'take': 'The goblin easily avoids your attempts at capture.',
          'attack': new Synonym('use'),
          'talk': 'The goblin chitters unintelligibly.',
          'give': new Synonym('use'),
          'tie': new Synonym('use'),
          'use': {
            'thread': 'You could, if only you could catch the goblin first.',
            'knife': 'The goblin easily avoids your attempts at violence.',
            'food': `The goblin chitters disgustedly`,
            'stone': session => ({
              message: `The goblin snatches up the stone, and scampers away.`,
              update: {
                inventory: setRemove(session.inventory, 'stone'),
                effects: setRemove(session.effects, 'goblin')
              }
            })
          }
        }
      }]
    },

    'thread': {
      'roomEffect': session => {
        const dir = threadDirs[session.room];
        return dir ? { message: `A trail of thread leads ${dir}.` } : null;
      },
      'things': [{
        'keys': [ 'thread', 'trail', 'trail of thread', 'string' ],
        'verbs': {
          'look': session => ({ message: `The thread leads ${threadDirs[session.room]}` }),
          'take': new Synonym('look')
        }
      }]
    },

    'drugged': {
      'roomEffect': session => { 
        if (session.room === 'tree' && session.flags.tree !== 'sleep') {
          return { 
            message: drowsyTree,
            update: { flags: mapSet(session.flags, 'tree', 'sleep') }
          };
        }
        return { message: random([
          `You're feeling very drowsy.`,
          `It's a struggle to keep your eyes open.`,
          `You're fading in and out of dream.`
        ]) }; 
      },
      'things': []
    },

    'giant': {
      'roomEffect': (ss, verb) => {

        if (verb !== 'move') { 
          // Giant only moves when you do
          return null; 
        }

        const loc = ss.flags.giant || 'kitchen-2';
        const state = ss.flags.giantState;

        const firstFight = fightGiant(loc, ss.room, !!ss.flags.pillars);
        if (firstFight) {
          // Fight instead of move
          return firstFight;
        }

        // Move the giant, if necessary
        const flags = moveGiant(ss);
        const text:Array<string> = [];
        if (flags.giant && flags.giant !== ss.room) {
          text.push('Heavy footsteps reverberate through the surrounding stone.');
        }
        if (flags.giant && flags.giant === ss.room) {
          text.push('A huge bog giant plods into the room.');
        }
        if (!flags.giant && flags.giantState && ss.room === 'pit') {
          text.push('The bucket slowly rises.');
        }
        if (flags.bucket && ss.room === 'pit') {
          text.push('An empty bucket crashes down, on the end of a long rope.');
        }
        
        const hasFlags = Object.keys(flags).length > 0;
        if (text.length === 0 && !hasFlags) {
          return null;
        }

        const result:ActionResult = {
          message: text.join(' ')
        };

        if (hasFlags) {
          result.update = { flags: mapSet(ss.flags, flags) };
        }

        return flags.giant ? [result, fightGiant(flags.giant, ss.room, !!ss.flags.pillars)] : result;
      },
      'things': []
    }
  },
  //#endregion
};

function fightGiant(giant, player, canWin) {
  if (giant !== player) {
    return null;
  }

  const ret = [{
    message: `The giant roars savagely and heaves its bulk in your direction. You dodge out of the way, and the giant's massive fists slam into the ground with an echoing crash.`
  }];

  if (canWin && player === 'well-2') {
    ret.push({
      message: ssml(`The chamber shudders, and then the floor gives way, sending the giant tumbling into the depths. Far below, shadows flash with glints of tooth and scale and an unearthly howl rises from the pit. For a fleeting moment, you picture twisted branches swarming with shadowy creatures, gnashing and rending.`)
                .pause(1)
                .append(`And then all is still.`)
                .pause(1)
                .append(`Beside you, a small child smiles.`)
                .append(childVoice(`"Now I can finally go home."`))
                .pause(2)
                .append(`You become aware of an intense heat on your face, and you open your eyes. You lie sprawled on the damp loam of the swamp, while, before you, a great gnarled tree is consumed by flame. Huge plumes of black smoke spew from the blaze, streaking, oily and black, across the sky. You brace to rise to your feet, and you feel something smooth and hard in the soft peat. Just beneath a fresh bed of moss, as if in peaceful slumber, a small skeleton lies perfectly preserved. You stand and watch the flames crest the canopy.`)
                .pause(1)
                .append(`Tonight you will dream of home.`)
                .build(),
      close: true
    });
  }
  else {
    const retreatId = player === 'well-2' ? 'kitchen-2' : 'pantry-2';
    const retreat = player === 'well-2' ? 'the kitchen' : 'the pantry';
    ret.push({
      message: `You flee to ${retreat}.`,
      update: { room: retreatId }
    });
  }

  return ret;
}

function moveGiant(ss):{[string]:?string} {
  const loc = ss.flags.giant || 'kitchen-2';
  const state = tryParse(ss.flags.giantState, 0);
  const DONE = 4; // Back to kitchen in 6 turns
  if (state >= DONE && loc === 'bedroom-2') {
    // start heading back with the empty bucket
    return { giant: 'well-2' };
  }
  if (state >= DONE && loc === 'well-2') {
    // back in the kitchen
    return { giant: 'kitchen-2', giantState: '0', bucket: 'well' };
  }
  if (state === DONE - 1 && loc === 'well-2') {
    // take full bucket to the bedroom
    return { giant: 'bedroom-2', giantState: String(DONE) };
  }
  if (loc === 'well-2') {
    // pull up the bucket
    return { giantState: String(state + 1) };
  }
  return {};
}

export default world;