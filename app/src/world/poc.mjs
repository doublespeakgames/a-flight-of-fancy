// @flow

import type { World } from '../model/world';
import { Synonym } from '../action-resolver';
import { add, remove, mutate } from '../immutable-set';

const world:World = {
  'id': 'poc',
  'start': 'pantry',

  //#region Rooms
  'rooms': {

    //#region Pantry
    'pantry': {
      'name': 'The pantry',
      'description': 'You are in a very small space. Shelves line the walls, and dim light seeps through a door to the north.',
      'exits': {
        'north': 'kitchen'
      },
      'things': [{
        'keys': ['shelf', 'shelves', 'shelving'],
        'verbs': {
          'look': 'The shelves are littered with moldering foodstuffs.'
        }
      }, {
        'keys': ['door', 'north', 'light'],
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
              update: { inventory: add(session.inventory, 'food') }
            };
          },
          'eat': `You don't want to eat that.`
        }
      }]
    },
    //#endregion

    //#region Kitchen
    'kitchen': {
      'name': 'The kitchen',
      'description': 'You are in what appears to be a monstrous kitchen. Crude knives hang above a well-worn cutting board, and a large pot bubbles over an open fire. There is a pantry on the southern wall, next to a small cage. A doorway leads east.',
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
              update: { inventory: add(session.inventory, 'knife') }
            };
          }
        }
      }, {
        'keys': ['pot', 'large pot', 'bubbling pot', 'big pot'],
        'verbs': {
          'look': 'The pot is huge and rusted. A foul-smelling liquid boils violently inside.'
        }
      }, {
        'keys': ['fire', 'open fire', 'cooking fire', 'flame', 'flames'],
        'verbs': {
          'look': 'Rotten wood burns beneath the pot, hissing acrid black smoke.',
          'use': {
            'torch': session => ({
              message: 'You hold your improvised torch in the fire until it catches',
              update: {
                inventory: mutate(session.inventory, ['lit-torch'], ['torch'])
              }
            })
          }
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
        'keys': ['cutting board', 'board'],
        'verbs': {
          'look': session => {
            const rag = session.gone.has('rag') ? '' : ' A greasy rag hangs from the corner.';
            return { message: `The cutting board is a thick slab of knotted wood, deeply grooved from years of use.${rag}` };
          },
          'use': {
            'knife': 'You cut a few more notches into the board'
          }
        }
      }, {
        'id': 'rag',
        'keys': ['rag', 'greasy rag', 'cloth', 'greasy cloth'],
        'verbs': {
          'look': 'The rag is a rough burlap, smeared with rancid fat.',
          'take': session => ({
            message: 'You take the rag',
            update: {
              inventory: add(session.inventory, 'rag'),
              gone: add(session.gone, 'rag')
            }
          })
        }
      }, {
        'keys': ['liquid', 'boiling liquid' ],
        'verbs': {
          'look': 'It looks worse than it smells.',
          'eat': 'It tastes worse than it looks.'
        }
      }, {
        'keys': ['cage', 'small cage'],
        'verbs': {
          'look': 'Inside the cage, a strange creature huddles furtively.',
          'open': 'The cage is held shut by a sturdy lock.'
        }
      }, {
        'keys': ['lock', 'sturdy lock'],
        'verbs': {
          'look': `The lock is as big as your fist.`,
          'open': `It won't open`
        }
      },{
        'keys': ['creature', 'strange creature'],
        'verbs': {
          'look': 'The creature is cat-like, but covered in dull scales. Its face is unnervingly human, and it watches you with keen eyes.',
          'talk': (session, world) => {
            if (session.flags['it_spoke']) {
              return { message: 'It just watches you, expectantly.' }
            }
            return {
              message: `"Still alive?' the creature hisses. "Let it out! It doesn't want to be dinner."`,
              update: { flags: { 'it_spoke': 'true' }}
            };
          }
        }
      }]
    },
    //#endregion

    //#region Dining Room 
    'great-room': {
      name: 'The great room',
      description: session => {
        const hound = session.flags.hound ? 'lies' : 'squats';
        return `This room is long and wide, with a low hewn-stone ceiling. A large table dominates the center, and a beastly hound ${hound} in the corner. There are doors to the west and south and, behind the hound, a hall stretches north.`;
      },
      exits: {
        'west': 'kitchen',
        'south': 'locked-room',
        'north': 'bedroom'
      },
      locks: {
        'south': _ => `The door won't open.`,
        'north': session => session.flags.hound ? null : `The hound snaps at you, and you reconsider.`
      },
      things: [{
        'keys': [ 'ceiling' ],
        'verbs': {
          'look': 'The ceiling has been roughly chiseled our of natural rock.'
        }
      }, {
        'keys': ['table', 'large table'],
        'verbs': {
          'look': 'The table stands as high as your chest and looks to have been made from a single slab of wood.'
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
                update: { flags: { 'hound': 'dead' } }
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
                  inventory: remove(session.inventory, 'food'),
                  flags: { 'hound': 'fed' } 
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
                gone: add(session.gone, 'dog-bone'),
                inventory: add(session.inventory, 'bone')
              }
            };
          }
        }
      }]
    },
    //#endregion

    //#region Locked Room
    'locked-room': {
      name: 'A locked room',
      description: `You shouldn't be able to get in here. You can leave via the north.`,
      exits: {
        'north': 'great-room'
      }
    },
    //#endregion

    //#region TODO
    'bedroom': {
      name: 'The bedroom',
      description: ({ inventory }) => {
        if (inventory.has('lit-torch')) {
          return `Your torch illuminates the room, but Michael hasn't written the description yet. You can still go south.`;
        }
        return 'It is too dark to see. A loud, rhythmic rumbling fills the room. Faint light outlines a hall to the south.';
      },
      exits: {
        'south': 'great-room'
      }
    }
    //#endregion TODO

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
      'keys': ['food', 'mouldy food', 'mould'],
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
    
    'rag': {
      'id': 'rag',
      'keys': ['rag', 'greasy rag', 'cloth', 'greasy cloth'],
      'name': 'a greasy rag',
      'verbs': {
        'look': 'The rag is a rough bulap, smeared with rancid fat.',
        'tie': new Synonym('use'),
        'use': {
          'bone': session => ({
            message: 'You wrap the rag tightly around one end of the bone',
            update: {
              inventory: mutate(session.inventory, ['torch'], ['rag', 'bone'])
            }
          })
        }
      }
    },

    'torch': {
      'id': 'torch',
      'keys': ['torch', 'bone'],
      'name': 'an improvised torch',
      'verbs': {
        'look': 'A greasy rag is secured to the end of a long bone. It is not lit.'
      }
    },
    
    'lit-torch': {
      'id': 'lit-torch',
      'keys': ['torch', 'bone', 'lit torch', 'lit bone'],
      'name': 'a lit torch',
      'verbs': {
        'look': 'Flames sputter from a greasy rag atop a long bone.'
      }
    }
  }
  //#engregion
};

export default world;