// @flow

import type { World } from '../model/world';

const world:World = {
  'id': 'poc',
  'start': 'pantry',
  'rooms': {

    'pantry': {
      'name': 'Pantry',
      'description': 'You are in a very small space. Shelves line the walls, and dim light seeps through a door to the north.',
      'exits': {
        'north': 'kitchen'
      },
      'things': [{
        'keys': ['shelf', 'shelves', 'shelving'],
        'description': 'The shelves are littered with moldering foodstuffs.'
      }, {
        'keys': ['door', 'north', 'light'],
        'description': 'The door hangs slightly off its hinges, letting in a bit of feeble light.',
        'exit': 'north'
      }, {
        'keys': ['food', 'foodstuffs', 'foodstuff', 'stuff'],
        'description': 'It\'s not very appetizing',
        'take': session => {
          if (session.inventory.includes('food')) {
            return { message: `You don't want any more.` };
          }
          return {
            message: 'You take some mouldy food',
            update: { inventory: [...session.inventory, 'food'] }
          };
        }
      }]
    },

    'kitchen': {
      'name': 'Kitchen',
      'description': 'You are in what appears to be a monstrous kitchen. Crude knives hang above a well-worn cutting board, and a large pot bubbles over an open fire. There is a rickety pantry to the south.',
      'exits': {
        'south': 'pantry'
      },
      'things': [{
        'keys': ['knife', 'knives', 'crude knife', 'crude knives'],
        'description': 'The knives are large and pitted, and not very clean.',
        'take': session => {
          if (session.inventory.includes('knife')) {
            return { message: 'You already have a knife' };
          }
          return {
            message: 'You take one of the knives',
            update: { inventory: [...session.inventory, 'knife'] }
          };
        }
      }, {
        'keys': ['pot', 'large pot', 'bubbling pot', 'big pot'],
        'description': 'The pot is huge and rusted. A foul-smelling liquid boils violently inside.'
      }, {
        'keys': ['fire', 'open fire', 'cooking fire', 'flame', 'flames'],
        'description': 'Rotten wood burns beneath the pot, hissing acrid black smoke.'
      }, {
        'keys': ['pantry', 'rickety pantry'],
        'description': 'The pantry door hangs open, revealing a space just large enough for a person to enter.',
        'exit': 'south'
      }, {
        'keys': ['cutting board', 'board'],
        'description': 'The cutting board is a thick slab of knotted wood, deeply grooved from years of use.'
      }]
    }

  },
  'items': {
    'knife': {
      'keys': ['knife', 'crude knife'],
      'description': 'The knife is large and pitted, and not very clean.',
      'useKey': 'knife',
      'use': {
        'self': _ => ({ message: `You don't want to cut yourself.` }),
        'food': _ => ({ message: `You cut the food into small pieces.` })
      }
    },
    'food': {
      'keys': ['food', 'mouldy food', 'mould'],
      'description': 'It\'s not very appetizing',
      'useKey': 'food',
      'use': `You don't want to eat that.`
    }
  }
};

export default world;