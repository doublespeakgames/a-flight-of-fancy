// @flow
/**
 * Data Store
 * @author mtownsend
 * @since Feb 2019
 * 
 * Interface for MongoDB
 */

import MongoDB from 'mongodb';
import Logger from './logger';
import Config from './config';

import type { MongoClient, Db } from 'mongodb';
import type { Session } from './model/session';
import type { World } from './model/world';

const dbPromise:Promise<Db> = new MongoDB.MongoClient(Config.database.url)
  .connect()
  .then(client => client.db(Config.database.name));


export async function getSessions():Promise<Array<Session>> {
  const db = await dbPromise;
  return db.collection('session').find({}).toArray();
}

export async function getSession(id:string):Promise<Session> {
  const db = await dbPromise;
  return db.collection('session').findOne({ _id: id });
}

export async function writeSession(session:Session):Promise<Session> {
  const db = await dbPromise;
  return db.collection('session').save(session);
}

export async function getWorld(id:string):Promise<World> {
  // Stub
  const m = await import('./world/poc');
  return m.default;
}




