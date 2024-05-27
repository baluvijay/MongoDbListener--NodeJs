/*
* Listen to Game aggregates collection ,
* Update the ledger
*
* */
const {
  get: _get, chain: _chain,
} = require('lodash');
const {dataReceiver} = require('../../postProcessor/dataReceiver');

const applyProcessorFilters = (batch,modelName) => {
  console.log(batch);
  const memberUpdate = _chain(batch)
    .filter(d => _get(d, ['data', 'streamSource'], '') === modelName.collection.name)
    .filter(d =>
      _get(d, ['operationType']) === 'insert' || _get(d, ['operationType']) === 'update' || _get(d, ['operationType']) === 'replace'
    )
    .value();
  return memberUpdate;
};

const updateRewardsLedger = async (_id, user, companyId, gameId, totalPoints) => {
  console.log(companyId, totalPoints);
};

const dataProcessor = async (options, batch, requestCompleted,modelName) => {
  const { logPrefix = '', batchId } = options;

  try {
    console.log('testing Check');
    const memberUpdate = applyProcessorFilters(batch,modelName);
    console.log(memberUpdate);
    console.log('testing Check');
    await dataReceiver(memberUpdate[0].data);
  } catch (batchCannotPropagateError) {
    console.error(`[AKTALTCritical]${logPrefix}: batchId: ${batchId}, data: ${JSON.stringify(batch)}`, batchCannotPropagateError);
  }

  requestCompleted();
};

module.exports = {
  dataProcessor,
};
