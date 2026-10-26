const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
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
    cycleNumber: {
      type: Number,
      default: 1,
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      default: null,
    },
    status: {
      type: String,
      enum: ['submitted', 'analyzed', 'failed'],
      default: 'submitted',
    },
  },
  { timestamps: true }
);

submissionSchema.index({ internId: 1, cycleNumber: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
