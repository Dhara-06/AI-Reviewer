const express = require('express');
const { body, validationResult } = require('express-validator');
const { chat, getHistory, saveSessionSummary } = require('../controllers/assistantController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((err) => `${err.path}: ${err.msg}`),
    });
  };
};

/**
 * POST /api/assistant/chat
 * Handles dynamic AI conversational chat with MongoDB conversation history isolation
 */
router.post(
  '/chat',
  authenticate,
  validate([
    body('message').trim().notEmpty().withMessage('Message text is required'),
  ]),
  chat
);

/**
 * GET /api/assistant/history/:sessionId
 * Retrieves previous conversation turns for a session
 */
router.get('/history/:sessionId', authenticate, getHistory);

/**
 * POST /api/assistant/session-summary
 * Saves voice session summary and notes to the meeting
 */
router.post(
  '/session-summary',
  authenticate,
  validate([
    body('meetingId').notEmpty().withMessage('Meeting ID is required'),
  ]),
  saveSessionSummary
);

module.exports = router;
