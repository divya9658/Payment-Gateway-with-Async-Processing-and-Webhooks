require('dotenv').config();
const { Worker } = require('bullmq');
const redisConfig = require('../config/redis');

// Import workers
const paymentWorker = require('./paymentWorker');
const webhookWorker = require('./webhookWorker');
const refundWorker = require('./refundWorker'); 

console.log('Starting Job Workers...');

// Keep process alive and handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await paymentWorker.close();
  await webhookWorker.close();
  await refundWorker.close();
  process.exit(0);
});
