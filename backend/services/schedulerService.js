const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const Intern = require('../models/Intern');
const Task = require('../models/Task');
const Review = require('../models/Review');
const SystemSetting = require('../models/SystemSetting');
const { scheduleGoogleMeetSession } = require('./calendarService');
const { sendSystemEmail, templates } = require('./emailService');

let schedulerJob = null;

/**
 * Returns current system settings or default fallback values
 */
const getSettings = async () => {
  let settings = await SystemSetting.findOne({ key: 'global_settings' });
  if (!settings) {
    settings = await SystemSetting.create({
      key: 'global_settings',
      explanationIntervalDays: parseInt(process.env.DEFAULT_EXPLANATION_INTERVAL_DAYS || '2', 10),
      reviewIntervalDays: parseInt(process.env.DEFAULT_REVIEW_INTERVAL_DAYS || '2', 10),
      reminderHoursBeforeMeeting: parseInt(process.env.REMINDER_HOURS_BEFORE_MEETING || '4', 10),
      autoScheduleNextReview: true,
      timezone: process.env.TIMEZONE || 'Asia/Kolkata',
    });
  }
  return settings;
};

/**
 * Check for upcoming meetings in the next N hours and send reminders (restart-safe)
 */
const checkAndSendMeetingReminders = async () => {
  try {
    const settings = await getSettings();
    const hours = settings.reminderHoursBeforeMeeting || 4;

    const now = new Date();
    const futureThreshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

    // Find scheduled meetings happening within the next N hours where reminder hasn't been sent
    const upcomingMeetings = await Meeting.find({
      status: 'scheduled',
      reminderSent: false,
      startTime: { $gte: now, $lte: futureThreshold },
    }).populate('internId taskId');

    for (const meeting of upcomingMeetings) {
      if (!meeting.internId || !meeting.internId.email) continue;

      const intern = meeting.internId;
      const formattedTime = new Date(meeting.startTime).toLocaleString('en-US', {
        timeZone: meeting.timezone || settings.timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const html = templates.meetingReminderTemplate({
        internName: intern.fullName,
        meetingTitle: meeting.title,
        startTime: formattedTime,
        timezone: meeting.timezone || settings.timezone,
        meetLink: meeting.googleMeetLink,
        agenda: meeting.agenda || 'Task discussion and evaluation',
      });

      const emailRes = await sendSystemEmail({
        emailType: 'meeting_reminder',
        recipient: intern.email,
        internId: intern._id,
        subject: `Reminder: ${meeting.title} at ${formattedTime}`,
        html,
        payloadMetadata: { meetingId: meeting._id, title: meeting.title },
      });

      if (emailRes.success) {
        meeting.reminderSent = true;
        await meeting.save();
        console.log(`[Scheduler] Reminder sent to ${intern.email} for meeting ${meeting._id}`);
      }
    }
  } catch (error) {
    console.error('[Scheduler Error: Reminders]', error.message);
  }
};

/**
 * Check for overdue internships or tasks past end date and flag for mentor intervention
 */
const checkOverdueInterns = async () => {
  try {
    const now = new Date();
    const overdueInterns = await Intern.find({
      isActive: true,
      isCompleted: false,
      internshipEndDate: { $lt: now },
      status: { $nin: ['completed', 'overdue'] },
    }).populate('currentTaskId');

    for (const intern of overdueInterns) {
      intern.status = 'overdue';
      await intern.save();

      console.warn(`[Scheduler] Intern ${intern.fullName} (${intern.internId}) marked OVERDUE.`);

      // Notify mentor if email available
      if (intern.mentorEmail) {
        const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/interns/${intern._id}`;
        const html = templates.mentorEscalationTemplate({
          internName: intern.fullName,
          internEmail: intern.email,
          taskTitle: intern.currentTaskId?.taskTitle || 'Assigned Project',
          reason: 'Internship end date reached before project completion criteria were satisfied.',
          portalUrl,
        });

        await sendSystemEmail({
          emailType: 'mentor_escalation',
          recipient: intern.mentorEmail,
          internId: intern._id,
          subject: `Action Required: Intern ${intern.fullName} Overdue`,
          html,
          payloadMetadata: { internId: intern._id, reason: 'end_date_exceeded' },
        });
      }
    }
  } catch (error) {
    console.error('[Scheduler Error: Overdue Check]', error.message);
  }
};

/**
 * Helper to automatically schedule the next review cycle for an intern
 */
const scheduleNextReviewCycle = async (internId, taskId, currentCycle) => {
  const settings = await getSettings();
  if (!settings.autoScheduleNextReview) {
    console.log('[Scheduler] Auto-scheduling is disabled in settings.');
    return null;
  }

  const intern = await Intern.findById(internId);
  const task = await Task.findById(taskId);

  if (!intern || !task) return null;

  // Check if internship end date already passed
  const now = new Date();
  if (intern.internshipEndDate && new Date(intern.internshipEndDate) < now) {
    console.warn(`[Scheduler] Cannot schedule review for ${intern.fullName}; internship end date has passed.`);
    return null;
  }

  const nextCycleNumber = currentCycle + 1;
  const daysToAdd = settings.reviewIntervalDays || 2;

  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + daysToAdd);
  scheduledDate.setHours(15, 0, 0, 0); // 3:00 PM default

  const startTime = new Date(scheduledDate);
  const endTime = new Date(scheduledDate.getTime() + 45 * 60 * 1000); // 45 minutes

  const meetingResult = await scheduleGoogleMeetSession({
    internId: intern._id,
    taskId: task._id,
    meetingType: 'subsequent_review',
    title: `Review Cycle #${nextCycleNumber}: ${task.taskTitle}`,
    agenda: `Evaluate resolved issues and inspect improved codebase for Cycle #${nextCycleNumber}.`,
    scheduledDate,
    startTime,
    endTime,
    timezone: settings.timezone,
    cycleNumber: nextCycleNumber,
    attendeeEmail: intern.email,
  });

  if (!meetingResult.isDuplicate) {
    // Send email notification for next review
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
      timeZone: settings.timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedStart = startTime.toLocaleTimeString('en-US', { timeZone: settings.timezone, timeStyle: 'short' });
    const formattedEnd = endTime.toLocaleTimeString('en-US', { timeZone: settings.timezone, timeStyle: 'short' });

    // Fetch latest review for suggested actions
    const latestReview = await Review.findOne({ internId: intern._id }).sort({ cycleNumber: -1 });
    const suggestedActions = latestReview?.analysis?.recommendedNextSteps || [];

    const html = templates.nextReviewSchedulingTemplate({
      internName: intern.fullName,
      taskTitle: task.taskTitle,
      cycleNumber: nextCycleNumber,
      meetingDate: formattedDate,
      startTime: formattedStart,
      endTime: formattedEnd,
      timezone: settings.timezone,
      meetLink: meetingResult.meeting.googleMeetLink,
      suggestedActions,
    });

    await sendSystemEmail({
      emailType: 'next_review_scheduling',
      recipient: intern.email,
      internId: intern._id,
      subject: `Review Cycle #${nextCycleNumber} Scheduled: ${task.taskTitle}`,
      html,
      payloadMetadata: { meetingId: meetingResult.meeting._id, cycleNumber: nextCycleNumber },
    });

    // Update intern status
    intern.status = 'changes_requested';
    await intern.save();
  }

  return meetingResult.meeting;
};

/**
 * Start the background cron scheduler
 */
const startScheduler = () => {
  if (schedulerJob) {
    console.log('[Scheduler] Background job already running.');
    return;
  }

  console.log('[Scheduler] Initializing persistent background scheduler (running every 10 minutes)...');

  // Run every 10 minutes: */10 * * * *
  schedulerJob = cron.schedule('*/10 * * * *', async () => {
    console.log(`[Scheduler Heartbeat] ${new Date().toISOString()} - Checking reminders and overdue interns...`);
    await checkAndSendMeetingReminders();
    await checkOverdueInterns();
  });

  // Run initial checks once on startup
  setTimeout(() => {
    checkAndSendMeetingReminders();
    checkOverdueInterns();
  }, 5000);
};

module.exports = {
  startScheduler,
  checkAndSendMeetingReminders,
  checkOverdueInterns,
  scheduleNextReviewCycle,
};
