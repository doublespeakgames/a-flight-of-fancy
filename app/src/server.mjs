// @flow
/**
 * Server
 * @author mtownsend
 * @since Feb 2019
 * 
 * Configures the Express server
 */

import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

export default app;