const { Worker } = require('bullmq');
const axios = require('axios');
const redisConfig = require('../config/redis');
const webhookService = require('../services/webhookService');
const { QUEUE_NAMES, webhookQueue } = require('../queues');

const webhookWorker = new Worker(QUEUE_NAMES.WEBHOOK, async (job) => {
  const { webhookId, merchantId, url, secret, payload, attemptNumber } = job.data;
  console.log(`Processing Webhook ${webhookId} (Attempt ${attemptNumber})`);

  try {
    // Generate Signature
    const signature = webhookService.generateSignature(payload, secret);

    // Send Request
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
      },
      timeout: 5000
    });

    // Success
    await webhookService.updateLogStatus(webhookId, 'success', response.status, JSON.stringify(response.data));
    console.log(`Webhook ${webhookId} delivered successfully`);

  } catch (error) {
    const responseCode = error.response ? error.response.status : 0;
    const responseBody = error.response ? JSON.stringify(error.response.data) : error.message;

    // Log Failure
    await webhookService.updateLogStatus(webhookId, 'pending', responseCode, responseBody); // Pending until retry logic decides? 
    // Actually updateLogStatus just logs the attempt. We need to decide if we fail permanently or retry.

    if (attemptNumber < 5) {
      // Schedule Retry
      const delayMs = await webhookService.scheduleRetry(webhookId, attemptNumber); // attemptNumber is current (1-based)
      
      await webhookQueue.add(QUEUE_NAMES.WEBHOOK, {
        ...job.data,
        attemptNumber: attemptNumber + 1
      }, { delay: delayMs });
      
      console.log(`Webhook ${webhookId} scheduled for retry (Attempt ${attemptNumber + 1}) in ${delayMs}ms`);
    } else {
      // Permanent Failure
      await db.query("UPDATE webhook_logs SET status = 'failed' WHERE id = $1", [webhookId]);
      console.log(`Webhook ${webhookId} failed permanently`);
    }
  }
}, { connection: redisConfig.connection });

const db = require('../config/db'); // Need db for query above

module.exports = webhookWorker;
