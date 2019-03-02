// @flow

import type { World } from '../model/world';
import type { ExitMap } from '../model/room';
import { Synonym } from '../action-resolver';
import { setAdd, setRemove, setMutate, mapSet, mapRemove } from '../util/immutable';
import { random } from '../util/list';
import { tryParse } from '../util/number';
import message from '../util/message';
import result from '../util/result';
import map from '../util/conditional-map';
import { ifHere, ifFlagGTE, ifFlagIs } from '../util/builder';
import { once, locked, takeable } from '../model/mixins';

//#region Shared Things
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
    message: 'You lift the binoculars to your eyes, searching the distance for only a moment before you find it: The tree from your dream, huge and garled, splits the canopy about a mile east of camp. To the south, a thin line of smoke rises from the bush. You update your map.',
    update: { flags: mapSet(session.flags, 'explore', '2') }
  };
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
        'keys': ['shelf', 'shelves', 'shelving', 'wall', 'walls', 'pantry'],
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
        if (!session.inventory.has('stone') || session.effects.has('goblin') || session.effects.has('thread')) {
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
      }, {
        'keys': [ 'dark', 'darkness' ],
        'exit': 'south',
        'verbs': {
          'look': `You don't see much.`
        }
      }]
    },
    //#endregion

    //#region Maze
    'maze': {
      'name': 'a maze',
      'leaveMessage': (to, _) => {
        if (to === 'tunnel') {
          return 'Somehow, you find your way out of the maze.';
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
          'look': 'The pack',
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
      }],
      'exits': {
        'east': 'camp'
      }
    },
    //#endregion

    //#region Camp
    'camp': {
      'name': 'camp',
      'description': message('The camp is situated on a low rise, somewhat protected from the sucking mire that surrounds it. Slightly downhill, a jeep is buried up to its doors in mud. Your tent is pitched on the western slope.')
                      .append(ifFlagGTE('explore', 1), ' On your map is marked a bluff to the north')
                      .append(ifFlagGTE('explore', 2), ', the tree to the east')
                      .append(ifFlagIs('explore', '2'), ', and mysterious smoke to the south')
                      .append(ifFlagGTE('explore', 3), ', and a cabin to the south')
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
          'look': 'The tent is made of lightweight nylon, and hugs the ground like the cocoon of some enormous worm.'
        }
      }, {
        'keys': [ 'jeep', 'stuck jeep', 'buried jeep', 'downhill', 'down hill', 'wheels', 'algae' ],
        'verbs': {
          'take': new Synonym('use'),
          'use': 'The jeep is thoroughly stuck.',
          'look': result('The jeep is dented, and spattered with mud and algae. Its wheels have sunk completely into the sodden terrain.')
                    .append(ifHere('binoculars'), ` A pair of binoculars sits on the driver's seat.`)
                    .build
        }
      }, takeable({
        'name': 'the binoculars',
        'keys': [ 'binoculars', 'pair of binoculars' ],
        'verbs': {
          'look': 'The binoculars are new, but grime already cakes the hinges.'
        }
      }, 'binoculars', true), {
        'keys': [ 'swamp', 'mire', 'morass', 'bog', 'terrain', 'mud', 'ground' ],
        'verbs': {
          'look': 'The swamp is a vast bed of loamy muck, hooded by a dense tangle of stunted trees and creeping vines. Navigating it will be treacherous.'
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
        'keys': [ 'smoke', 'mysterious smoke', 'cabin', 'garden' ],
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
            'weighted-rope': `The weighed rope clatters off the rock face, and lands at your feet.`
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
      'name': 'the garled tree',
      'effect': once('The land beneath the tree is unbroken, lacking even a trace of the cave from your dreams. In its place is a peculiar itch in the back of your mind; desire, tinged with a deep feeling of loss.', 'tree'),
      'description': message('You stand at the base of a huge gnarled tree, its roots embedded in a rocky outcropping like veins of a strange precious metal. Camp is to the north, and ')
                      .append(ifFlagIs('explore', '2'), 'the mysterious smoke ')
                      .append(ifFlagGTE('explore', 3), 'the cabin ')
                      .append('is roughly to the south')
                      .append('.')
                      .build,
      'exits': { 
        'west': 'camp', 
        'south': 'garden'
      },
      'things': [{
        'keys': [ 'tree', 'gnarled tree', 'huge tree', 'big tree' ],
        'verbs': {
          'look': 'The tree looms over you like the skeleton of a long-dead horror. Its branches are bare and twisted, and coated with a scabrous ashen bark. Nothing grows nearby.'
        }
      }, {
        'keys': [ 'land', 'ground', 'rock', 'outcropping', 'roots', 'rocky outcropping', 'cave', 'soil' ],
        'verbs': {
          'look': 'The land beneath the tree is unbroken, lacking even a trace of the cave from your dreams. In its place is a peculiar itch in the back of your mind; desire, tinged with a deep feeling of loss.'
        }
      }, {
        'keys': [ 'camp', 'campsite', 'camp site' ],
        'exit': 'west',
        'verbs': {
          'look': `It is an hour's hike to the west.`
        }
      }, {
        'keys': [ 'smoke', 'mysterious smoke', 'cabin', 'garden' ],
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
      'effect': session => {
        if (ifFlagGTE('explore', 3)) { return null; }
        return {
          message: '',
          update: { flags: mapSet(session.flags, 'explore', '3') }
        };
      },
      'exits': {
        'north': 'camp',
        'east': 'tree',
        'west': 'cabin'
      },
      'things': [{
        'keys': [ 'tree', 'garled tree', 'huge tree' ],
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
        'keys': [ 'cabin', 'old cabin' ],
        'exit': 'west',
        'verbs': {
          'look': `The cabin is small, with sun-bleached paint peeling from its weathered wood walls. A thin trail of smoke rises from the chimney.`
        }
      }]
    },
    //#endregion

    //#region Cabin
    'cabin': {
      'name': 'a small cabin',
      'description': 'This is the cabin. Leave to the east.',
      'exits': { 'east': 'garden' },
      'things': []
    }
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
      'keys': [ 'stone', 'ruby', 'rock', 'glowing stone', 'glowing ruby' ],
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
        'look': 'The spool looks to contain several yards of thread.',
        'self': `Tethering yourself won't do any good.`
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
          }
          if (explore === 2) {
            desc = `${desc}, and mysterious smoke to its south`;
          }
          if (explore >= 3) {
            desc = `${desc}, and a cabin to its south`;
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
            update: {
              inventory: setMutate(session.inventory, [ 'weighted-rope' ], [ 'rope', 'shale' ])
            }
          }),
          'weighted-rope': 'The rope is already weighted.'
        }
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