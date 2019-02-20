// @flow

/**
 * Main server
 * @author mtownsend
 * @since Feb 2019
 * 
 * Configures endpoints and bootstraps the application
 */

import Logger from './logger';
import Server from './server';
import Session from './model/session'
import GoogleEndpoint from './endpoint/google';

const PORT = process.env.APP_PORT || 5000;

Server.get('/test', (req, res) => {
  Session.find((err, sessions) => {
    if (err) {
      Logger.error(`Error reading from MongoDB: ${err}`);
      res.error('DB ERROR');
      return;
    }
    res.send({ sessions, msg: 'foo' });
  });
});

Server.post('/google', GoogleEndpoint);

Server.listen(PORT, () => Logger.info(`Server started on port ${PORT}`));