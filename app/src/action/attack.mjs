// @flow
/**
 * Attack Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles fighting with actors
 */
export default (actor:string) => {
  return {
    message: `You're too scared of ${actor}`
  };
};