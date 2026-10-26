const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    emailType: {
      type: String,
      required: true,
      enum: [
        'task_allocation',
        'explanation_meeting',
        'first_review_meeting',
        'submission_confirmation',
        'review_feedback',
        'next_review_scheduling',
        'meeting_reminder',
        'submission_failure',
        'mentor_escalation',
        'completion_congratulations',
      ],
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      default: null,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'mock_delivered', 'queued'],
      default: 'sent',
    },
    messageId: {
      type: String,
      default: '',
    },
    errorDetails: {
      type: String,
      default: '',
    },
    attempts: {
      type: Number,
      default: 1,
    },
    payloadMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

emailLogSchema.index({ recipient: 1, emailType: 1 });
emailLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
