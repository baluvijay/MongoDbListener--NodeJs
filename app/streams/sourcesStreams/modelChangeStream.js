const {
  defaults: _defaults,
  get: _get,
} = require('lodash');


const { dbEventsStream } = require('../../commons/dbEventsStream');



const modelChangeStream = (jobMetaData, dbStreamClient, options = {}, collectionModel, keys) => {
  const fields = {
    'data.streamSource': '$ns.coll',
  };
  keys.forEach(key => {
    fields[`data.${key}`] = `$fullDocument.${key}`;
  });
  const defaultOptions = {
    processName: _get(jobMetaData, ['processName'], '[Anonymous]'),
    collectionName: collectionModel.collection.name,
    jobId: jobMetaData.jobId,
    debugStream: false,
    operationType: [
      'update',
      'insert',
      'replace',
    ],
    pipeline: [{
      $addFields: fields,
    }],
    highWaterMark: 4,
    autoStart: true,
    rememberMe: true,
    rememberMeInterval: 10 * 1000,
    enableFullDocument: false,
  };
  defaultOptions.eventTrackerVarName = `${defaultOptions.processName}`
    + `#${defaultOptions.collectionName}`
    + '#resumeAfter.eventId';

  const finalOptions = _defaults(options, defaultOptions);
  return dbEventsStream(jobMetaData, dbStreamClient, finalOptions);
};

module.exports = {
  modelChangeStream,
};
