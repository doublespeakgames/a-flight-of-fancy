// @flow
/**
 * Data Store
 * @author mtownsend
 * @since Feb 2019
 * 
 * Configures Mongoose for speaking with MongoDB
 */

import Mongoose from 'mongoose';
import Logger from './logger';
import Config from './config';

let tries = 0;
(function tryConnect() {
  Mongoose.connect(Config.db, err => {
    if (err) {
      if (tries++ < 10) {
        Logger.warn(`Failed to connect to MongoDB: ${err}`);
        setTimeout(tryConnect, 1000);
      }
      else {
        Logger.error(`Maximum number of attempts to connect to MongoDB: ${err}`);
      }
      return;
    }
    Logger.info('Connected to MongoDB');
  });
})();

export default Mongoose;



