const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'model', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    spokenText: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    messages: [messageSchema],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index for fast retrieval of intern sessions
conversationSchema.index({ internId: 1, sessionId: 1 });
conversationSchema.index({ sessionId: 1, updatedAt: -1 });

conversationSchema.methods.addMessage = async function (role, content, spokenText = '') {
  // Normalize 'assistant' to 'model' for Gemini SDK compatibility if needed
  const normalizedRole = role === 'assistant' ? 'model' : role;
  this.messages.push({
    role: normalizedRole,
    content,
    spokenText: spokenText || content,
    timestamp: new Date(),
  });
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
