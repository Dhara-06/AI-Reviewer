const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getTasks,
  getTaskById,
  proposeAiTask,
  createTask,
  updateTask,
} = require('../controllers/taskController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

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

router.get('/', authenticate, getTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/ai-propose', authenticate, requireAdmin, proposeAiTask);

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('taskTitle').notEmpty().withMessage('Task title is required'),
    body('taskDescription').notEmpty().withMessage('Task description is required'),
    body('assignedInternId').notEmpty().withMessage('Assigned intern ID is required'),
  ]),
  createTask
);

router.put('/:id', authenticate, requireAdmin, updateTask);

module.exports = router;
