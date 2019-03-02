// @flow

/**
 * Main server
 * @author mtownsend
 * @since Feb 2019
 * 
 * Configures endpoints and bootstraps the application
 */

import Logger from './util/logger';
import Server from './server';
import { getSessions } from './store';
import GoogleEndpoint from './endpoint/google';
import { serialize } from './model/session';

const PORT = process.env.APP_PORT || 5000;

Server.get('/test', async (req, res) => {
  const sessions = await getSessions();
  res.send(sessions.map(serialize));
});

Server.post('/google', GoogleEndpoint);

Server.listen(PORT, () => Logger.info(`Server started on port ${PORT}`));