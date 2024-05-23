/**
 * Initial taken from https://github.com/sevko/batch-request-stream
 * Then added flush by maxWaitTime logic
 */

const moment = require('moment-timezone');
const stream = require('readable-stream');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/fixed');
const { PassThrough } = require('stream');
const {
  cloneDeep: _cloneDeep, isNil: _isNil, get: _get, isEmpty: _isEmpty,
} = require('lodash');

const promisify = func =>
  new Promise((resolve, reject) => {
    func((err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    });
  });

const delay = async (milliseconds) =>
  promisify(cb => setTimeout(cb, milliseconds));



const placeHolderDoNothingButDelayRequestProcessor = async (options, batch, requestCompleted) => {
  const simulateDelayTime = 3000;
  const shortMessage = false;
  const itemsLog = (batch || []).map(item => _get(item, ['_id'], '_id unavailable')).join(' | ');
  const { logPrefix = '', batchId } = options;

  if (shortMessage) {
    console.log(`${logPrefix}: Processing batch ${batchId} with delay ${simulateDelayTime} batch of size ${batch.length} items ${itemsLog}`);
  } else {
    console.log(`${logPrefix}: Processing batch ${batchId} with delay ${simulateDelayTime} batch of size ${batch.length} items ${JSON.stringify(batch)}`);
  }
  await delay(simulateDelayTime);
  if (shortMessage) {
    console.log(`${logPrefix}: Processed batch ${batchId} with delay ${simulateDelayTime} batch of size ${batch.length} items ${itemsLog}`);
  } else {
    console.log(`${logPrefix}: Processed batch ${batchId} with delay ${simulateDelayTime} batch of size ${batch.length} items ${JSON.stringify(batch)}`);
  }

  requestCompleted();
};

/**
 * Create a buffered, rate-limited Writable Stream.
 *
 * @param options Configuration object, which must contain the following
 *      mandatory keys and may contain the optional ones (note JSDoc `[]`
 *      syntax for optional values).
 *
 *      {function(batch, requestCompleted)} request The function to execute
 *          on each buffered batch of data. Must accept two arguments:
 *
 *          {array} batch An array of objects written to the Stream. Will be of
 *          length `batchSize` unless it's the last and the number of objects
 *          sent in is not evenly divisible by `batchSize`.
 *
 *          {function} requestCompleted Must be called by the callback sent to
 *          the asynchronous request made by `request()`. This is used to track
 *          the number of live concurrent requests, and thus manage
 *          rate-limiting.
 *
 *      {int} [batchSize=100] The number of items in each batch.
 *      {int} [maxLiveRequests=100] The maximum number of incomplete requests
 *          to keep open at any given time.
 *      {Object} [streamOptions] Options sent to `stream.Writable()`;
 *          for example: `{objectMode: true}`.
 */
const createStream = (options) => {
  let writeStream;

  const myPromise = new Promise((resolve, reject) => {
    writeStream = new stream.Writable(options.streamOptions);

    const {
      batchSize, maxLiveRequests, maxWaitTime, logPrefix,
    } = options;


    let batchId = -1;
    const batch = [];
    // Used to rate-limit the number of open requests.
    let liveRequests = 0;
    let streamPaused = false;

    let watchDog;
    let lastPushTime = 0;

    /**
     * Signals the completion of a request. Used to decrement `liveRequests`
     * and manage rate-limiting.
     */
    function requestCompleted(err) {
      if (err) writeStream.emit('error', err);
      writeStream.emit('requestCompleted');
    }

    writeStream.on('requestCompleted', () => {
      liveRequests += -1;
      if (streamPaused && liveRequests < maxLiveRequests) {
        streamPaused = false;
        writeStream.emit('resumeStream');
      }
    });

    async function maxWaitTimeHandler() {
      const dataTimeStamp = Date.now();
      // console.log(`watchDog ${dataTimeStamp}`);
      if (dataTimeStamp - lastPushTime > maxWaitTime
        && batch.length > 0) {
        if (liveRequests === 0) {
          liveRequests += 1;
          lastPushTime = dataTimeStamp;
          batchId = (batchId + 1) % Number.MAX_SAFE_INTEGER;
          await options.request({ logPrefix, batchId }, batch.splice(0, batch.length), requestCompleted);
          console.log(`${logPrefix} *** Data was sent by timeoutHandler`);
        }
      }
    }


    writeStream._write = function _write(data, enc, next) {
      const dataTimeStamp = Date.now();
      batch.push(data);
      if (batch.length === batchSize) {
        liveRequests += 1;
        lastPushTime = dataTimeStamp;
        batchId = (batchId + 1) % Number.MAX_SAFE_INTEGER;
        options.request({ logPrefix, batchId }, batch.splice(0, batchSize), requestCompleted);
        // batch = [];

        if (liveRequests >= maxLiveRequests) {
          streamPaused = true;
          this.once('resumeStream', next);
          return;
        }
      }
      next();
    };

    if (maxWaitTime > 0) {
      watchDog = setIntervalAsync(maxWaitTimeHandler, maxWaitTime);
    }


    writeStream.on('finish', async () => {
      if (watchDog) {
        clearIntervalAsync(watchDog);
        watchDog = null;
      }
      if (batch.length > 0) {
        batchId = (batchId + 1) % Number.MAX_SAFE_INTEGER;
        await options.request({ logPrefix, batchId }, batch, requestCompleted);
      }
      console.log(`${logPrefix}: Finish completed`);
      resolve();
    });

    writeStream.on('error', (error) => {
      console.log(`[AKTALTCritical] ${logPrefix} error received`, error);
      reject(error);
    });

    // condition
  });
  return { promise: myPromise, writeStream };
};

const validateOptions = (streamInitialOptions) => {
  const curatedStreamOptions = _cloneDeep(streamInitialOptions);

  if (_isEmpty(_get(curatedStreamOptions, ['processName']))) {
    throw new Error('mandatory: processName');
  }

  if (_isNil(_get(curatedStreamOptions, ['jobId']))) {
    throw new Error('mandatory: jobId');
  }
  if (_isNil(_get(curatedStreamOptions, ['batchSize']))) {
    curatedStreamOptions.batchSize = 100;
  }
  if (_isNil(_get(curatedStreamOptions, ['maxLiveRequests']))) {
    curatedStreamOptions.maxLiveRequests = 2;
  }
  // Set to non zero value to enable
  if (_isNil(_get(curatedStreamOptions, ['maxWaitTime']))) {
    curatedStreamOptions.maxWaitTime = 0;
  }

  if (_isEmpty(_get(curatedStreamOptions, ['subProcessName']))) {
    curatedStreamOptions.subProcessName = `batchStream${moment.utc().format('YYYY-MM-DD')}`;
  }

  if (_isEmpty(_get(curatedStreamOptions, ['logPrefix']))) {
    curatedStreamOptions.logPrefix = `${curatedStreamOptions.processName}/${curatedStreamOptions.subProcessName}`
      + `/${curatedStreamOptions.jobId}-##`
      + `[S${curatedStreamOptions.batchSize}`
      + `xL${curatedStreamOptions.maxLiveRequests}xW${curatedStreamOptions.maxWaitTime}]#`;
  }

  curatedStreamOptions.streamOptions = { objectMode: true };
  if (_isNil(curatedStreamOptions.request)) {
    console.log(`${curatedStreamOptions.logPrefix}: is implementing only a simulated process`);
    curatedStreamOptions.request = placeHolderDoNothingButDelayRequestProcessor;
  }
  return curatedStreamOptions;
};

const createBatchRequestStream = (dbEventsStreamInitialOptions) => {
  const finalOptions = validateOptions(dbEventsStreamInitialOptions);
  const { promise, writeStream } = createStream(finalOptions);
  const batchRequestStream = new PassThrough(finalOptions.streamOptions);
  batchRequestStream.pipe(writeStream);
  return {
    input: batchRequestStream,
    promise: () => promise,
  };
};
module.exports = { createBatchRequestStream };
