const { Worker } = require('bullmq');
const redisConfig = require('../config/redis');
const refundService = require('../services/refundService');
const { QUEUE_NAMES } = require('../queues');

const refundWorker = new Worker(QUEUE_NAMES.REFUND, async (job) => {
  const { refundId } = job.data;
  console.log(`Processing Refund Job: ${refundId}`);

  try {
    await refundService.processRefund(refundId);
    console.log(`Refund ${refundId} processed successfully`);
  } catch (err) {
    console.error(`Refund Worker Error: ${err.message}`);
    throw err;
  }
}, { connection: redisConfig.connection });

module.exports = refundWorker;
