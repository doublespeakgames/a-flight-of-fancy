// @flow
/**
 * Talk Action
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles speaking with actors
 */
export default (actor:string) => {
  return {
    message: `${actor} ignores you. What a jerk.`
  };
};