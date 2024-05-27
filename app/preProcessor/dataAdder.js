
const { model } = require('../models/models');

const SampleModel = model('SampleModel');

const dataAdderToAdminBot = () => {
  const jobsData = [];
  const keys = ['user', 'totalPoints'];
  jobsData.push({ model: SampleModel, keys, subProcessName: 'SampleLogAggregator' });
  return jobsData;
};

module.exports = {
  dataAdderToAdminBot,
};
