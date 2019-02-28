// @flow

import type { World } from '../model/world';
import { Synonym } from '../action-resolver';
import { setAdd, setRemove, setMutate, mapSet } from '../immutable';
import locked from '../model/locked';

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
      'things': [{
        'keys': ['shelf', 'shelves', 'shelving', 'wall', 'walls'],
        'verbs': {
          'look': 'The shelves are littered with moldering foodstuffs.'
        }
      }, {
        'keys': ['door', 'light'],
        'exit': 'north',
        'verbs': {
          'look': 'The door hangs slightly off its hinges, letting in a bit of feeble light.',
          'open': 'The door swings loosely',
          'close': 'The door swings loosely'
        }
      }, {
        'keys': ['food', 'foodstuffs', 'foodstuff', 'stuff'],
        'verbs': {
          'look': 'It\'s not very appetizing',          
          'take': session => {
            if (session.inventory.has('food')) {
              return { message: `You don't want any more.` };
            }
            return {
              message: 'You take some mouldy food',
              update: { inventory: setAdd(session.inventory, 'food') }
            };
          },
          'eat': `You don't want to eat that.`
        }
      }],
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
      'things': [{
        'keys': ['knife', 'knives', 'crude knife', 'crude knives'],
        'verbs': {
          'look': 'The knives are large and pitted, and not very clean.',
          'take': session => {
            if (session.inventory.has('knife')) {
              return { message: 'You already have a knife' };
            }
            return {
              message: 'You take one of the knives',
              update: { inventory: setAdd(session.inventory, 'knife') }
            };
          }
        }
      }, {
        'keys': ['pot', 'large pot', 'bubbling pot', 'big pot', 'cauldron'],
        'verbs': {
          'look': 'The pot is huge and rusted. A foul-smelling liquid boils violently inside.'
        }
      }, {
        'keys': ['fire', 'open fire', 'cooking fire', 'flame', 'flames'],
        'verbs': {
          'look': 'Rotten wood burns beneath the pot, hissing acrid black smoke.',
          'light': new Synonym('use'),
          'use': {
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
          'look': 'The pantry door hangs open, revealing a space just large enough for a person to enter.',
          'open': 'The pantry door swings loosely.',
          'close': 'The pantry door swings loosely.'
        }
      }, {
        'keys': ['door', 'doorway'],
        'exit': 'east',
        'verbs': {
          'look': `It's less a door, and more an absence of wall.`
        }
      },{
        'keys': ['cutting board', 'cuttingboard', 'board'],
        'verbs': {
          'look': session => {
            const cloth = session.gone.has('cloth') ? '' : ' A greasy cloth hangs from the corner.';
            return { message: `The cuttingboard is a thick piece of knotted wood, deeply grooved from years of use.${cloth}` };
          },
          'use': {
            'knife': 'You cut a few more notches into the board'
          }
        }
      }, {
        'id': 'cloth',
        'keys': ['cloth', 'greasy cloth'],
        'verbs': {
          'look': 'The cloth is a rough burlap, smeared with rancid fat.',
          'take': session => ({
            message: 'You take the cloth',
            update: {
              inventory: setAdd(session.inventory, 'cloth'),
              gone: setAdd(session.gone, 'cloth')
            }
          })
        }
      }, {
        'keys': ['liquid', 'boiling liquid' ],
        'verbs': {
          'look': 'It looks worse than it smells.',
          'eat': 'It tastes worse than it looks.'
        }
      }, locked({
        'keys': ['cage', 'small cage', 'lock', 'sturdy lock'],
        'name': 'the cage',
        'verbs': {
          'look': session => ({ message: session.flags.it !== 'freed' 
            ? 'Inside the cage, a strange creature huddles furtively.' 
            : `The cage is empty. Its door is ${session.flags.cage === 'open' ? 'open' : 'closed'}.` }),
          'open': session => {
            if (session.flags.cage === 'open') {
              return { message: 'The cage is already open.' };
            }
            if (!session.flags.cage) {
              return { message: 'The cage is secured with a sturdy lock, and will not open.' };
            }
            if (session.flags.it === 'freed' ) {
              return { 
                message: 'You open the cage.',
                update: { flags: mapSet(session.flags, 'cage', 'open') }
              };
            }
            return {
              message: `You lift the latch and open the cage door. The cat-thing inside leaps deftly out, landing atop the pantry. It watches you for a moment, before hopping down and disappearing around a corner.`,
              update: {
                flags: mapSet(session.flags, { 'it': 'freed', 'cage': 'open' }),
                gone: setAdd(session.gone, 'creature')
              }
            };
          }
        }
      }, { stateKey: 'cage', keyId: 'keys', unlockMessage: `You try three keys before one turns in the lock with a loud click. The creature's ears perk.`}), {
        'id': 'creature',
        'keys': ['creature', 'strange creature'],
        'verbs': {
          'look': 'The creature is cat-like, but covered in dull scales. Its face is unnervingly human, and it watches you with keen eyes.',
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
        keys: ['free the creature', 'let the creature out', 'let it out'],
        action: 'open:cage'
      }, {
        keys: ['unlock cage', 'unlock the cage', 'unlock lock', 'unlock the lock'],
        action: 'use:keys:lock'
      }]
    },
    //#endregion

    //#region Greatroom 
    'great-room': {
      'name': 'the greatroom',
      'description': session => {
        const hound = session.flags.hound ? 'lies' : 'squats';
        return `This room is long and wide, with a low hewn-stone ceiling. A large table dominates the center, and a beastly hound ${hound} in the corner. There are doors to the west and south and, behind the hound, a hall stretches north.`;
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
      'things': [{
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
        'keys': ['table', 'large table'],
        'verbs': {
          'look': 'The table stands as high as your chest and looks to have been made from a single slab of wood. It is bare.'
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
        keys: ['feed the dog', 'feed the hound', 'feed dog', 'feed hound'],
        action: 'give:food:dog'
      }, {
        keys: ['unlock door', 'unlock the door', 'unlock south door', 'unlock the south door', 'unlock the southern door'],
        action: 'use:key:door'
      }]
    },
    //#endregion

    //#region Bedroom
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
      'description': `Illuminated by torchlight, you can see that you are in a small bedroom. Immediately in front of you, a bog giant snores loudly atop a bed of filthy straw. Its huge, doubleheaded axe lies nearby. Against the back wall is a heavy wooden trunk. A hallway leads south.`,
      'things': [{
        'keys': ['hall', 'hallway'],
        'exit': 'south',
        'verbs': {
          'look': 'The hall leads south.'
        }
      }, locked({
        'name': 'the trunk',
        'keys': ['trunk', 'wooden trunk', 'heavy wooden trunk', 'chest', 'wooden chest', 'heavy wooden chest'],
          'verbs': {
            'look': session => ({ message: session.flags.trunk === 'open' 
                ? 'The trunk is filled with sparkling red gems.' 
                : `The trunk is made from thick wooden boards, banded with rusting iron. The wood is swollen from moisture, and bits of moss are growing in the seams.` })
          }
      }, { stateKey: 'trunk', keyId: 'keys', unlockMessage: 'The lock fits the first key you try, and clicks open.' }), {
        'keys': [ 'moss' ],
        'verbs': {
          'look': 'The moss grows in the seams of a large wooden trunk.'
        }
      }, {
        'keys': ['gem', 'gym', 'gems', 'sparkling gem', 'sparkling red gem', 'ruby', 'rubies', 'all the gems', 'all of the gems', 'more gems', 'another gem'],
        'visibility': session => session.flags.trunk === 'open',
        'verbs': {
          'look': 'The gems are walnut-sized, and glitter brilliantly in the torchlight.',
          'take': session => {
            if (session.inventory.has('gem')) {
              return { message: 'You already have a gem.' };
            }
            return {
              message: 'You take a gem.',
              update: { inventory: setAdd(session.inventory, 'gem') }
            };
          }
        }
      }, {
        'keys': ['straw', 'bed', 'bed of straw', 'straw bed', `giant's bed`, 'filthy straw', 'bed of filthy straw'],
        'verbs': {
          'look': session => {
            const keys = session.flags.belt && !session.gone.has('keys') ? ' A large keyring is nestled amongst the filth.' : '';
            return { message: `The straw smells awful but the giant, sprawled in the center, doesn't seem to care.${keys}` };
          }
        }
      }, {
        'keys': ['giant', 'bog giant'],
        'verbs': {
          'look': session => {
            const belt = session.flags['belt'] ? '' : ` Around its waist is tied a belt of rough twine, from which hangs a large keyring.`;
            return { message: `The giant is enormous, with wide drooping features and a ponderous girth. Its hide is the texture of waterlogged driftwood, and is stippled with patches of multicoloured lichens.${belt}` };
          },
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
              : `A length of hempen twine loops around the giant's waist, supporting a large keyring.` }),
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
                message: 'You carefully slip the knife beneath the twine and pull. It catches for a moment but then the belt gives way, spilling the keyring onto the floor.',
                update: { flags: mapSet(session.flags, 'belt', 'cut') }
              };
            }
          }
        }
      }, {
        'keys': ['keyring', 'key ring', 'large keyring', 'keys', 'key', `giant's keyring`, `giant's keys`],
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
            return { message: `The giant's belt loops through the keyring, holding it in place.` };
          }
        }
      }, {
        'keys': ['lichen', 'lichens', 'multicoloured lichens', 'multicolored lichens', 'multicoloured lichen', 'multicolored lichen'],
        'verbs': {
          'look': 'The lichens are numerous and varied, ranging in colour from dull green to brilliant crimson.'
        }
      }, {
        'keys': ['axe', 'acts', 'huge axe', 'huge acts', 'doubleheaded axe', `giant's axe`],
        'verbs': {
          'look': 'The axe head is made of chipped stone, and is lashed to a haft nearly six feet long. It looks heavy.',
          'take': `You can't lift it.`
        }
      }],
      'phrases': [{
        'keys': [ 'unlock the trunk', 'unlock the wooden trunk', 'unlock the heavy trunk', 'unlock the heavy wooden trunk', 'unlock the chest', 'unlock the wooden chest', 'unlock the heavy chest', 'unlock the heavy wooden chest'],
        'action': 'use:key:trunk'
      }],
      'exits': {
        'south': 'great-room'
      }
    },
    //#endregion Bedroom-lit

    //#region Tunnel
    'tunnel': {
      'name': 'a tunnel',
      'description': `You are in a cavernous tunnel. On the walls, bioluminescent moss glows faintly. There is a door to the north, and the passage continues to the south. Tiny goblins dart about your feet, visible only for a moment before vanishing deeper into darkness.`,
      'exits': {
        'north': 'great-room',
        'south': 'maze'
      },
      'entryEffect': session => {
        if (!session.inventory.has('gem') || session.effects.has('goblin')) {
          return null;
        }
        return {
          message: 'The goblins appear entranced by your sparkling gem.',
          update: { effects: setAdd(session.effects, 'goblin') }
        };
      },
      'things': [{
        'keys': [ 'goblin', 'goblins', 'tiny goblin', 'tiny goblins', 'small goblin', 'small goblins' ],
        'verbs': {
          'look': 'The goblins are no larger than rats, and are in constant motion. They carry small bags, and appear to be collecting bits of gravel.',
          'take': 'The goblins easily avoid your attempts at capture.',
          'attack': new Synonym('use'),
          'use': {
            'knife': 'The goblins easily avoid your attempts at violence.'
          }
        }
      }, {
        'keys': [ 'moss', 'bioluminescent moss', 'bioluminescence', 'walls', 'wall', 'moss on the wall', 'moss on the walls' ],
        'verbs': {
          'look': 'The moss covers large swaths of the rock walls, and emits a soft green light.'
        }
      }]
    },
    //#endregion

    //#region Maze
    'maze': {
      'name': 'maze',
      'description': 'You in the maze. Hooray. Game over.',
      'exits': { 
        'north': 'tunnel'
      }
    }
    //#endregion

  },
  //#endregion

  //#region Global Effects
  'effects': {
    'goblin': {
      'description': 'A tiny goblin is following you.',
      'things': [{
        'keys': [ 'goblin', 'tiny goblin' ],
        'verbs': {
          'look': 'The goblin stays well out of reach, but remains fixated on the gem you are carrying.',
          'take': 'The goblin easily avoids your attempts at capture.',
          'attack': new Synonym('use'),
          'use': {
            'knife': 'The goblin easily avoids your attempts at violence.'
          }
        }
      }] 
    }
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

    'gem': {
      'id': 'gem',
      'keys': [ 'gem', 'gym', 'ruby', 'sparkling gem', 'sparkling ruby' ],
      'name': 'a sparkling gem',
      'verbs': {
        'look': 'The gem is walnut-sized and sparkles enticingly.'
      }
    }
  }
  //#engregion
};

export default world;