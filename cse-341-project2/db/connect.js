// db/connect.js
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config();

let _db;

const initDb = (callback) => {
  if (_db) {
    console.log('Db is already initialized!');
    return callback(null, _db);
  }

  // Remove deprecated options
  MongoClient.connect(process.env.MONGODB_URI)
    .then((client) => {
      _db = client.db(); // Use the database from the client
      console.log('Database connected successfully');
      callback(null, _db);
    })
    .catch((err) => {
      console.error('Failed to connect to the database:', err);
      callback(err);
    });
};

const getDb = () => {
  if (!_db) {
    throw Error('Db not initialized');
  }
  return _db;
};

module.exports = {
  initDb,
  getDb
};