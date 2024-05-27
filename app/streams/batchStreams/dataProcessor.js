/*
* */
const {
  get: _get, chain: _chain,
} = require('lodash');
const { dataReceiver } = require('../../postProcessor/dataReceiver');

const applyProcessorFilters = (batch, modelName) => {
  const memberUpdate = _chain(batch)
    .filter(d => _get(d, ['data', 'streamSource'], '') === modelName.collection.name)
    .filter(d =>
      _get(d, ['operationType']) === 'insert' || _get(d, ['operationType']) === 'update' || _get(d, ['operationType']) === 'replace'
    )
    .value();
  return memberUpdate;
};


const dataProcessor = async (options, batch, requestCompleted, modelName) => {
  const { logPrefix = '', batchId } = options;

  try {
    const memberUpdate = applyProcessorFilters(batch, modelName);
    await dataReceiver(memberUpdate[0].data);
  } catch (batchCannotPropagateError) {
    console.error(`[AKTALTCritical]${logPrefix}: batchId: ${batchId}, data: ${JSON.stringify(batch)}`, batchCannotPropagateError);
  }

  requestCompleted();
};

module.exports = {
  dataProcessor,
};
