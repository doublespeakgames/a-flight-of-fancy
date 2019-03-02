// @flow

import type { World } from '../model/world';
import { Synonym } from '../action-resolver';
import { setAdd, setRemove, setMutate, mapSet, mapRemove } from '../immutable';
import { random } from '../list';
import { locked, takeable } from '../model/mixins';

//#region Shared Things
const goblins = {
  'keys': [ 'goblin', 'goblins', 'tiny goblin', 'tiny goblins', 'small goblin', 'small goblins' ],
  'verbs': {
    'look': 'The goblins are no larger than rats, and are in constant motion. They carry small bags, and appear to be collecting bits of gravel.',
    'take': 'The goblins easily avoid your attempts at capture.',
    'talk': 'The goblins chitter unintelligibly.',
    'give': new Synonym('use'),
    'attack': new Synonym('use'),
    'use': {
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
}
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
        'keys': ['shelf', 'shelves', 'shelving', 'wall', 'walls'],
        'verbs': {
          'look': session => {
            const thread = session.gone.has('thread') ? '' : ' A large spool of thread rests in one corner.';
            return { message: `The shelves are littered with moldering foodstuffs.${thread}` };
          }
        }
      }, {
        'keys': ['door', 'light'],
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
      }, 'food')],
      'phrases': [{
        'keys': ['leave pantry', 'leave the pantry', 'exit pantry', 'exit the pantry'],
        'action': 'move:north'
      }]
    },
    //#endregion

    //#region Kitchen
    'kitchen': {
      'name': 'the kitchen',
      'description': 'You are in what appears to be a monstrous kitchen. Crude knives hang above a well-worn cuttingboard, and a large pot bubbles over an open fire. There is a pantry on the southern wall, next to a small cage. A doorway leads east.',
      'exits': {
        'south': 'pantry',
        'east': 'great-room'
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
              update: {
                inventory: setMutate(session.inventory, ['lit-torch'], ['torch'])
              }
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
        'keys': ['door', 'doorway'],
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
        'keys': ['cloth', 'greasy cloth'],
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
        'keys': ['stone', 'glowing stone'],
        'visibility': session => session.flags.stone === 'cage',
        'verbs': {
          'look': 'The stone sparkles inside the cage.',
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
                  effects: setAdd(session.effects, 'thread')
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
                message: `You lift the latch and open the cage door. The cat-thing inside leaps deftly out, landing atop the pantry. It watches you for a moment, before hopping down and disappearing around a corner.`,
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
        'keys': ['creature', 'strange creature', 'it'],
        'verbs': {
          'look': 'The creature is cat-like, but covered in dull scales. Its face is unnervingly human, and it watches you with keen eyes.',
          'use': 'The cage imprisoning it is closed.',
          'untie': new Synonym('use'),
          'give': {
            'food': 'It looks at you, disgustedly.'
          },
          'talk': (session, world) => {
            if (session.flags['it']) {
              return { message: 'It just watches you, expectantly.' }
            }
            return {
              message: `<speak><prosody pitch="+6st">"Meat is alive?"</prosody> the creature hisses. <prosody pitch="+6st">"Meat lets it out! It doesn't want to be dinner."</prosody></speak>`,
              update: { flags: mapSet(session.flags, 'it', 'spoke') }
            };
          }
        }
      }],
      'phrases': [{
        keys: ['unlock cage', 'unlock the cage', 'unlock lock', 'unlock the lock'],
        action: 'use:keys:lock'
      }]
    },
    //#endregion

    //#region Greatroom 
    'great-room': {
      'name': 'the greatroom',
      'description': session => {
        const hound = session.flags.hound ? 'lies in the corner' : 'squats in the corner, gnawing at a large bone';
        return `This room is long and wide, with a low hewn-stone ceiling. A beastly hound ${hound}. There are doors to the west and south and, behind the hound, a hall stretches north.`;
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
      'things': [walls, floor, {
        'keys': [ 'ceiling' ],
        'verbs': {
          'look': 'The ceiling has been roughly chiseled out of natural rock.'
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
              return {
                message: `The hound is massive but chained, and you easily out-maneuver it. Your knife slips between its ribs, and its life pours hotly onto the floor.`,
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
                message: `The hound snaps up the food greedily. Its demeanor softens.`,
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
        'keys': ['bone', 'long bone', 'gnawed bone', 'femur', 'long femur', 'gnawed femur', `hound's bone`, `dog's bone`],
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
        'keys': ['hall', 'hallway'],
        'exit': 'south',
        'verbs': {
          'look': 'The hall leads south.'
        }
      }],
      'exits': {
        'south': 'great-room'
      }
    },
    //#endregion Bedroom

    //#region Bedroom-lit
    'bedroom-lit': {
      'name': 'the bedroom',
      'description': `Illuminated by torchlight, you can see that you are in a small bedroom. Immediately in front of you, a bog giant snores loudly atop a bed of filthy straw. Against the back wall is a heavy wooden trunk. A hallway leads south.`,
      'things': [walls, floor, ceiling, {
        'keys': ['hall', 'hallway'],
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
        'keys': ['stone', 'stones', 'red stone', 'red stones', 'glowing stone', 'glowing red stone', 'ruby', 'rubies', 'all the stones', 'all of the stones', 'more stones', 'another stone'],
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
            'lit-torch': `You don't want to risk waking the giant.`
          }
        }
      }, 'straw'), {
        'keys': ['giant', 'bog giant', 'beast', 'monster', 'creature'],
        'verbs': {
          'look': session => {
            const belt = session.flags['belt'] ? '' : ` Around its waist is tied a belt of rough twine, from which hangs a large key-ring.`;
            return { message: `The giant is enormous, with wide drooping features and a ponderous girth. Its hide is the texture of waterlogged driftwood, and is stippled with patches of multicoloured lichens.${belt}` };
          },
          'talk': `You don't want to risk waking the giant.`,
          'use': {
            'knife': `You're quite certain that the giant would kill you.`
          },
          'attack': new Synonym('use')
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
      }],
      'exits': {
        'south': 'great-room'
      }
    },
    //#endregion Bedroom-lit

    //#region Mossy Tunnel
    'tunnel': {
      'name': 'a mossy tunnel',
      'description': `You are in a cavernous tunnel. On the walls, bioluminescent moss glows faintly. There is a door to the north, and the passage continues to the south. Tiny goblins dart about your feet, visible only for a moment before vanishing deeper into darkness.`,
      'exits': session => { 
        return {
          'north': 'great-room',
          'south': session.effects.has('thread') ? 'maze-1' : 'maze'
        }; 
      },
      'effect': session => {
        if (!session.inventory.has('stone') || session.effects.has('goblin')) {
          return { message: '', update: { flags: mapRemove(session.flags, 'lost') }};
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
      }]
    },
    //#endregion

    //#region Maze
    'maze': {
      'name': 'a maze',
      'things': [ walls, floor, ceiling, goblins, {
        'keys': [ 'rock' ],
        'verbs': {
          'take': `You don't want the rock.`,
          'look': `Does it look familiar? Maybe not...`
        }
      } ],
      'effect': session => { 
        const lost = isNaN(session.flags.lost) ? 0 : parseInt(session.flags.lost);
        return {
          message: lost < 2 ? random(['Have you passed that rock before?', 'Are you moving in circles?', 'The tunnels all look the same.']) : 'This tunnel looks familiar.',
          update: { flags: mapSet(session.flags, 'lost', String(Math.min(3, lost + 1))) }
        }; 
      },
      'description': 'The tunnels here are twisting and elusive. Tiny goblins skitter purposefully to and fro. Passages extend in all directions.',
      'exits': session => {
        const dest = parseInt(session.flags.lost) >= 3 ? 'tunnel' : 'maze';
        return {
          'north': dest,
          'south': dest,
          'east': dest,
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
        return `Before you, the tunnel ends abruptly in a verdant bloom of flora. Daylight streams between hanging vines, casting long shadows on the rocky terrain.${goblin} The cave opens to the west, and a tunnel leads back to the east.`;
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
        message: `You start in your sleeping bag, briefly disoriented. The heat of the day is already upon you, and large insects drone outside the tent walls. Yes, the swamp. You're finally here.`,
        update: { room: 'tent', inventory: new Set() }
      }),
      'description': `You emerge from the cave into a dense swamp. Behind you, its roots framing the mouth of the cave, a huge gnarled tree rises above the canopy. Sunlight flickers through the tree's branches, and you squint against the sudden brightness. Defiantly, the light continues to fill your vision until the image of the swamp is just a memory. Until the memory, too, is gone. And then you wake. The same dream, every night, for the past twenty-eight weeks.`,
      'things': [],
      'exits': {}
    },
    //#endregion

    //#region Tent
    'tent': {
      'name': 'your tent',
      'description': `The tent is close and stifling. Your expedition pack sits in one corner, and a zippered flap opens to the east.`,
      'things': [
        // TODO
      ],
      'exits': {
        // TODO
      }
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
      'keys': ['cloth', 'greasy cloth'],
      'name': 'a greasy cloth',
      'verbs': {
        'look': 'The cloth is a rough burlap, smeared with rancid fat.',
        'tie': new Synonym('use'),
        'use': {
          'bone': session => ({
            message: 'You wrap the cloth tightly around one end of the bone, making an improvised torch',
            update: {
              inventory: setMutate(session.inventory, ['torch'], ['cloth', 'bone'])
            }
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
      'keys': [ 'stone', 'ruby', 'glowing stone', 'glowing ruby' ],
      'name': 'a glowing stone',
      'verbs': {
        'look': 'The stone is walnut-sized and sparkles enticingly.'
      }
    },

    'thread': {
      'id': 'thread',
      'keys': [ 'thread', 'spool', 'spool of thread', 'large spool', 'large spool of thread', 'string' ],
      'name': 'a spool of thread',
      'verbs': {
        'look': 'The spool looks to contain several yards of thread.'
      }
    },

    'straw': {
      'id': 'straw',
      'keys': [ 'straw', 'filthy straw' ],
      'name': 'some filthy straw',
      'verbs': {
        'look': 'The straw smells awful.'
      }
    }
  },
  //#endregion

  //#region Global Effects
  'effects': {

    'goblin': {
      'roomEffect': (session, world, roomId) => {
        if (roomId === 'maze' || roomId === 'tunnel') {
          return { message: 'One of the goblins is following you.' };
        }
        if (roomId === 'bedroom-lit' && session.flags.trunk === 'open') {
          return {
            message: 'The tiny goblin rushes feverishly to the open trunk, shoves a stone into its bag, and disappears down the hall.',
            update: { effects: setRemove(session.effects, 'goblin') }
          };
        }
        if (roomId === 'kitchen' && session.flags.stone === 'cage') {
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
          'use': {
            'thread': 'You attempt to snare the goblin with the thread, but it is too quick.',
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
      'roomEffect': (session, world, roomId) => {
        const dir = threadDirs[roomId];
        return dir ? { message: `A trail of thread leads ${dir}.` } : null;
      },
      'things': [{
        'keys': [ 'thread', 'trail', 'trail of thread', 'string' ],
        'verbs': {
          'look': session => ({ message: `The thread leads ${threadDirs[session.room]}` }),
          'take': new Synonym('look')
        }
      }]
    }
  },
  //#endregion
};

const threadDirs = {
  'kitchen': 'east',
  'great-room': 'south',
  'tunnel': 'south',
  'maze-1': 'east',
  'maze-2': 'north',
  'maze-3': 'west'
};

export default world;