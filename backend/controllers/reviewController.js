const Review = require('../models/Review');
const Intern = require('../models/Intern');
const Task = require('../models/Task');
const { sendSystemEmail, templates } = require('../services/emailService');

/**
 * Get all reviews (for Admin reviews list)
 * GET /api/reviews
 */
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

/**
 * Get all reviews for a specific intern
 * GET /api/reviews/intern/:internId
 */
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

/**
 * Get single review by ID
 * GET /api/reviews/:id
 */
const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('internId', 'internId fullName email mentorEmail')
      .populate('taskId');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review record not found.' });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * Mentor approval for internship completion
 * POST /api/reviews/:id/approve
 */
const approveReview = async (req, res, next) => {
  try {
    const { mentorNotes = '' } = req.body;
    const review = await Review.findById(req.params.id)
      .populate('internId')
      .populate('taskId');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const intern = review.internId;
    const task = review.taskId;

    if (!intern || !task) {
      return res.status(400).json({ success: false, message: 'Associated intern or task missing.' });
    }

    const completionDate = new Date();

    // 1. Update Review Mentor Approval
    review.mentorApproval = {
      isApproved: true,
      approvedBy: req.user.name || 'Assigned Mentor',
      approvedAt: completionDate,
      mentorNotes,
    };
    review.status = 'approved_completed';
    await review.save();

    // 2. Mark Task as completed
    task.status = 'completed';
    await task.save();

    // 3. Mark Intern as completed
    intern.isCompleted = true;
    intern.status = 'completed';
    intern.completionDate = completionDate;
    intern.finalFeedbackNotes = mentorNotes;
    await intern.save();

    // 4. Send Congratulatory Email
    const formattedDate = completionDate.toLocaleDateString('en-US', {
      dateStyle: 'full',
    });

    const emailHtml = templates.completionCongratulationsTemplate({
      internName: intern.fullName,
      taskTitle: task.taskTitle,
      completionDate: formattedDate,
      nextSteps: mentorNotes || 'Your formal milestone completion has been logged. Next steps will be provided by your mentor.',
    });

    await sendSystemEmail({
      emailType: 'completion_congratulations',
      recipient: intern.email,
      internId: intern._id,
      subject: `Congratulations on Completing Your Internship Project: ${task.taskTitle}`,
      html: emailHtml,
      payloadMetadata: { reviewId: review._id, taskId: task._id },
    });

    res.status(200).json({
      success: true,
      message: `Internship project completion approved for ${intern.fullName}. Congratulations email sent!`,
      data: {
        review,
        intern,
      },
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
