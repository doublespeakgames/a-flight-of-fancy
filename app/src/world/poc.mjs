// @flow

import type { World } from '../model/world';

const world:World = {
  'id': 'poc',
  'start': 'pantry',

  //#region Rooms
  'rooms': {

    //#region Pantry
    'pantry': {
      'name': 'Pantry',
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
            if (session.inventory.includes('food')) {
              return { message: `You don't want any more.` };
            }
            return {
              message: 'You take some mouldy food',
              update: { inventory: [...session.inventory, 'food'] }
            };
          },
          'eat': `You don't want to eat that.`
        }
      }]
    },
    //#endregion

    //#region Kitchen
    'kitchen': {
      'name': 'Kitchen',
      'description': 'You are in what appears to be a monstrous kitchen. Crude knives hang above a well-worn cutting board, and a large pot bubbles over an open fire. There is a small cage hanging in the corner, and a rickety pantry to the south.',
      'exits': {
        'south': 'pantry'
      },
      'things': [{
        'keys': ['knife', 'knives', 'crude knife', 'crude knives'],
        'verbs': {
          'look': 'The knives are large and pitted, and not very clean.',
          'take': session => {
            if (session.inventory.includes('knife')) {
              return { message: 'You already have a knife' };
            }
            return {
              message: 'You take one of the knives',
              update: { inventory: [...session.inventory, 'knife'] }
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
          'look': 'Rotten wood burns beneath the pot, hissing acrid black smoke.'
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
        'keys': ['cutting board', 'board'],
        'verbs': {
          'look': 'The cutting board is a thick slab of knotted wood, deeply grooved from years of use.',
          'use': {
            'knife': 'You cut a few more notches into the board'
          }
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
    }
    //#endregion

  },
  //#endregion

  //#region Items
  'items': {

    'knife': {
      'keys': ['knife', 'crude knife'],
      'name': 'a knife',
      'useKey': 'knife',
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
      'useKey': 'food',
      'verbs': {
        'look': 'It\'s not very appetizing',
        'eat': `You don't want to eat that.`,
        'use': `You don't want to eat that.`
      }
    }
  }
  //#engregion
};

export default world;