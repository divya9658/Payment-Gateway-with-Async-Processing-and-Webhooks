const paymentService = require('../services/paymentService');

const createPayment = async (req, res) => {
  try {
    const { amount, currency, method, order_id, vpa } = req.body;
    
    // Basic Validation
    if (!amount || !currency || !method || !order_id) {
        return res.status(400).json({
            error: {
                code: 'BAD_REQUEST_ERROR',
                description: 'Missing required fields'
            }
        });
    }

    // Create Payment
    const payment = await paymentService.createPayment(req.body, req.merchant);
    
    // Enqueue 'payment.created' Webhook
    const enqueueWebhook = require('../utils/enqueueWebhook');
    // Payload wrapper as per requirement: { event, timestamp, data: { payment: ... } }
    const webhookPayload = {
        event: 'payment.created',
        timestamp: Math.floor(Date.now() / 1000),
        data: { payment }
    };
    // Fire and forget
    enqueueWebhook(req.merchant, 'payment.created', webhookPayload);

    // Return Pending Payment
    res.status(201).json(payment);

  } catch (error) {
    console.error('Create Payment Error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Failed to create payment'
      }
    });
  }
};

const capturePayment = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const payment = await paymentService.findById(payment_id);

        if (!payment) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', description: 'Payment not found' } });
        }
        
        if (payment.merchant_id !== req.merchant.id) {
             return res.status(404).json({ error: { code: 'NOT_FOUND', description: 'Payment not found' } });
        }

        if (payment.status !== 'success') {
             return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment not in capturable state' } });
        }

        const updatedPayment = await paymentService.capturePayment(payment_id);
        res.json(updatedPayment);

    } catch (error) {
        console.error('Capture Payment Error:', error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Failed to capture payment' } });
    }
};

module.exports = {
  createPayment,
  capturePayment
};
