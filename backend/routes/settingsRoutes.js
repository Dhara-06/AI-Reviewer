const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, requireAdmin, updateSettings);

module.exports = router;
