const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_review_system', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    // Don't crash immediately so tests can report clearly
    console.warn('[MongoDB] Please ensure MongoDB service is running (e.g. `sc.exe start mongodb` or `mongod`).');
  }
};

module.exports = connectDB;
