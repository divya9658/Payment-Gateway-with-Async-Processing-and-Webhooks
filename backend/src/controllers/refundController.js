const refundService = require('../services/refundService');
const paymentService = require('../services/paymentService');

const createRefund = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { amount, reason } = req.body;

    // Validate Input
    if (!amount) {
         return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Amount is required' } });
    }

    // Verify Payment
    const payment = await paymentService.findById(payment_id);
    if (!payment) {
         return res.status(404).json({ error: { code: 'NOT_FOUND', description: 'Payment not found' } });
    }
    
    if (payment.merchant_id !== req.merchant.id) {
         return res.status(404).json({ error: { code: 'NOT_FOUND', description: 'Payment not found' } });
    }

    if (payment.status !== 'success') {
         return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment not in refundable state' } });
    }

    // Create Refund
    try {
        const refund = await refundService.createRefund({ amount, reason }, req.merchant, payment);
        
        // Enqueue 'refund.created' Webhook
        const enqueueWebhook = require('../utils/enqueueWebhook');
        const webhookPayload = {
            event: 'refund.created',
            timestamp: Math.floor(Date.now() / 1000),
            data: { refund }
        };
        enqueueWebhook(req.merchant, 'refund.created', webhookPayload);

        res.status(201).json(refund);
    } catch (e) {
        if (e.message === 'Refund amount exceeds available amount') {
             return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: e.message } });
        }
        throw e;
    }

  } catch (error) {
    console.error('Create Refund Error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Failed to create refund' } });
  }
};

const getRefund = async (req, res) => {
    try {
        const { refund_id } = req.params;
        const refund = await refundService.findById(refund_id);

        if (!refund) {
             return res.status(404).json({ error: { code: 'NOT_FOUND', description: 'Refund not found' } });
        }
        
        if (refund.merchant_id !== req.merchant.id) {
             return res.status(404).json({ error: { code: 'NOT_FOUND', description: 'Refund not found' } });
        }

        res.json(refund);
    } catch (error) {
        console.error('Get Refund Error:', error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Failed to fetch refund' } });
    }
};

module.exports = {
  createRefund,
  getRefund
};
