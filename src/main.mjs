import Logger from './logger';
import Server from './server';
import Session from './model/session'

Server.get('/', (req, res) => {
  Session.find((err, sessions) => {
    if (err) {
      Logger.error(`Error reading from MongoDB: ${err}`);
      res.error('DB ERROR');
      return;
    }
    res.send(sessions);
  });
});

Server.listen(5000, () => Logger.info('Server started'));