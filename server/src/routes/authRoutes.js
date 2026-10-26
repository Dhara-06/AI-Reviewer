const express = require('express');
const { body, validationResult } = require('express-validator');
const { login, getMe } = require('../controllers/authController');
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

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.get('/me', authenticate, getMe);

module.exports = router;
