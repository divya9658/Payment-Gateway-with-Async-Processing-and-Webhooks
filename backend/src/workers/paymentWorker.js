const { Worker } = require('bullmq');
const redisConfig = require('../config/redis');
const paymentService = require('../services/paymentService');
const merchantService = require('../services/merchantService');
const webhookService = require('../services/webhookService');
const { QUEUE_NAMES } = require('../queues');

const paymentWorker = new Worker(QUEUE_NAMES.PAYMENT, async (job) => {
  const { paymentId, isTestMode } = job.data;
  console.log(`Processing Payment Job: ${paymentId}`);

  try {
    const payment = await paymentService.findById(paymentId);
    if (!payment) throw new Error('Payment not found');

    // Simulate Delay
    let delay = Math.floor(Math.random() * (10000 - 5000 + 1) + 5000); // 5-10s
    if (isTestMode) delay = 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Determine Outcome
    let success = true;
    if (isTestMode) {
      success = process.env.TEST_PAYMENT_SUCCESS !== 'false';
    } else {
      const rate = payment.method === 'upi' ? 0.90 : 0.95;
      success = Math.random() < rate;
    }

    // Update Status
    const status = success ? 'success' : 'failed';
    const error = success ? null : { code: 'GATEWAY_ERROR', description: 'Payment rejected by bank' };
    
    const updatedPayment = await paymentService.updateStatus(paymentId, status, error);
    const merchant = await merchantService.findById(payment.merchant_id);

    // Trigger Webhook
    const event = success ? 'payment.success' : 'payment.failed';
    await webhookService.enqueueWebhook(merchant, event, { payment: updatedPayment });

    console.log(`Payment ${paymentId} processed: ${status}`);
  } catch (err) {
    console.error(`Payment Worker Error: ${err.message}`);
    throw err;
  }
}, { connection: redisConfig.connection });

module.exports = paymentWorker;
