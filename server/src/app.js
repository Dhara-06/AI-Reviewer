const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorMiddleware');
const config = require('./config/env');

// Routes
const authRoutes = require('./routes/authRoutes');
const internRoutes = require('./routes/internRoutes');
const taskRoutes = require('./routes/taskRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  config.frontendUrl,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    system: 'AI Review Automation System',
    timestamp: new Date().toISOString(),
    geminiSdk: '@google/genai',
    env: config.nodeEnv,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/interns', internRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Middleware
app.use(errorHandler);

module.exports = app;
