// @flow

import express from 'express';
import { getSessions } from '../store';
import { serialize } from '../model/session';

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*'); // TODO
  next();
});

router.get('/session', async (req, res) => {
  const sessions = await getSessions();
  res.send(sessions.map(serialize));
});

export default router;