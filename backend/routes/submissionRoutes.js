const express = require('express');
const { body, validationResult } = require('express-validator');
const { submitProject } = require('../controllers/submissionController');
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
  '/',
  authenticate,
  validate([
    body('githubRepoUrl')
      .notEmpty()
      .withMessage('GitHub repository URL is required')
      .isURL()
      .withMessage('Please provide a valid URL'),
  ]),
  submitProject
);

module.exports = router;
