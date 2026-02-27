const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  console.log('\n📦 Received Webhook:', req.body.event);

  const expectedSignature = crypto
    .createHmac('sha256', 'whsec_test_abc123')
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    console.error('❌ Invalid Signature!');
    return res.status(401).send('Invalid signature');
  } else {
    console.log('✅ Signature Verified');
  }

  // console.log('Payload:', JSON.stringify(req.body, null, 2));

  res.status(200).send('OK');
});

app.listen(4000, () => {
    console.log('Test Merchant running on port 4000');
});
