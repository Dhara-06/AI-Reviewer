const express = require('express');
const {
  getAllReviews,
  getReviewsForIntern,
  getReviewById,
  approveReview,
} = require('../controllers/reviewController');
const { authenticate, requireAdmin, requireInternOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireAdmin, getAllReviews);
router.get('/intern/:internId', authenticate, requireInternOrAdmin, getReviewsForIntern);
router.get('/:id', authenticate, getReviewById);
router.post('/:id/approve', authenticate, requireAdmin, approveReview);

module.exports = router;
