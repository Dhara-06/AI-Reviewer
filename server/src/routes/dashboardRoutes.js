const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', authenticate, requireAdmin, getDashboardStats);

module.exports = router;
