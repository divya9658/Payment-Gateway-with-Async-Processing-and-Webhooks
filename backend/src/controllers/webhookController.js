const db = require('../config/db');
const webhookService = require('../services/webhookService');
const { webhookQueue, QUEUE_NAMES } = require('../queues');

const listWebhooks = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const merchantId = req.merchant.id;

    const countQuery = 'SELECT COUNT(*) FROM webhook_logs WHERE merchant_id = $1';
    const countResult = await db.query(countQuery, [merchantId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT * FROM webhook_logs 
      WHERE merchant_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const dataResult = await db.query(dataQuery, [merchantId, limit, offset]);

    res.json({
      data: dataResult.rows,
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
  } catch (error) {
    console.error('List Webhooks Error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Failed to list webhooks' } });
  }
};

const retryWebhook = async (req, res) => {
  try {
    const { webhook_id } = req.params;
    const merchantId = req.merchant.id;

    // Verify ownership
    const log = await webhookService.getLogById(webhook_id);
    if (!log || log.merchant_id !== merchantId) {
       return res.status(404).json({ error: { code: 'NOT_FOUND', description: 'Webhook log not found' } });
    }

    // Reset and Enqueue
    const query = `
      UPDATE webhook_logs 
      SET status = 'pending', attempts = 0, next_retry_at = NULL 
      WHERE id = $1
    `;
    await db.query(query, [webhook_id]);

    const merchant = req.merchant; // Already attached
    
    // We need to fetch URL and Secret again (or from merchant object)
    // The previous implementation of enqueueWebhook logic was slightly different (created new log).
    // Here we want to reuse the log ID.
    
    await webhookQueue.add(QUEUE_NAMES.WEBHOOK, {
      webhookId: log.id,
      merchantId: merchant.id,
      url: merchant.webhook_url,
      secret: merchant.webhook_secret,
      payload: JSON.stringify(log.payload), // Payload is JSONB in DB, convert to string? Or it comes out as object from pg?
      // PG 'jsonb' comes as object. JSON.stringify needed for signature gen.
      attemptNumber: 1
    });

    res.json({
      id: log.id,
      status: 'pending',
      message: 'Webhook retry scheduled'
    });

  } catch (error) {
    console.error('Retry Webhook Error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Failed to retry webhook' } });
  }
};

module.exports = {
  listWebhooks,
  retryWebhook
};
