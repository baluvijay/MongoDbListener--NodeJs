const merge2 = require('merge2');
const { get: _get } = require('lodash');
const mongoose = require('mongoose');
const { createBatchRequestStream } = require('../app/streams/batchRequestStream');

const { getStreamDbClient } = require('./streams/db/streamDbClient');
const { model } = require('./models/models');



const { gameAggregatesChangeStream } = require('../app/streams/sourcesStreams/gameAggregatesChangeStream');

const { Types: { ObjectId } } = mongoose;
const {
  gameAggregatesProcessor,
} = require('../app/streams/batchStreams/gameAggregatesProcessor');

const processJobGameAggregatesTrigger = async (jobMetaData, dbStreamClient) => {
  const gameAggregatesLogStream = await gameAggregatesChangeStream(jobMetaData, dbStreamClient, {});
  const sourceStreamMembersHub = merge2({ end: false, objectMode: true });

  const batchRequesGameAggregatesLogStream = createBatchRequestStream({
    processName: _get(jobMetaData, ['processName']),
    subProcessName: 'batchStreamGameAggregatesLog',
    jobId: _get(jobMetaData, ['jobId'], new ObjectId()),
    batchSize: 100,
    maxLiveRequests: 1,
    maxWaitTime: 100,
    request: gameAggregatesProcessor,
  });
  sourceStreamMembersHub.add([gameAggregatesLogStream.input]);
  sourceStreamMembersHub.pipe(batchRequesGameAggregatesLogStream.input);

  return new Promise(() => {});
};




const runJob = async () => {
  const jobId = new ObjectId();
  const processName = '[DbStreamListener]';

  // Create a common client at the start
  const dbStreamClient = await getStreamDbClient();

  const jobMetaData = {
    processName,
    jobId,
  };
  console.log('Job running ');

  // instead of adding it here make it addable by creating an instance of the class
  const adminBotJobs = [
    processJobGameAggregatesTrigger(jobMetaData, dbStreamClient),
  ];
  await Promise.all(adminBotJobs);
  console.log('Job Completed ');
};

exports.runJob = runJob;
