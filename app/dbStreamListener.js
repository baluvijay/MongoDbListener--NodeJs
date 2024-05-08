/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');

const mongooseConfig = require('../app/config/mongoose');
const { runJob } = require('../app/aktivoAdminBot/aktivoAdminBot');

const LOGGER_NAME = '[DbStreamListener]';

exports.run = async () => {
  const currentTime = new Date();
  console.log(`${LOGGER_NAME} - Running ${currentTime.toISOString()}`);
  let error = null;
  try {
    await mongooseConfig.connect();
    console.log(`${LOGGER_NAME} - MongoDB connection is open`);
    await runJob();
  } catch (err) {
    error = err;
    console.error(err);
  } finally {
    console.log(`${LOGGER_NAME} - Closing MongoDB connection`);
    // NOTE: Process is not stopping due to hangup at mongoose.disconnect
    // mongoose.connection.close is used to forcibly close all connections.
    // Yet to investigate hanging at mongoose.disconnect.
    await mongoose.connection.close(true);
    await mongoose.disconnect();
    console.log(`${LOGGER_NAME} - MongoDB connection is closed`);
  }
  // Fail process if error happened
  if (error) {
    throw error;
  }
};
