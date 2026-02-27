const express = require('express');
const router = express.Router();
const paymentRoutes = require('./payments');
const webhookRoutes = require('./webhooks');
const testRoutes = require('./test');
const refundController = require('../controllers/refundController');
const authenticate = require('../middleware/auth');

router.use('/payments', paymentRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/test', testRoutes);

// Direct refund routes
router.get('/refunds/:refund_id', authenticate, refundController.getRefund);

module.exports = router;
