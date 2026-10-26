const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from server/.env, backend/.env, or root .env
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../backend/.env'),
  path.resolve(__dirname, '../../../.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_review_system',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_ai_review_system_2026_dev_seed',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Gemini AI configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  },

  // GitHub
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },

  // SMTP Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '"AI Intern Review Automation" <noreply@aireviewsystem.com>',
    isMock: process.env.MOCK_EMAIL === 'true' || !process.env.SMTP_USER,
  },

  // Google Calendar / Meet
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/meetings/oauth2callback',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    isMock: process.env.MOCK_CALENDAR === 'true' || !process.env.GOOGLE_CLIENT_ID,
  },

  // Scheduling defaults
  intervals: {
    explanationDays: parseInt(process.env.DEFAULT_EXPLANATION_INTERVAL_DAYS || '2', 10),
    reviewDays: parseInt(process.env.DEFAULT_REVIEW_INTERVAL_DAYS || '2', 10),
    reminderHours: parseInt(process.env.REMINDER_HOURS_BEFORE_MEETING || '4', 10),
    timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  },
};

module.exports = config;
