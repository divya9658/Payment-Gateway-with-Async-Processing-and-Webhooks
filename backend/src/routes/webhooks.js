const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const webhookController = require('../controllers/webhookController');

router.use(authenticate);

router.get('/', webhookController.listWebhooks);
router.post('/:webhook_id/retry', webhookController.retryWebhook);

module.exports = router;
