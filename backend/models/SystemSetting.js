const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global_settings',
    },
    explanationIntervalDays: {
      type: Number,
      default: 2,
      min: 1,
      max: 30,
    },
    reviewIntervalDays: {
      type: Number,
      default: 2,
      min: 1,
      max: 30,
    },
    reminderHoursBeforeMeeting: {
      type: Number,
      default: 4,
      min: 1,
      max: 48,
    },
    autoScheduleNextReview: {
      type: Boolean,
      default: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    mentorNotificationEmail: {
      type: String,
      default: 'mentor@example.com',
      trim: true,
      lowercase: true,
    },
    mockServices: {
      gemini: { type: Boolean, default: true },
      calendar: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
