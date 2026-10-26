const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { startScheduler } = require('./jobs/scheduler');

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Start HTTP Server
    const server = app.listen(config.port, () => {
      console.log('=======================================================');
      console.log(`🚀 AI Review Automation Server Running on Port ${config.port}`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`⚡ Mode: ${config.nodeEnv}`);
      console.log(`🤖 AI Engine: Google Gemini SDK (@google/genai)`);
      console.log(`🔑 Gemini Key Configured: ${config.gemini.apiKey ? 'YES' : 'NO (Add in .env)'}`);
      console.log('=======================================================');

      // 3. Start background job scheduler
      startScheduler();
    });

    process.on('unhandledRejection', (err) => {
      console.error('[Unhandled Rejection]', err.message);
    });

    return server;
  } catch (error) {
    console.error('[Server Startup Fatal Error]', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
