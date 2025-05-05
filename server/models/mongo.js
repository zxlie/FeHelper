const { MongoClient } = require('mongodb');
const config = require('./config');

let client = null;
let db = null;

async function getDb() {
  if (db) return db;
  if (!client) {
    client = new MongoClient(config.mongoUri, { useUnifiedTopology: true });
    await client.connect();
  }
  db = client.db(config.mongoDbName || 'fehelper');
  return db;
}

module.exports = { getDb }; 