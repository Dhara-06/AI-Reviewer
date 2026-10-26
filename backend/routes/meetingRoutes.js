const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getMeetings,
  scheduleMeeting,
  updateMeetingStatus,
  getOauthUrl,
  oauth2Callback,
} = require('../controllers/meetingController');
const { authenticate, requireAdmin } = require('../middleware/auth');

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

router.get('/', authenticate, getMeetings);

router.post(
  '/schedule',
  authenticate,
  requireAdmin,
  validate([
    body('internId').notEmpty().withMessage('Intern ID is required'),
    body('taskId').notEmpty().withMessage('Task ID is required'),
    body('meetingType').isIn(['explanation', 'first_review', 'subsequent_review']).withMessage('Valid meeting type required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('scheduledDate').isISO8601().toDate().withMessage('Valid scheduled date required'),
    body('startTime').isISO8601().toDate().withMessage('Valid start time required'),
    body('endTime').isISO8601().toDate().withMessage('Valid end time required'),
  ]),
  scheduleMeeting
);

router.patch('/:id/status', authenticate, updateMeetingStatus);

router.get('/oauth-url', authenticate, requireAdmin, getOauthUrl);
router.get('/oauth2callback', oauth2Callback);

module.exports = router;
