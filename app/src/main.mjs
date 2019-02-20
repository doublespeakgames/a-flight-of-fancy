import Logger from './logger';
import Server from './server';
import Session from './model/session'

const PORT = process.env.APP_PORT || 5000;

Server.get('/', (req, res) => {
  Session.find((err, sessions) => {
    if (err) {
      Logger.error(`Error reading from MongoDB: ${err}`);
      res.error('DB ERROR');
      return;
    }
    res.send({ sessions, msg: 'foo' });
  });
});

Server.listen(PORT, () => Logger.info(`Server started on port ${PORT}`));