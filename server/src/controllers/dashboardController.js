const Intern = require('../models/Intern');
const Meeting = require('../models/Meeting');
const Review = require('../models/Review');
const EmailLog = require('../models/EmailLog');

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalInterns,
      activeInterns,
      pendingTaskExplanations,
      upcomingMeetings,
      pendingSubmissions,
      reviewsCompleted,
      tasksRequiringImprovement,
      completedInternships,
      recentMeetings,
      recentReviews,
      recentEmailLogs,
    ] = await Promise.all([
      Intern.countDocuments(),
      Intern.countDocuments({ isActive: true, isCompleted: false }),
      Intern.countDocuments({ status: { $in: ['task_allocated', 'explanation_scheduled'] } }),
      Meeting.countDocuments({ status: 'scheduled', startTime: { $gte: now } }),
      Intern.countDocuments({ status: { $in: ['explanation_completed', 'review_pending'] } }),
      Review.countDocuments(),
      Intern.countDocuments({ status: { $in: ['needs_changes', 'changes_requested'] } }),
      Intern.countDocuments({ isCompleted: true }),
      Meeting.find().populate('internId', 'fullName internId').sort({ scheduledDate: -1 }).limit(5),
      Review.find().populate('internId', 'fullName internId').populate('taskId', 'taskTitle').sort({ createdAt: -1 }).limit(5),
      EmailLog.find().sort({ createdAt: -1 }).limit(6),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalInterns,
          activeInterns,
          pendingTaskExplanations,
          upcomingMeetings,
          pendingSubmissions,
          reviewsCompleted,
          tasksRequiringImprovement,
          completedInternships,
        },
        recentMeetings,
        recentReviews,
        recentEmailLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
