
const modelCache = {};

const toCamelCase = str => {
  if (!str) {
    return str;
  }

  return str
    .replace(/(-|_)/g, ' ')
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) return '';
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
};
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

