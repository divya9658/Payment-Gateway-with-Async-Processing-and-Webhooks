const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { paymentQueue } = require('../queues');
const { QUEUE_NAMES } = require('../queues');

class PaymentService {
  
  /**
   * generatePaymentId
   * @returns {string} e.g. pay_16charString
   */
  generatePaymentId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'pay_';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a new payment and enqueue it for processing
   * @param {object} paymentData 
   * @param {object} merchant 
   */
  async createPayment(paymentData, merchant) {
    const { amount, currency, method, order_id, vpa } = paymentData;
    const paymentId = this.generatePaymentId();
    
    // 1. Insert into DB with status 'pending'
    const query = `
      INSERT INTO payments (
        id, order_id, merchant_id, amount, currency, method, vpa, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `;
    
    const values = [
      paymentId,
      order_id,
      merchant.id,
      amount,
      currency,
      method,
      vpa || null
    ];

    try {
      const result = await db.query(query, values);
      const payment = result.rows[0];

      // 2. Enqueue Job
      await paymentQueue.add(QUEUE_NAMES.PAYMENT, {
        paymentId: payment.id,
        isTestMode: process.env.TEST_MODE === 'true'
      });

      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async findById(id) {
    const query = 'SELECT * FROM payments WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async updateStatus(id, status, error = null) {
      let query = 'UPDATE payments SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *';
      let values = [id, status];

      if (error) {
          query = `
            UPDATE payments 
            SET status = $2, error_code = $3, error_description = $4, updated_at = NOW() 
            WHERE id = $1 RETURNING *
          `;
          values = [id, status, error.code, error.description];
      }

      const result = await db.query(query, values);
      return result.rows[0];
  }

  async capturePayment(id) {
      const query = 'UPDATE payments SET captured = true, updated_at = NOW() WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
  }
}

module.exports = new PaymentService();
