const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const internSchema = new mongoose.Schema(
  {
    internId: {
      type: String,
      required: [true, 'Intern ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      default: '$2a$10$1Y8T1jM6N0Z6d3b3q2gQ.u7K2l8BwGf8H9k2e4T1x7a5b3c2d1e0f', // default intern password 'Intern@123'
    },
    skills: {
      type: [String],
      default: [],
    },
    internshipStartDate: {
      type: Date,
      required: [true, 'Internship start date is required'],
    },
    internshipEndDate: {
      type: Date,
      required: [true, 'Internship end date is required'],
    },
    githubUsername: {
      type: String,
      trim: true,
      default: '',
    },
    mentorEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'active',
        'task_allocated',
        'explanation_scheduled',
        'explanation_completed',
        'review_pending',
        'needs_changes',
        'changes_requested',
        'ready_for_mentor_review',
        'completed_pending_approval',
        'completed',
        'inactive',
        'overdue',
      ],
      default: 'active',
    },
    currentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completionDate: {
      type: Date,
      default: null,
    },
    finalFeedbackNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Pre-save password hashing if updated
internSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

internSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Helpful indexes
internSchema.index({ status: 1 });

module.exports = mongoose.model('Intern', internSchema);
