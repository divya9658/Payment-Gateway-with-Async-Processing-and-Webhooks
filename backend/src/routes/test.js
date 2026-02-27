const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/jobs/status', testController.getJobStatus);

module.exports = router;
