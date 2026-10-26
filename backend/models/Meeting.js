const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    meetingType: {
      type: String,
      required: true,
      enum: ['explanation', 'first_review', 'subsequent_review'],
    },
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
    title: {
      type: String,
      required: true,
    },
    agenda: {
      type: String,
      default: '',
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    googleEventId: {
      type: String,
      default: '',
    },
    googleMeetLink: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    sessionSummary: {
      type: String,
      default: '',
    },
    sessionNotes: {
      type: String,
      default: '',
    },
    isVoiceSessionCompleted: {
      type: Boolean,
      default: false,
    },
    cycleNumber: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

meetingSchema.index({ internId: 1, meetingType: 1, cycleNumber: 1 });
meetingSchema.index({ scheduledDate: 1, status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
