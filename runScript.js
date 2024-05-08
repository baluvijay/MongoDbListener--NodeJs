require('dotenv').config();

const dbStreamListener = require('./app/dbStreamListener');

const scripts = {
  dbStreamListener,
};


const run = () => {
  if (scripts[process.argv[2]]) {
    return scripts[process.argv[2]].run()
      .then(() => {
        console.info('script completed successfully');
        process.exit(0);
      })
      .catch((err) => {
        console.error('script error:', err);
        process.exit(1);
      });
  }

  console.error('script %s not found', process.argv[2]);
  return process.exit(1);
};
run();
