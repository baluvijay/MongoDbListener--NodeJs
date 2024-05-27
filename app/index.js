const merge2 = require('merge2');
const { get: _get,set:_set } = require('lodash');
const mongoose = require('mongoose');
const { createBatchRequestStream } = require('../app/streams/batchRequestStream');

const { getStreamDbClient } = require('./streams/db/streamDbClient');
const { model } = require('./models/models');
const SampleModel = model('SampleModel');



const { modelChangeStream } = require('./streams/sourcesStreams/modelChangeStream');

const { Types: { ObjectId } } = mongoose;
const {
  dataProcessor,
} = require('./streams/batchStreams/dataProcessor');

const processSampleModelTriggers = async (jobMetaData, dbStreamClient,collectionModel,keys) => {
  const modelLogStream = await modelChangeStream(jobMetaData, dbStreamClient, {},collectionModel,keys);
  const sourceStreamMembersHub = merge2({ end: false, objectMode: true });

  const batchRequesGameAggregatesLogStream = createBatchRequestStream({
    processName: _get(jobMetaData, ['processName']),
    subProcessName:_get(jobMetaData, ['subProcessName']),
    jobId: _get(jobMetaData, ['jobId'], new ObjectId()),
    batchSize: 100,
    maxLiveRequests: 1,
    maxWaitTime: 100,
    request: dataProcessor,
    collectionModel,
    keys
  });
  sourceStreamMembersHub.add([modelLogStream.input]);
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
    processSampleModelTriggers(jobMetaData, dbStreamClient,SampleModel,["user","totalPoints"],_set(jobMetaData,'subProcessName',"SampleModelLogAggregator")),
  ];
  await Promise.all(adminBotJobs);
  console.log('Job Completed ');
};

exports.runJob = runJob;
