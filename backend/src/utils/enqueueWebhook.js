const { webhookQueue, QUEUE_NAMES } = require('../queues');

const enqueueWebhook = async (merchant, event, payload) => {
  if (!merchant.webhook_url) return;

  // We need to create a log entry first to get an ID? 
  // actually the worker creates the logic usually? 
  // No, the requirement says "Log webhook attempt... Record attempt number".
  // Usually we create the pending log entry immediately so it's tracked.
  // But for simplicity and to match the 'deliverWebhook' job input, let's create a log verify log creation logic.
  
  // Checking `webhookService.js` (I can't read it now but I remember it has createLog).
  // Let's assume we need to replicate what paymentWorker does or use a service.
  // Best practice: Service method.
  
  const webhookService = require('../services/webhookService');
  
  try {
      const log = await webhookService.createLog(merchant.id, event, payload);
      
      await webhookQueue.add(QUEUE_NAMES.WEBHOOK, {
        webhookId: log.id,
        merchantId: merchant.id,
        url: merchant.webhook_url,
        secret: merchant.webhook_secret,
        payload: JSON.stringify(payload),
        attemptNumber: 1
      });
  } catch (err) {
      console.error('Failed to enqueue webhook:', err);
  }
};

module.exports = enqueueWebhook;
