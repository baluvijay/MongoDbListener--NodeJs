const { toCamelCase } = require('./string');

const modelCache = {};

const getModel = (modelName) => {
  // handle the case where model name is an uppercase
  // abbreviation. namely, CMS.
  const modelFileName = modelName.toUpperCase() === modelName
    ? modelName.toLowerCase()
    : toCamelCase(modelName);

  if (modelCache[modelName]) {
    return modelCache[modelName];
  }

  /* eslint-disable-next-line */
  modelCache[modelName] = require(`../../app/models/${modelFileName}.model`);

  return modelCache[modelName];
};

const setCode = async (model, prefix, codeFieldName) => {
  const Sequence = getModel('Sequence');

  if (!model.isNew) {
    return null;
  }

  const n = await Sequence.increment(model.constructor.modelName, prefix);
  model[codeFieldName] = `${prefix}${n}`;

  return model[codeFieldName];
};

module.exports = {
  setCode,
  model: getModel,
};

