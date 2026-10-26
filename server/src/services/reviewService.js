const Review = require('../models/Review');
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const Intern = require('../models/Intern');
const { inspectRepository } = require('./githubService');
const { analyzeProjectSubmission } = require('./aiService');
const { sendSystemEmail } = require('./emailService');
const { scheduleGoogleMeetSession } = require('./calendarService');
const config = require('../config/env');

const processSubmissionReview = async ({
  internId,
  githubRepoUrl,
  projectDescription = '',
  submissionNotes = '',
  deploymentUrl = '',
}) => {
  const intern = await Intern.findById(internId).populate('currentTaskId');
  if (!intern) throw new Error('Intern not found.');
  if (!intern.currentTaskId) throw new Error('No active task currently allocated to this intern.');

  const task = intern.currentTaskId;
  const previousReviewsCount = await Review.countDocuments({ internId: intern._id });
  const currentCycle = previousReviewsCount + 1;

  // 1. Safe GitHub inspection
  const repoDetails = await inspectRepository(githubRepoUrl);

  // 2. AI Code Analysis
  const aiAnalysis = await analyzeProjectSubmission({ task, intern, repoDetails });

  // 3. Save Review document
  const review = await Review.create({
    internId: intern._id,
    taskId: task._id,
    cycleNumber: currentCycle,
    githubRepoUrl,
    commitSha: repoDetails.commitSha,
    projectDescription,
    submissionNotes,
    deploymentUrl,
    inspectionDetails: {
      filesAnalyzed: (repoDetails.files || []).map((f) => f.path),
      totalFiles: repoDetails.totalFilesInRepo,
      isLiveAnalysis: true,
      repositoryMetadata: repoDetails.repositoryMetadata,
    },
    analysis: {
      summary: aiAnalysis.summary || '',
      requirementsSatisfied: aiAnalysis.requirementsSatisfied || [],
      requirementsPartiallySatisfied: aiAnalysis.requirementsPartiallySatisfied || [],
      requirementsMissing: aiAnalysis.requirementsMissing || [],
      evidence: aiAnalysis.evidence || [],
      strengths: aiAnalysis.strengths || [],
      problemsAndFixes: aiAnalysis.problemsAndFixes || [],
      recommendedNextSteps: aiAnalysis.recommendedNextSteps || [],
      suggestedTestCases: aiAnalysis.suggestedTestCases || [],
      reviewStatus: aiAnalysis.reviewStatus || 'needs_changes',
    },
    spokenFeedbackSummary: aiAnalysis.spokenFeedbackSummary || '',
    status: aiAnalysis.reviewStatus === 'completed_pending_approval' ? 'ready_for_mentor_review' : 'analyzed',
  });

  // 4. Save Submission record
  const submission = await Submission.create({
    internId: intern._id,
    taskId: task._id,
    githubRepoUrl,
    commitSha: repoDetails.commitSha,
    projectDescription,
    submissionNotes,
    deploymentUrl,
    cycleNumber: currentCycle,
    reviewId: review._id,
    status: 'analyzed',
  });

  // 5. Update Task and Intern
  task.status = aiAnalysis.reviewStatus;
  await task.save();

  intern.status = aiAnalysis.reviewStatus;
  await intern.save();

  // 6. If improvements required, schedule next review session (+2 days)
  let nextMeeting = null;
  if (aiAnalysis.reviewStatus === 'needs_changes') {
    const daysToAdd = config.intervals.reviewDays || 2;
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysToAdd);
    scheduledDate.setHours(15, 0, 0, 0);

    const startTime = new Date(scheduledDate);
    const endTime = new Date(scheduledDate.getTime() + 45 * 60 * 1000);

    const meetRes = await scheduleGoogleMeetSession({
      internId: intern._id,
      taskId: task._id,
      meetingType: 'subsequent_review',
      title: `Review Cycle #${currentCycle + 1}: ${task.taskTitle}`,
      agenda: `Evaluate resolved issues and inspect improved codebase for Cycle #${currentCycle + 1}.`,
      scheduledDate,
      startTime,
      endTime,
      timezone: config.intervals.timezone,
      cycleNumber: currentCycle + 1,
      attendeeEmail: intern.email,
    });
    nextMeeting = meetRes.meeting;
  }

  return { review, submission, nextMeeting };
};

module.exports = {
  processSubmissionReview,
};
