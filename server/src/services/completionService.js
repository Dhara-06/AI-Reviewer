const Review = require('../models/Review');
const Task = require('../models/Task');
const Intern = require('../models/Intern');
const { sendSystemEmail } = require('./emailService');

const approveInternshipCompletion = async ({ reviewId, mentorName = 'Assigned Mentor', mentorNotes = '' }) => {
  const review = await Review.findById(reviewId).populate('internId taskId');
  if (!review) throw new Error('Review record not found.');

  const intern = review.internId;
  const task = review.taskId;
  if (!intern || !task) throw new Error('Associated intern or task missing.');

  const completionDate = new Date();

  // 1. Update Review
  review.mentorApproval = {
    isApproved: true,
    approvedBy: mentorName,
    approvedAt: completionDate,
    mentorNotes,
  };
  review.status = 'approved_completed';
  await review.save();

  // 2. Mark Task completed
  task.status = 'completed';
  await task.save();

  // 3. Mark Intern completed
  intern.isCompleted = true;
  intern.status = 'completed';
  intern.completionDate = completionDate;
  intern.finalFeedbackNotes = mentorNotes;
  await intern.save();

  // 4. Send Congratulatory Email
  const formattedDate = completionDate.toLocaleDateString('en-US', { dateStyle: 'full' });
  const html = `
    <h2>Congratulations on Completing Your Internship Project!</h2>
    <p>Dear <strong>${intern.fullName}</strong>,</p>
    <p>Your mentor has approved the completion of your project: <strong>${task.taskTitle}</strong> on ${formattedDate}.</p>
    ${mentorNotes ? `<p><strong>Mentor Feedback:</strong> ${mentorNotes}</p>` : ''}
    <p>Best regards,<br/><strong>Internship Mentorship Board</strong></p>
  `;

  await sendSystemEmail({
    emailType: 'completion_congratulations',
    recipient: intern.email,
    internId: intern._id,
    subject: `Congratulations on Completing Your Internship Project: ${task.taskTitle}`,
    html,
    payloadMetadata: { reviewId: review._id, taskId: task._id },
  });

  return { review, intern, task };
};

module.exports = {
  approveInternshipCompletion,
};
