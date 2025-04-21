const port = 1337;

module.exports = {
  port,
  db: process.env.DB_CONNECTION_URL || 'mongodb://localhost/test',
};
