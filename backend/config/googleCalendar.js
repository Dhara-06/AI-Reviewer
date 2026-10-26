const { google } = require('googleapis');

let oauth2Client = null;

const getOAuth2Client = () => {
  if (oauth2Client) return oauth2Client;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/meetings/oauth2callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  return oauth2Client;
};

const getCalendarApi = () => {
  const auth = getOAuth2Client();
  if (!auth) return null;
  return google.calendar({ version: 'v3', auth });
};

module.exports = {
  getOAuth2Client,
  getCalendarApi,
};
