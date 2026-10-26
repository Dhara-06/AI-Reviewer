const express = require('express');
const { getEmailLogs } = require('../controllers/emailLogController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireAdmin, getEmailLogs);

module.exports = router;
