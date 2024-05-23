const {
  defaults: _defaults,
  get: _get,
} = require('lodash');

const { model } = require('../../models/models');
const { dbEventsStream } = require('../../commons/dbEventsStream');

const GameAggregate = model('GameAggregate');

const gameAggregatesChangeStream = (jobMetaData, dbStreamClient, options = {}) => {
  const defaultOptions = {
    processName: _get(jobMetaData, ['processName'], '[Anonymous]'),
    collectionName: GameAggregate.collection.name,
    jobId: jobMetaData.jobId 
    debugStream: false,
    operationType: [
      'update',
      'insert',
      'replace',
    ],
    pipeline: [{
      $addFields: {
        'data.streamSource': '$ns.coll',
        'data._id': '$fullDocument._id',
        'data.gameId': '$fullDocument.gameId',
        'data.companyId': '$fullDocument.companyId',
        'data.user': '$fullDocument.user',
        'data.totalPoints': '$fullDocument.totalPoints',
      },
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
  gameAggregatesChangeStream,
};
