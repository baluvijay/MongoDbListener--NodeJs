const mongoose = require('mongoose');
const config = require('./config');

exports.connect = async () => {
  let uri = config.db;
  if (process.env.MONOG_USER) {
    if (uri.includes('mongodb+srv://')) {
      uri = uri.replace('mongodb+srv://', `mongodb+srv://${process.env.MONOG_USER}:${process.env.MONGO_PASSWORD}@`);
    } else {
      uri = uri.replace('mongodb://', `mongodb://${process.env.MONOG_USER}:${process.env.MONGO_PASSWORD}@`);
    }
  }
  await mongoose.connect(uri, {
    bufferCommands: false,
    autoIndex: false, // Don't build indexes
    maxPoolSize: 500, // Maintain up to 'N' socket connections
    minPoolSize: 50, // The minimum number of sockets the MongoDB driver will keep open for this connection
    socketTimeoutMS: 2 * 60 * 1000, // Keep socket connection 2 mins
    family: 4, // Use IPv4, skip trying IPv6
  });

  return uri;
};
