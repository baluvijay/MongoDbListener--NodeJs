const { connect: mongodbConnect } = require('../../config/mongodb');

let dbClient;
const getStreamDbClient = async () => {
  if (!dbClient) {
    dbClient = await mongodbConnect();
  }
  return dbClient;
};
module.exports = {
  getStreamDbClient,
};
