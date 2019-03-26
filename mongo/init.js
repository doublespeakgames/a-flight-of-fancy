db.session.createIndex( { "updated": 1 }, { expireAfterSeconds: 604800 } );
db.canary.insert({ when: Date.now(), value: 'It worked?' });