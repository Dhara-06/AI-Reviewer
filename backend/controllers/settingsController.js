const SystemSetting = require('../models/SystemSetting');

/**
 * Get current system settings
 * GET /api/settings
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({ key: 'global_settings' });
    if (!settings) {
      settings = await SystemSetting.create({
        key: 'global_settings',
        explanationIntervalDays: 2,
        reviewIntervalDays: 2,
        reminderHoursBeforeMeeting: 4,
        autoScheduleNextReview: true,
        mentorNotificationEmail: 'mentor@example.com',
        timezone: 'Asia/Kolkata',
        mockServices: {
          gemini: process.env.MOCK_GEMINI === 'true',
          calendar: process.env.MOCK_CALENDAR === 'true',
          email: process.env.MOCK_EMAIL === 'true',
        },
      });
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * Update system settings
 * PUT /api/settings
 */
const updateSettings = async (req, res, next) => {
  try {
    const {
      explanationIntervalDays,
      reviewIntervalDays,
      reminderHoursBeforeMeeting,
      autoScheduleNextReview,
      timezone,
      mentorNotificationEmail,
      mockServices,
    } = req.body;

    let settings = await SystemSetting.findOne({ key: 'global_settings' });
    if (!settings) {
      settings = new SystemSetting({ key: 'global_settings' });
    }

    if (explanationIntervalDays !== undefined) settings.explanationIntervalDays = explanationIntervalDays;
    if (reviewIntervalDays !== undefined) settings.reviewIntervalDays = reviewIntervalDays;
    if (reminderHoursBeforeMeeting !== undefined) settings.reminderHoursBeforeMeeting = reminderHoursBeforeMeeting;
    if (autoScheduleNextReview !== undefined) settings.autoScheduleNextReview = autoScheduleNextReview;
    if (timezone !== undefined) settings.timezone = timezone;
    if (mentorNotificationEmail !== undefined) settings.mentorNotificationEmail = mentorNotificationEmail;
    if (mockServices !== undefined) settings.mockServices = { ...settings.mockServices, ...mockServices };

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
