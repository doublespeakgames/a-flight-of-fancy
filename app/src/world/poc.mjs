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
      }
    },
    'kitchen': {
      'name': 'Kitchen',
      'description': 'You are in what appears to be a monstrous kitchen. Crude knives hang above a well-worn cutting board, and a large pot bubbles over an open fire. There is an open pantry to the south.',
      'exits': {
        'south': 'pantry'
      }
    }
  }
};

export default world;