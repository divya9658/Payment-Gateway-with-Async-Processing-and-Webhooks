const crypto = require('crypto');
const db = require('../config/db');
const { webhookQueue, QUEUE_NAMES } = require('../queues');

class WebhookService {
  
  /**
   * generateSignature
   * @param {string} payload - JSON string
   * @param {string} secret 
   * @returns {string} hex signature
   */
  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * enqueueWebhook
   * @param {object} merchant 
   * @param {string} event 
   * @param {object} data - The payload data (e.g. { payment: ... })
   */
  async enqueueWebhook(merchant, event, data) {
    if (!merchant.webhook_url) {
      console.log(`Merchant ${merchant.id} has no webhook URL configured.`);
      return; // Skip if no URL
    }

    const payloadProto = {
      event,
      timestamp: Math.floor(Date.now() / 1000),
      data
    };
    
    // Convert to JSON string once to ensure consistency
    const payloadString = JSON.stringify(payloadProto);

    // Create Webhook Log
    const query = `
      INSERT INTO webhook_logs (
        merchant_id, event, payload, status, created_at, next_retry_at
      ) VALUES ($1, $2, $3, 'pending', NOW(), NOW())
      RETURNING id
    `;
    const result = await db.query(query, [merchant.id, event, payloadString]);
    const logId = result.rows[0].id;

    // Enqueue Job
    await webhookQueue.add(QUEUE_NAMES.WEBHOOK, {
      webhookId: logId,
      merchantId: merchant.id,
      url: merchant.webhook_url,
      secret: merchant.webhook_secret,
      payload: payloadString,
      attemptNumber: 1
    });
    
    console.log(`Enqueued webhook ${logId} for event ${event}`);
  }

  async getLogById(id) {
     const result = await db.query('SELECT * FROM webhook_logs WHERE id = $1', [id]);
     return result.rows[0];
  }

  async updateLogStatus(id, status, responseCode, responseBody = null) {
      const query = `
        UPDATE webhook_logs 
        SET status = $2, response_code = $3, response_body = $4, last_attempt_at = NOW(), attempts = attempts + 1
        WHERE id = $1
      `;
      await db.query(query, [id, status, responseCode, responseBody]);
  }
  
  async scheduleRetry(logId, attemptNumber) {
      // Retry Schedule: 1m, 5m, 30m, 2h
      // Test Mode: 5s, 10s, 15s, 20s
      let delaySeconds = 0;
      const isTest = process.env.WEBHOOK_RETRY_INTERVALS_TEST === 'true';

      if (isTest) {
          const delays = [0, 5, 10, 15, 20];
          delaySeconds = delays[attemptNumber] || 0;
      } else {
          const delays = [0, 60, 300, 1800, 7200];
          delaySeconds = delays[attemptNumber] || 0;
      }

      const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

      // Update next_retry_at in DB
      await db.query('UPDATE webhook_logs SET next_retry_at = $2, status = $3 WHERE id = $1', [logId, nextRetryAt, 'pending']);
      
      return delaySeconds * 1000;
  }
}

module.exports = new WebhookService();
