const Review = require('../models/Review');
const { approveInternshipCompletion } = require('../services/completionService');

const getAllReviews = async (req, res, next) => {
  try {
    const { status, internId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (internId) query.internId = internId;

    const reviews = await Review.find(query)
      .populate('internId', 'internId fullName email')
      .populate('taskId', 'taskTitle')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const getReviewsForIntern = async (req, res, next) => {
  try {
    const { internId } = req.params;
    const reviews = await Review.find({ internId })
      .populate('taskId', 'taskTitle actualRequirements acceptanceCriteria')
      .sort({ cycleNumber: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('internId', 'internId fullName email mentorEmail')
      .populate('taskId');

    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const approveReview = async (req, res, next) => {
  try {
    const { mentorNotes = '' } = req.body;
    const mentorName = req.user?.name || 'Assigned Mentor';

    const result = await approveInternshipCompletion({
      reviewId: req.params.id,
      mentorName,
      mentorNotes,
    });

    res.status(200).json({
      success: true,
      message: 'Internship project completion approved. Congratulations email sent.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReviews,
  getReviewsForIntern,
  getReviewById,
  approveReview,
};
