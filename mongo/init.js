db.session.createIndex( { "updated": 1 }, { expireAfterSeconds: 86400 } );
db.canary.insert({ when: Date.now(), value: 'It worked?' });