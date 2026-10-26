const mongoose = require('mongoose');

const problemFixSchema = new mongoose.Schema(
  {
    problem: { type: String, required: true },
    suggestedFix: { type: String, required: true },
    file: { type: String, default: '' },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    cycleNumber: {
      type: Number,
      default: 1,
    },
    githubRepoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    commitSha: {
      type: String,
      default: '',
    },
    projectDescription: {
      type: String,
      default: '',
    },
    submissionNotes: {
      type: String,
      default: '',
    },
    deploymentUrl: {
      type: String,
      default: '',
    },
    inspectionDetails: {
      filesAnalyzed: [String],
      totalFiles: { type: Number, default: 0 },
      isLiveAnalysis: { type: Boolean, default: false },
      repositoryMetadata: {
        stars: Number,
        forks: Number,
        defaultBranch: String,
        lastUpdated: Date,
      },
    },
    analysis: {
      summary: { type: String, default: '' },
      requirementsSatisfied: { type: [String], default: [] },
      requirementsPartiallySatisfied: { type: [String], default: [] },
      requirementsMissing: { type: [String], default: [] },
      evidence: { type: [String], default: [] },
      strengths: { type: [String], default: [] },
      problemsAndFixes: { type: [problemFixSchema], default: [] },
      recommendedNextSteps: { type: [String], default: [] },
      suggestedTestCases: { type: [String], default: [] },
      reviewStatus: {
        type: String,
        enum: ['needs_changes', 'ready_for_mentor_review', 'completed_pending_approval'],
        default: 'needs_changes',
      },
    },
    spokenFeedbackSummary: {
      type: String,
      default: '',
    },
    voiceFollowUpNotes: [
      {
        speaker: { type: String, enum: ['intern', 'assistant'], required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    mentorApproval: {
      isApproved: { type: Boolean, default: false },
      approvedBy: { type: String, default: '' },
      approvedAt: { type: Date, default: null },
      mentorNotes: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending_analysis', 'analyzed', 'changes_requested', 'ready_for_mentor_review', 'approved_completed'],
      default: 'analyzed',
    },
  },
  { timestamps: true }
);

reviewSchema.index({ internId: 1, cycleNumber: 1 });
reviewSchema.index({ taskId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
