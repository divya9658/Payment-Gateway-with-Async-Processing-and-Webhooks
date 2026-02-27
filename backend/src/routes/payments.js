const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const idempotency = require('../middleware/idempotency'); // Import
const paymentController = require('../controllers/paymentController');
const refundController = require('../controllers/refundController');

router.use(authenticate);

// Apply idempotency only to POST / (Created Payment)
router.post('/', idempotency, paymentController.createPayment);
router.post('/:payment_id/capture', paymentController.capturePayment);
router.post('/:payment_id/refunds', refundController.createRefund);

module.exports = router;
