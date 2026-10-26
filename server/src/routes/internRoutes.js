const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const {
  downloadTemplate,
  importExcel,
  getInterns,
  getInternById,
  createIntern,
  updateIntern,
  toggleInternActive,
} = require('../controllers/internController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

router.get('/template', downloadTemplate);
router.post('/import', authenticate, requireAdmin, upload.single('file'), importExcel);
router.get('/', authenticate, getInterns);
router.get('/:id', authenticate, getInternById);

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('internId').notEmpty().withMessage('Intern ID is required'),
    body('fullName').notEmpty().withMessage('Full Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ]),
  createIntern
);

router.put('/:id', authenticate, requireAdmin, updateIntern);
router.patch('/:id/toggle-active', authenticate, requireAdmin, toggleInternActive);

module.exports = router;
