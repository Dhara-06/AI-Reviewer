const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const Intern = require('../models/Intern');
const config = require('../config/env');
const { sendSystemEmail } = require('../services/emailService');

let schedulerJob = null;

const checkAndSendReminders = async () => {
  try {
    const hours = config.intervals.reminderHours || 4;
    const now = new Date();
    const futureThreshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const upcoming = await Meeting.find({
      status: 'scheduled',
      reminderSent: false,
      startTime: { $gte: now, $lte: futureThreshold },
    }).populate('internId');

    for (const m of upcoming) {
      if (!m.internId || !m.internId.email) continue;
      const formattedTime = new Date(m.startTime).toLocaleString('en-US', {
        timeZone: m.timezone || config.intervals.timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const html = `
        <h3>Meeting Reminder: ${m.title}</h3>
        <p>Dear ${m.internId.fullName},</p>
        <p>This is a reminder that you have an upcoming session starting at <strong>${formattedTime}</strong>.</p>
        <p><a href="${m.googleMeetLink}">Click here to join Google Meet</a></p>
      `;

      const emailRes = await sendSystemEmail({
        emailType: 'meeting_reminder',
        recipient: m.internId.email,
        internId: m.internId._id,
        subject: `Reminder: ${m.title} at ${formattedTime}`,
        html,
        payloadMetadata: { meetingId: m._id },
      });

      if (emailRes.success) {
        m.reminderSent = true;
        await m.save();
      }
    }
  } catch (err) {
    console.error('[Scheduler Reminder Error]', err.message);
  }
};

const checkOverdueInternships = async () => {
  try {
    const now = new Date();
    const overdueInterns = await Intern.find({
      isActive: true,
      isCompleted: false,
      internshipEndDate: { $lt: now },
      status: { $nin: ['completed', 'overdue'] },
    });

    for (const intern of overdueInterns) {
      intern.status = 'overdue';
      await intern.save();
    }
  } catch (err) {
    console.error('[Scheduler Overdue Error]', err.message);
  }
};

const startScheduler = () => {
  if (schedulerJob) return;
  console.log('[Scheduler] Initializing background scheduler (every 10 minutes)...');

  schedulerJob = cron.schedule('*/10 * * * *', async () => {
    await checkAndSendReminders();
    await checkOverdueInternships();
  });

  setTimeout(() => {
    checkAndSendReminders();
    checkOverdueInternships();
  }, 5000);
};

module.exports = {
  startScheduler,
  checkAndSendReminders,
  checkOverdueInternships,
};
