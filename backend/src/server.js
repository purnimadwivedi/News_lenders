const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB } = require('./config/db');
const { createApp } = require('./app');
const { startScheduler } = require('./jobs/scheduler');
const RunLog = require('./models/RunLog');

// A run only leaves 'running' when it finishes, so any still marked running at startup
// belonged to a process that died mid-run (restart, crash) and will never complete.
async function failInterruptedRuns() {
  const res = await RunLog.updateMany(
    { status: 'running' },
    { $set: { status: 'failed', error: 'Interrupted — the server stopped before this run finished' } }
  );
  if (res.modifiedCount) logger.warn(`Marked ${res.modifiedCount} interrupted run(s) as failed`);
}

async function main() {
  await connectDB();
  await failInterruptedRuns();
  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port}`);
    logger.info(`Monitoring news for: ${env.company.name}`);
    startScheduler();
  });
}

main().catch((err) => {
  logger.error(`Fatal startup error: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => logger.error('UnhandledRejection: %s', reason));
process.on('uncaughtException', (err) => logger.error('UncaughtException: %s', err.message));
