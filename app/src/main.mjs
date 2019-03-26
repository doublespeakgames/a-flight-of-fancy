// @flow

/**
 * Main server
 * @author mtownsend
 * @since Feb 2019
 * 
 * Configures endpoints and bootstraps the application
 */

import Config from './config';
import Logger from './util/logger';
import Server from './server';
import GoogleEndpoint from './endpoint/google';
import JsonEndpoint from './endpoint/json';
import { delay } from './util/timer';

const PORT = process.env.APP_PORT || 5000;

const lag = ms => async (req, res, next) => {
  Logger.info(`Delaying by ${ms}ms...`);
  await delay(ms);
  next();
}

const log = (req, res, next) => {
  Logger.info(`Request received`);
  next();
}

if (Config.json) {
  Server.use('/json/', JsonEndpoint);
}

Server.post('/google', log, GoogleEndpoint);

Server.listen(PORT, () => Logger.info(`Server started on port ${PORT}`));