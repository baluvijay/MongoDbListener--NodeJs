const { MongoClient } = require('mongodb');
const config = require('./config');

const connect = async (appname) => {
  appname = appname || '';
  let uri = config.db;
  if (process.env.MONOG_USER) {
    if (uri.includes('mongodb+srv://')) {
      uri = uri.replace('mongodb+srv://', `mongodb+srv://${process.env.MONOG_USER}:${process.env.MONGO_PASSWORD}@`);
    } else {
      uri = uri.replace('mongodb://', `mongodb://${process.env.MONOG_USER}:${process.env.MONGO_PASSWORD}@`);
    }
  }
  const client = await MongoClient.connect(uri, {
    // error/warn/info/debug
    // loggerLevel: 'debug',
    monitorCommands: true,
    appname,
  });
  return client;
};

module.exports = {
  connect,
};
