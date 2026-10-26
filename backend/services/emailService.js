const { getTransporter } = require('../config/mailer');
const EmailLog = require('../models/EmailLog');
const templates = require('../templates/emailTemplates');

/**
 * Send an email and record its status in the EmailLog collection.
 * Secrets are never saved to EmailLog.
 */
const sendSystemEmail = async ({
  emailType,
  recipient,
  internId = null,
  subject,
  html,
  payloadMetadata = {},
}) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"AI Review System" <noreply@aireviewsystem.com>';

  const sanitizedMetadata = { ...payloadMetadata };
  delete sanitizedMetadata.password;
  delete sanitizedMetadata.token;
  delete sanitizedMetadata.apiKey;

  try {
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      html,
    });

    const isMock = transporter.isMock || false;
    const log = await EmailLog.create({
      emailType,
      recipient,
      internId,
      subject,
      status: isMock ? 'mock_delivered' : 'sent',
      messageId: info.messageId || `gen-${Date.now()}`,
      attempts: 1,
      payloadMetadata: sanitizedMetadata,
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
      payloadMetadata: sanitizedMetadata,
    });

    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSystemEmail,
  templates,
};
