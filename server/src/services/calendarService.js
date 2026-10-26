const { google } = require('googleapis');
const config = require('../config/env');
const Meeting = require('../models/Meeting');

let oauth2Client = null;

const getOAuth2Client = () => {
  if (oauth2Client) return oauth2Client;
  if (!config.google.clientId || !config.google.clientSecret) {
    return null;
  }

  oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );

  if (config.google.refreshToken) {
    oauth2Client.setCredentials({ refresh_token: config.google.refreshToken });
  }

  return oauth2Client;
};

const getCalendarApi = () => {
  const auth = getOAuth2Client();
  if (!auth) return null;
  return google.calendar({ version: 'v3', auth });
};

const generateMockMeetLink = () => {
  const segment = (len) => Math.random().toString(36).substring(2, 2 + len);
  return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
};

const scheduleGoogleMeetSession = async ({
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
  attendeeEmail,
}) => {
  const existingMeeting = await Meeting.findOne({
    internId,
    meetingType,
    cycleNumber,
    status: { $in: ['scheduled', 'rescheduled'] },
  });

  if (existingMeeting) {
    return { meeting: existingMeeting, isDuplicate: true };
  }

  const calendarApi = getCalendarApi();
  let googleEventId = '';
  let googleMeetLink = '';

  if (!config.google.isMock && calendarApi) {
    try {
      const requestId = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const res = await calendarApi.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        resource: {
          summary: title,
          description: `${agenda}\n\nAutomated event created by AI Review Automation System.`,
          start: { dateTime: new Date(startTime).toISOString(), timeZone: timezone },
          end: { dateTime: new Date(endTime).toISOString(), timeZone: timezone },
          attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
          conferenceData: {
            createRequest: { requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } },
          },
        },
      });

      googleEventId = res.data.id || '';
      googleMeetLink = res.data.hangoutLink || (res.data.conferenceData?.entryPoints?.[0]?.uri) || '';
      if (!googleMeetLink) googleMeetLink = generateMockMeetLink();
    } catch (err) {
      console.warn('[Calendar API Warning]', err.message);
      googleEventId = `mock-cal-${Date.now()}`;
      googleMeetLink = generateMockMeetLink();
    }
  } else {
    googleEventId = `mock-cal-${Date.now()}`;
    googleMeetLink = generateMockMeetLink();
  }

  const newMeeting = await Meeting.create({
    meetingType,
    internId,
    taskId,
    title,
    agenda,
    scheduledDate: new Date(scheduledDate),
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    timezone,
    googleEventId,
    googleMeetLink,
    cycleNumber,
    status: 'scheduled',
  });

  return { meeting: newMeeting, isDuplicate: false };
};

module.exports = {
  scheduleGoogleMeetSession,
  getOAuth2Client,
  generateMockMeetLink,
};
