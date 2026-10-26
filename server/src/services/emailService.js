const nodemailer = require('nodemailer');
const config = require('../config/env');
const EmailLog = require('../models/EmailLog');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (config.email.isMock) {
    transporter = {
      isMock: true,
      sendMail: async (options) => ({
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@aireviewsystem.local`,
        accepted: [options.to],
        rejected: [],
        response: '250 Mock email accepted',
      }),
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
};

const sendSystemEmail = async ({
  emailType,
  recipient,
  internId = null,
  subject,
  html,
  payloadMetadata = {},
}) => {
  const mailer = getTransporter();
  const from = config.email.from;

  const sanitized = { ...payloadMetadata };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;

  try {
    const info = await mailer.sendMail({
      from,
      to: recipient,
      subject,
      html,
    });

    const isMock = mailer.isMock || false;
    const log = await EmailLog.create({
      emailType,
      recipient,
      internId,
      subject,
      status: isMock ? 'mock_delivered' : 'sent',
      messageId: info.messageId || `id-${Date.now()}`,
      attempts: 1,
      payloadMetadata: sanitized,
    });

    return { success: true, messageId: info.messageId, logId: log._id, isMock };
  } catch (error) {
    console.error(`[Email Service Error] Failed sending ${emailType} to ${recipient}:`, error.message);
    await EmailLog.create({
      emailType,
      recipient,
      internId,
      subject,
      status: 'failed',
      errorDetails: error.message,
      attempts: 1,
      payloadMetadata: sanitized,
    });
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSystemEmail,
  getTransporter,
};
