const Mongoose = require('mongoose');
const Logger = require('./logger');
const Config = require('./config');

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

module.exports = Mongoose;



