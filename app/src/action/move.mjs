// @flow
/**
 * Move Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles movement between rooms
 */
export default (direction:string) => {
  if (direction.toLowerCase() !== 'north') {
    return {
      message: `You can't go ${direction}`
    };
  }
  return {
    message: `You go ${direction} and are eaten by a grue.`,
    close: true
  };
};