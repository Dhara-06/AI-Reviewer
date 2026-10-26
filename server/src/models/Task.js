const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    taskTitle: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    taskDescription: {
      type: String,
      required: [true, 'Task description is required'],
    },
    businessProblem: {
      type: String,
      default: '',
    },
    actualRequirements: {
      type: [String],
      default: [],
    },
    functionalRequirements: {
      type: [String],
      default: [],
    },
    suggestedTechnologies: {
      type: [String],
      default: [],
    },
    stepByStepPlan: {
      type: [String],
      default: [],
    },
    expectedOutput: {
      type: String,
      default: '',
    },
    acceptanceCriteria: {
      type: [String],
      default: [],
    },
    submissionInstructions: {
      type: String,
      default: 'Submit the GitHub repository URL with full source code, comprehensive README.md, and optional deployment URL.',
    },
    reviewSchedule: {
      type: String,
      default: 'First review in 2 days. Subsequent cycles every 2 days until acceptance criteria are met.',
    },
    assignedInternId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        'allocated',
        'in_progress',
        'submitted',
        'under_review',
        'needs_changes',
        'changes_requested',
        'ready_for_mentor_review',
        'completed_pending_approval',
        'completed',
      ],
      default: 'allocated',
    },
  },
  { timestamps: true }
);

taskSchema.index({ assignedInternId: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model('Task', taskSchema);
