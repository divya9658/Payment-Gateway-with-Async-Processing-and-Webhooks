const { paymentQueue } = require('../queues');

const getJobStatus = async (req, res) => {
  try {
    // Get stats from Payment Queue (as a representative)
    const counts = await paymentQueue.getJobCounts('wait', 'active', 'completed', 'failed');
    
    res.json({
      pending: counts.wait,
      processing: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      worker_status: 'running' // Simulating for now, hard to detect without more logic
    });
  } catch (error) {
    console.error('Job Status Error:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
};

module.exports = { getJobStatus };
