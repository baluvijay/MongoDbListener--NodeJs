const { PassThrough } = require('stream');
const {
  isNil: _isNil,
  difference: _difference,
  get: _get,
  isEmpty: _isEmpty,
  cloneDeep: _cloneDeep,
} = require('lodash');

const {
  setIntervalAsync,
} = require('set-interval-async/fixed');

const { model } = require('../models/models');
const { newOid } = require('../commons/string');

const Variable = model('Variable');


const validateOptions = (dbEventsStreamInitialOptions) => {
  const dbEventsStreamOptions = _cloneDeep(dbEventsStreamInitialOptions);
  if (_isEmpty(_get(dbEventsStreamOptions, ['processName']))) {
    throw new Error('mandatory: processName');
  }
  if (_isEmpty(_get(dbEventsStreamOptions, ['collectionName']))) {
    throw new Error('mandatory: collectionName');
  }
  if (_isNil(_get(dbEventsStreamOptions, ['jobId']))) {
    throw new Error('mandatory: jobId');
  }
  if (_get(dbEventsStreamOptions, ['rememberMe']) !== false) {
    dbEventsStreamOptions.rememberMe = true;
  }
  if (_isNil(_get(dbEventsStreamOptions, ['rememberMeInterval']))) {
    dbEventsStreamOptions.rememberMeInterval = 10 * 1000;
  }

  if (_get(dbEventsStreamOptions, ['debugStream']) !== true) {
    dbEventsStreamOptions.debugStream = false;
  }
  if (_get(dbEventsStreamOptions, ['enableFullDocument']) !== true) {
    dbEventsStreamOptions.enableFullDocument = false;
  }
  if (_isNil(_get(dbEventsStreamOptions, ['highWaterMark']))) {
    dbEventsStreamOptions.highWaterMark = 500;
  }

  // Divide by 2 as max buffer is readable + writable buffers
  dbEventsStreamOptions.highWaterMark = Math.floor(dbEventsStreamOptions.highWaterMark / 2) || 1;


  if (_isNil(_get(dbEventsStreamOptions, ['readableHighWaterMark']))) {
    dbEventsStreamOptions.readableHighWaterMark = dbEventsStreamOptions.highWaterMark;
  }
  if (_isNil(_get(dbEventsStreamOptions, ['writableHighWaterMark']))) {
    dbEventsStreamOptions.writableHighWaterMark = dbEventsStreamOptions.highWaterMark;
  }
  if (_get(dbEventsStreamOptions, ['autoStart']) !== false) {
    dbEventsStreamOptions.autoStart = true;
  }


  // Default tracker name using processName if not supplied
  if (_isEmpty(_get(dbEventsStreamOptions, ['eventTrackerVarName']))) {
    dbEventsStreamOptions.eventTrackerVarName = `${dbEventsStreamOptions.processName}`
      + `#${dbEventsStreamOptions.collectionName}`
      + '#resumeAfter.eventId';
  }

  if (_isEmpty(_get(dbEventsStreamOptions, ['operationType']))) {
    dbEventsStreamOptions.operationType = [
      'update',
      'insert',
    ];
  }

  if (_difference(dbEventsStreamOptions.operationType,
    [
      'update',
      'insert',
      'delete',
      'replace',
    ]
  ).length > 0) {
    throw new Error(`invalid: operationType: ${JSON.stringify(dbEventsStreamOptions.operationType)}`);
  }

  if (_isEmpty(_get(dbEventsStreamOptions, ['logPrefix']))) {
    dbEventsStreamOptions.logPrefix = `${dbEventsStreamOptions.eventTrackerVarName}/${dbEventsStreamOptions.jobId}`;
  }
  return dbEventsStreamOptions;
};

const dbEventsStream = async (jobMetaData, dbStreamClient, dbEventsStreamInitialOptions) => {
  // Validations
  if (!dbStreamClient) {
    throw new Error('[AKTALTCritical] attempt to use streams without a db client.');
  }
  const dbEventsStreamOptions = validateOptions(dbEventsStreamInitialOptions);

  let watchDog;
  let resumeAfterEventId;


  try {
    let changeStream;
    let pass;
    const {
      collectionName, eventTrackerVarName,
      logPrefix, debugStream,
      rememberMe,
      rememberMeInterval,
    } = dbEventsStreamOptions;

    if (rememberMe) {
      const lastMongoMemberEvent = await Variable.findOne({ varName: eventTrackerVarName });
      resumeAfterEventId = _get(lastMongoMemberEvent, ['varValue', 'resumeAfterEventId']);
    }


    // If backpressure then wait for drain event on the writer before reading further
    const feedProcessor = async (_changeStream, _pass) => {
      let doc = null;
      // eslint-disable-next-line no-await-in-loop,no-cond-assign
      while (doc = await Promise.race([_changeStream.next()])) {
        if (debugStream) {
          console.log(`Feed Got ${JSON.stringify(doc)}`);
        }
        if (doc != null) {
          const noBackPressure = _pass.write(doc);
          if (noBackPressure === false) {
            const pauseId = newOid();
            console.log(`${logPrefix}: Backpressure detected pauseId ${pauseId}`);
            // eslint-disable-next-line no-await-in-loop,no-loop-func
            await new Promise((resolve) => {
              _pass.once('drain', () => {
                console.log(`${logPrefix}: Backpressure relieved pauseId ${pauseId}`);
                resolve();
              });
            });
          }
        }
      }
    };

    const rememberMeHandler = async () => {
      try {
        const currentResumeAfterEventId = _get(changeStream, ['resumeToken', '_data']);
        if (
          !_isEmpty(currentResumeAfterEventId)
          && currentResumeAfterEventId !== resumeAfterEventId) {
          await Variable.updateOne({
            varName: eventTrackerVarName,
          }, {
            $set: { varValue: { createdAt: new Date(), resumeAfterEventId: currentResumeAfterEventId } },
          }, {
            upsert: true,
          });
          resumeAfterEventId = currentResumeAfterEventId;
          if (debugStream) {
            console.log(`${logPrefix}: watchDog: save point ${currentResumeAfterEventId}`);
          }
        }
      } catch (e) {
        console.log(`[AKTALTCritical][${logPrefix}] error in rememberMeHandler: ${JSON.stringify(e)}`);
      }
    };

    const collection = dbStreamClient.db().collection(collectionName);

    const watchPipeline = [];
    watchPipeline.push(
      {
        $match: {
          operationType: {
            $in: dbEventsStreamOptions.operationType,
          },
        },
      }
    );
    if (!_isEmpty(dbEventsStreamOptions.pipeline)) {
      dbEventsStreamOptions.pipeline.forEach(pItem => {
        watchPipeline.push(
          pItem
        );
      });
    }

    if (dbEventsStreamOptions.enableFullDocument !== true) {
      watchPipeline.push({
        $unset: [
          'fullDocument',
        ],
      });
    }

    let watchOpt = {
      fullDocument: 'updateLookup',
    };

    const deleteAndRestartHandler = async () => {
      await Variable.deleteOne({ varName: eventTrackerVarName });
      console.log(`Delete variable document varName=${eventTrackerVarName} resume point is not longer in the oplog.`);
      changeStream = collection.watch(watchPipeline, { fullDocument: 'updateLookup' });
      return feedProcessor(changeStream, pass);
    };

    console.log(`${logPrefix}: varName=${eventTrackerVarName} resumeAfterEventId is: ${resumeAfterEventId}`);
    if (rememberMe && resumeAfterEventId) {
      watchOpt = { ...watchOpt, ...{ resumeAfter: { _data: resumeAfterEventId } } };
    }

    changeStream = collection.watch(watchPipeline, watchOpt);
    pass = new PassThrough({
      readableHighWaterMark: dbEventsStreamOptions.readableHighWaterMark,
      writableHighWaterMark: dbEventsStreamOptions.writableHighWaterMark,
      objectMode: true,
    });

    // Either start here or else expect client to call start
    if (dbEventsStreamOptions.autoStart) {
      feedProcessor(changeStream, pass).catch(deleteAndRestartHandler);
    }

    const start = () => feedProcessor(changeStream, pass).catch(deleteAndRestartHandler);
    const close = () => {
      if (watchDog) {
        clearInterval(watchDog);
        watchDog = undefined;
        console.log(`${logPrefix}: watchDog is cleared `);
      }
    };
    pass.once('finish', close);

    if (rememberMe) {
      watchDog = setIntervalAsync(rememberMeHandler, rememberMeInterval);
    }
    return {
      input: pass,
      start,
    };
    // }
  } catch (e) {
    console.log(`[AKTALTCritical] error in creating stream with params ${JSON.stringify(jobMetaData)} stream error: ${JSON.stringify(e)}`);
    throw e;
  }
};

module.exports = {
  dbEventsStream,
};
