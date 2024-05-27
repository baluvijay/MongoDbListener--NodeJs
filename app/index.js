const merge2 = require('merge2');
const { get: _get, set: _set, forEach: _forEach } = require('lodash');
const mongoose = require('mongoose');
const { createBatchRequestStream } = require('../app/streams/batchRequestStream');
const { dataAdderToAdminBot } = require('../app/preProcessor/dataAdder');
const { getStreamDbClient } = require('./streams/db/streamDbClient');
const { modelChangeStream } = require('./streams/sourcesStreams/modelChangeStream');

const { Types: { ObjectId } } = mongoose;
const {
  dataProcessor,
} = require('./streams/batchStreams/dataProcessor');

const processSampleModelTriggers = async (jobMetaData, dbStreamClient, collectionModel, keys) => {
  const modelLogStream = await modelChangeStream(jobMetaData, dbStreamClient, {}, collectionModel, keys);
  const sourceStreamMembersHub = merge2({ end: false, objectMode: true });

  const batchRequesGameAggregatesLogStream = createBatchRequestStream({
    processName: _get(jobMetaData, ['processName']),
    subProcessName: _get(jobMetaData, ['subProcessName']),
    jobId: _get(jobMetaData, ['jobId'], new ObjectId()),
    batchSize: 100,
    maxLiveRequests: 1,
    maxWaitTime: 100,
    request: dataProcessor,
    collectionModel,
    keys,
  });
  sourceStreamMembersHub.add([modelLogStream.input]);
  sourceStreamMembersHub.pipe(batchRequesGameAggregatesLogStream.input);

  return new Promise(() => {});
};




const runJob = async () => {
  const jobId = new ObjectId();
  const processName = '[DbStreamListener]';

  const dbStreamClient = await getStreamDbClient();

  const jobMetaData = {
    processName,
    jobId,
  };
  console.log('Job running ');

  const adminBotJobs = [];
  const values = dataAdderToAdminBot();
  _forEach(values, value => {
    const model = _get(value, 'model');
    const keys = _get(value, 'keys');
    const subProcessName = _get(value, 'subProcessName');
    adminBotJobs.push(processSampleModelTriggers(jobMetaData, dbStreamClient, model, keys, _set(jobMetaData, 'subProcessName', subProcessName)));
    console.log(`Monitoring process ${subProcessName} for model ${model} for values in the fields ${keys}`);
  });

  await Promise.all(adminBotJobs);
  console.log('Job Completed ');
};

exports.runJob = runJob;
