const { getCalendarApi } = require('../config/googleCalendar');
const Meeting = require('../models/Meeting');

/**
 * Generates a realistic mock Google Meet link with standard format: xxx-yyyy-zzz
 */
const generateMockMeetLink = () => {
  const segment = (len) => Math.random().toString(36).substring(2, 2 + len);
  return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
};

/**
 * Schedule a meeting on Google Calendar with a real Google Meet conference
 * or fallback to mock mode if credentials are unconfigured or MOCK_CALENDAR=true.
 */
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
  // Check for duplicate meeting
  const existingMeeting = await Meeting.findOne({
    internId,
    meetingType,
    cycleNumber,
    status: { $in: ['scheduled', 'rescheduled'] },
  });

  if (existingMeeting) {
    console.log(`[Calendar] Meeting already exists for intern ${internId}, type ${meetingType}, cycle ${cycleNumber}. Returning existing.`);
    return {
      meeting: existingMeeting,
      isDuplicate: true,
    };
  }

  const calendarApi = getCalendarApi();
  const isMock = process.env.MOCK_CALENDAR === 'true' || !calendarApi;

  let googleEventId = '';
  let googleMeetLink = '';

  if (!isMock && calendarApi) {
    try {
      const requestId = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const eventPayload = {
        summary: title,
        description: `${agenda}\n\nAutomated event created by AI Review Automation System.`,
        start: {
          dateTime: new Date(startTime).toISOString(),
          timeZone: timezone,
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
          timeZone: timezone,
        },
        attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const response = await calendarApi.events.insert({
        calendarId: 'primary',
        resource: eventPayload,
        conferenceDataVersion: 1,
      });

      googleEventId = response.data.id || '';
      googleMeetLink = response.data.hangoutLink || (response.data.conferenceData?.entryPoints?.[0]?.uri) || '';

      if (!googleMeetLink) {
        googleMeetLink = generateMockMeetLink();
      }
    } catch (err) {
      console.warn(`[Google Calendar API Warning] Could not insert live event (${err.message}). Falling back to simulation link.`);
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

  return {
    meeting: newMeeting,
    isDuplicate: false,
    isMock,
  };
};

module.exports = {
  scheduleGoogleMeetSession,
  generateMockMeetLink,
};
