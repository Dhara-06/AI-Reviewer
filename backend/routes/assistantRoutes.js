const express = require('express');
const { body, validationResult } = require('express-validator');
const { chatWithAssistant, saveSessionSummary } = require('../controllers/assistantController');
const { authenticate } = require('../middleware/auth');

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

router.post(
  '/chat',
  authenticate,
  validate([
    body('message').notEmpty().withMessage('Message text is required'),
  ]),
  chatWithAssistant
);

router.post(
  '/session-summary',
  authenticate,
  validate([
    body('meetingId').notEmpty().withMessage('Meeting ID is required'),
  ]),
  saveSessionSummary
);

module.exports = router;
