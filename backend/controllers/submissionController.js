const Intern = require('../models/Intern');
const Task = require('../models/Task');
const Review = require('../models/Review');
const { inspectRepository } = require('../services/githubService');
const { analyzeProjectSubmission } = require('../services/geminiService');
const { sendSystemEmail, templates } = require('../services/emailService');
const { scheduleNextReviewCycle } = require('../services/schedulerService');

/**
 * Handle Intern GitHub project submission
 * POST /api/submissions
 */
const submitProject = async (req, res, next) => {
  try {
    const { githubRepoUrl, projectDescription, submissionNotes, deploymentUrl } = req.body;
    const internId = req.user.role === 'intern' ? req.user.id : req.body.internId;

    if (!githubRepoUrl) {
      return res.status(400).json({
        success: false,
        message: 'GitHub repository URL is required.',
      });
    }

    const intern = await Intern.findById(internId).populate('currentTaskId');
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern record not found.' });
    }

    if (!intern.currentTaskId) {
      return res.status(400).json({
        success: false,
        message: 'No active task currently allocated to this intern.',
      });
    }

    const task = intern.currentTaskId;

    // Determine review cycle number
    const previousReviewsCount = await Review.countDocuments({ internId: intern._id });
    const currentCycle = previousReviewsCount + 1;

    // 1. Safe GitHub Inspection
    let repoDetails;
    try {
      repoDetails = await inspectRepository(githubRepoUrl);
    } catch (githubError) {
      // Send failure notification email
      const retryUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/intern/portal`;
      const failHtml = templates.submissionFailureTemplate({
        internName: intern.fullName,
        taskTitle: task.taskTitle,
        errorMessage: githubError.message,
        retryUrl,
      });

      await sendSystemEmail({
        emailType: 'submission_failure',
        recipient: intern.email,
        internId: intern._id,
        subject: `Submission Issue: ${task.taskTitle}`,
        html: failHtml,
        payloadMetadata: { error: githubError.message, repoUrl: githubRepoUrl },
      });

      return res.status(422).json({
        success: false,
        message: githubError.message,
      });
    }

    // 2. Send Submission Confirmation Email
    const submittedAtFormatted = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const confirmHtml = templates.submissionConfirmationTemplate({
      internName: intern.fullName,
      taskTitle: task.taskTitle,
      githubRepoUrl,
      commitSha: repoDetails.commitSha,
      submittedAt: submittedAtFormatted,
    });

    await sendSystemEmail({
      emailType: 'submission_confirmation',
      recipient: intern.email,
      internId: intern._id,
      subject: `Submission Received: ${task.taskTitle} (Cycle #${currentCycle})`,
      html: confirmHtml,
      payloadMetadata: { commitSha: repoDetails.commitSha },
    });

    // 3. AI Project Analysis
    const aiAnalysis = await analyzeProjectSubmission({
      task,
      intern,
      repoDetails,
    });

    // 4. Save Review Record
    const review = await Review.create({
      internId: intern._id,
      taskId: task._id,
      cycleNumber: currentCycle,
      githubRepoUrl,
      commitSha: repoDetails.commitSha,
      projectDescription: projectDescription || '',
      submissionNotes: submissionNotes || '',
      deploymentUrl: deploymentUrl || '',
      inspectionDetails: {
        filesAnalyzed: (repoDetails.files || []).map((f) => f.path),
        totalFiles: repoDetails.totalFilesInRepo,
        isLiveAnalysis: !process.env.MOCK_GEMINI || process.env.MOCK_GEMINI === 'false',
        repositoryMetadata: repoDetails.repositoryMetadata,
      },
      analysis: {
        summary: aiAnalysis.summary,
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
      status: aiAnalysis.reviewStatus === 'completed_pending_approval'
        ? 'ready_for_mentor_review'
        : 'analyzed',
    });

    // 5. Update Task and Intern Status
    task.status = aiAnalysis.reviewStatus;
    await task.save();

    intern.status = aiAnalysis.reviewStatus;
    await intern.save();

    // 6. Send Review Feedback Email
    const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/intern/reviews`;
    const feedbackHtml = templates.reviewFeedbackTemplate({
      internName: intern.fullName,
      taskTitle: task.taskTitle,
      reviewStatus: aiAnalysis.reviewStatus,
      summary: aiAnalysis.summary,
      satisfiedCount: (aiAnalysis.requirementsSatisfied || []).length,
      missingCount: (aiAnalysis.requirementsMissing || []).length,
      actionItems: aiAnalysis.recommendedNextSteps || [],
      portalUrl,
    });

    await sendSystemEmail({
      emailType: 'review_feedback',
      recipient: intern.email,
      internId: intern._id,
      subject: `Project Review Feedback: ${task.taskTitle} (Cycle #${currentCycle})`,
      html: feedbackHtml,
      payloadMetadata: { reviewId: review._id, reviewStatus: aiAnalysis.reviewStatus },
    });

    // 7. If improvements are required, schedule next review cycle automatically
    let nextMeeting = null;
    if (aiAnalysis.reviewStatus === 'needs_changes') {
      nextMeeting = await scheduleNextReviewCycle(intern._id, task._id, currentCycle);
    }

    res.status(201).json({
      success: true,
      message: 'Project submitted and analyzed successfully.',
      data: {
        review,
        nextMeeting,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitProject,
};
