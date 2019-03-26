// @flow

import express from 'express';

const PORT = process.env.SERVER_PORT || 8080;

const app = express();
app.use(express.static('dist'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

