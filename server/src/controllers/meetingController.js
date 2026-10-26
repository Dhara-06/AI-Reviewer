const Meeting = require('../models/Meeting');
const Intern = require('../models/Intern');
const Task = require('../models/Task');
const { getOAuth2Client } = require('../services/calendarService');
const { scheduleGoogleMeetSession } = require('../services/calendarService');

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

const scheduleMeeting = async (req, res, next) => {
  try {
    const { internId, taskId, meetingType, title, agenda, scheduledDate, startTime, endTime, timezone } = req.body;
    const intern = await Intern.findById(internId);
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found.' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const result = await scheduleGoogleMeetSession({
      internId,
      taskId,
      meetingType,
      title,
      agenda,
      scheduledDate,
      startTime,
      endTime,
      timezone,
      attendeeEmail: intern.email,
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      message: result.isDuplicate ? 'Meeting already exists.' : 'Meeting scheduled.',
      data: result.meeting,
    });
  } catch (error) {
    next(error);
  }
};

const updateMeetingStatus = async (req, res, next) => {
  try {
    const { status, sessionNotes } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });

    if (status) meeting.status = status;
    if (sessionNotes) meeting.sessionNotes = sessionNotes;
    await meeting.save();

    res.status(200).json({ success: true, message: 'Meeting updated.', data: meeting });
  } catch (error) {
    next(error);
  }
};

const getOauthUrl = (req, res, next) => {
  try {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
      return res.status(400).json({ success: false, message: 'OAuth client not configured.' });
    }
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
    });
    res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

const oauth2Callback = async (req, res, next) => {
  try {
    const { code } = req.query;
    const oauth2Client = getOAuth2Client();
    if (code && oauth2Client) {
      await oauth2Client.getToken(code);
    }
    res.redirect('http://localhost:5173/admin/settings?oauth=success');
  } catch (error) {
    res.redirect('http://localhost:5173/admin/settings?oauth=error');
  }
};

module.exports = {
  getMeetings,
  scheduleMeeting,
  updateMeetingStatus,
  getOauthUrl,
  oauth2Callback,
};
