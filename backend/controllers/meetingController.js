const Meeting = require('../models/Meeting');
const Intern = require('../models/Intern');
const Task = require('../models/Task');
const { getOAuth2Client } = require('../config/googleCalendar');
const { scheduleGoogleMeetSession } = require('../services/calendarService');
const { sendSystemEmail, templates } = require('../services/emailService');

/**
 * Get all meetings with filtering
 * GET /api/meetings
 */
const getMeetings = async (req, res, next) => {
  try {
    const { meetingType, status, internId } = req.query;
    const query = {};

    if (meetingType) query.meetingType = meetingType;
    if (status) query.status = status;
    if (internId) query.internId = internId;

    const meetings = await Meeting.find(query)
      .populate('internId', 'internId fullName email')
      .populate('taskId', 'taskTitle')
      .sort({ scheduledDate: -1 });

    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually schedule a meeting
 * POST /api/meetings/schedule
 */
const scheduleMeeting = async (req, res, next) => {
  try {
    const {
      internId,
      taskId,
      meetingType,
      title,
      agenda,
      scheduledDate,
      startTime,
      endTime,
      timezone = 'Asia/Kolkata',
      cycleNumber = 1,
    } = req.body;

    const intern = await Intern.findById(internId);
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const meetingResult = await scheduleGoogleMeetSession({
      internId,
      taskId,
      meetingType,
      title,
      agenda,
      scheduledDate,
      startTime,
      endTime,
      timezone,
      cycleNumber,
      attendeeEmail: intern.email,
    });

    if (meetingResult.isDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'A meeting of this type is already scheduled for this cycle.',
        data: meetingResult.meeting,
      });
    }

    // Send calendar meeting email
    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
    });
    const formattedStart = new Date(startTime).toLocaleTimeString('en-US', { timeZone: timezone, timeStyle: 'short' });
    const formattedEnd = new Date(endTime).toLocaleTimeString('en-US', { timeZone: timezone, timeStyle: 'short' });

    let emailHtml = '';
    let emailSubject = '';

    if (meetingType === 'explanation') {
      emailHtml = templates.explanationMeetingTemplate({
        internName: intern.fullName,
        taskTitle: task.taskTitle,
        meetingDate: formattedDate,
        startTime: formattedStart,
        endTime: formattedEnd,
        timezone,
        meetLink: meetingResult.meeting.googleMeetLink,
        agenda,
      });
      emailSubject = `Meeting Details: Task Explanation for ${task.taskTitle}`;
    } else {
      emailHtml = templates.firstReviewMeetingTemplate({
        internName: intern.fullName,
        taskTitle: task.taskTitle,
        reviewDate: formattedDate,
        startTime: formattedStart,
        endTime: formattedEnd,
        timezone,
        meetLink: meetingResult.meeting.googleMeetLink,
        submissionDeadline: formattedStart,
        agenda,
      });
      emailSubject = `Review Meeting Scheduled: ${task.taskTitle}`;
    }

    await sendSystemEmail({
      emailType: meetingType === 'explanation' ? 'explanation_meeting' : 'first_review_meeting',
      recipient: intern.email,
      internId: intern._id,
      subject: emailSubject,
      html: emailHtml,
      payloadMetadata: { meetingId: meetingResult.meeting._id },
    });

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled and calendar invitation sent.',
      data: meetingResult.meeting,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update meeting status (e.g. mark completed or cancelled)
 * PATCH /api/meetings/:id/status
 */
const updateMeetingStatus = async (req, res, next) => {
  try {
    const { status, sessionNotes } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    if (status) meeting.status = status;
    if (sessionNotes) meeting.sessionNotes = sessionNotes;
    await meeting.save();

    res.status(200).json({ success: true, message: 'Meeting updated.', data: meeting });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth2 initiation URL
 * GET /api/meetings/oauth-url
 */
const getOauthUrl = (req, res, next) => {
  try {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
      return res.status(400).json({
        success: false,
        message: 'Google OAuth Client ID & Secret are not configured in .env',
      });
    }

    const scopes = ['https://www.googleapis.com/auth/calendar.events'];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });

    res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth2 callback handler
 * GET /api/meetings/oauth2callback
 */
const oauth2Callback = async (req, res, next) => {
  try {
    const { code } = req.query;
    const oauth2Client = getOAuth2Client();

    if (!code || !oauth2Client) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/settings?oauth=failed`);
    }

    const { tokens } = await oauth2Client.getToken(code);
    console.log('[Google OAuth] Obtained refresh token:', tokens.refresh_token ? 'YES' : 'NO');

    // In development or demo, redirect back to Settings with success query
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/settings?oauth=success`);
  } catch (error) {
    console.error('[Google OAuth Callback Error]', error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/settings?oauth=error`);
  }
};

module.exports = {
  getMeetings,
  scheduleMeeting,
  updateMeetingStatus,
  getOauthUrl,
  oauth2Callback,
};
