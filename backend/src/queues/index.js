const { Queue } = require('bullmq');
const redisConfig = require('../config/redis');

// Define Queue Names
const QUEUE_NAMES = {
  PAYMENT: 'process-payment',
  WEBHOOK: 'deliver-webhook',
  REFUND: 'process-refund',
};

// Create Queues
const paymentQueue = new Queue(QUEUE_NAMES.PAYMENT, redisConfig);
const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, redisConfig);
const refundQueue = new Queue(QUEUE_NAMES.REFUND, redisConfig);

module.exports = {
  QUEUE_NAMES,
  paymentQueue,
  webhookQueue,
  refundQueue,
};
