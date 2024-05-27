/*
* Listen to Game aggregates collection ,
* Update the ledger
*
* */
const {
  get: _get, chain: _chain,
} = require('lodash');


const applyProcessorFilters = (batch) => {
  const memberUpdate = _chain(batch)
    .filter(d => _get(d, ['data', 'streamSource'], '') === 'gameaggregates')
    .filter(d =>
      _get(d, ['operationType']) === 'insert' || _get(d, ['operationType']) === 'update' || _get(d, ['operationType']) === 'replace'
    )
    .value();
  return memberUpdate;
};

const updateRewardsLedger = async (_id, user, companyId, gameId, totalPoints) => {
  console.log(companyId, totalPoints);
};

const gameAggregatesProcessor = async (options, batch, requestCompleted) => {
  const { logPrefix = '', batchId } = options;

  try {
    console.log('testing Check');
    const memberUpdate = applyProcessorFilters(batch);
    const {
      _id, companyId, gameId, user, totalPoints,
    } = memberUpdate[0].data;
    console.log('testing Check');
    await updateRewardsLedger(_id, user, companyId, gameId, totalPoints);
  } catch (batchCannotPropagateError) {
    console.error(`[AKTALTCritical]${logPrefix}: batchId: ${batchId}, data: ${JSON.stringify(batch)}`, batchCannotPropagateError);
  }

  requestCompleted();
};

module.exports = {
  gameAggregatesProcessor,
};
