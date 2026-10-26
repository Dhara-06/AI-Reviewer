const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const isMock = process.env.MOCK_EMAIL === 'true' || !process.env.SMTP_USER;

  if (isMock) {
    console.log('[Mailer] Operating in MOCK mode. Emails will be logged to MongoDB EmailLog without network SMTP calls.');
    transporter = {
      isMock: true,
      sendMail: async (options) => {
        console.log(`[Mock Mailer] Sending simulated email to: ${options.to} | Subject: "${options.subject}"`);
        return {
          messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@aireviewsystem.local`,
          accepted: [options.to],
          rejected: [],
          response: '250 Mock email accepted',
        };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

module.exports = { getTransporter };
