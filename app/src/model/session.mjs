import Store from '../store';
import Logger from '../logger';

const schema = Store.Schema({
  id: String
});

const Session = Store.model('Session', schema); 

// Insert test data, if necessary
Session.find({ id: /^fhqwhgads$/ }, (err, rows) => {
  if (rows.length > 0) {
    return;
  }
  const s = new Session({ id: 'fhqwhgads' });
  s.save(err => {
    if (err) {
      Logger.error(`Failed to initialize test session: ${err}`);
      return;
    }
    Logger.info('Initialized test session');
  })
});

export default Session;