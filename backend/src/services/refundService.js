const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { refundQueue, QUEUE_NAMES } = require('../queues');
const webhookService = require('../services/webhookService');
const merchantService = require('../services/merchantService');

class RefundService {
  
  generateRefundId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'rfnd_';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createRefund(data, merchant, payment) {
    // 1. Validate Amount
    // Get total refunded so far
    const refundsQuery = `SELECT SUM(amount) as total FROM refunds WHERE payment_id = $1 AND status != 'failed'`;
    const refundsResult = await db.query(refundsQuery, [payment.id]);
    const totalRefunded = parseInt(refundsResult.rows[0].total || '0', 10);
    
    if (data.amount > (payment.amount - totalRefunded)) {
      throw new Error('Refund amount exceeds available amount');
    }

    // 2. Create Refund Record
    const refundId = this.generateRefundId();
    const query = `
      INSERT INTO refunds (
        id, payment_id, merchant_id, amount, reason, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING *
    `;
    
    const values = [refundId, payment.id, merchant.id, data.amount, data.reason || null];
    const result = await db.query(query, values);
    const refund = result.rows[0];

    // 3. Enqueue Job
    await refundQueue.add(QUEUE_NAMES.REFUND, {
      refundId: refund.id,
      paymentId: payment.id
    });

    return refund;
  }

  async processRefund(refundId) {
     // Simulate Delay
     const delay = Math.floor(Math.random() * (5000 - 3000 + 1) + 3000); // 3-5s
     await new Promise(resolve => setTimeout(resolve, delay));

     // Update Status
     const query = `
       UPDATE refunds 
       SET status = 'processed', processed_at = NOW() 
       WHERE id = $1 
       RETURNING *
     `;
     const result = await db.query(query, [refundId]);
     const refund = result.rows[0];

     if (!refund) throw new Error('Refund not found during processing');

     // Trigger Webhook
     const merchant = await merchantService.findById(refund.merchant_id);
     await webhookService.enqueueWebhook(merchant, 'refund.processed', { refund });

     return refund;
  }

  async findById(id) {
    const result = await db.query('SELECT * FROM refunds WHERE id = $1', [id]);
    return result.rows[0];
  }
}

module.exports = new RefundService();
