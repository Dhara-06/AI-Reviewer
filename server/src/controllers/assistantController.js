const Conversation = require('../models/Conversation');
const Intern = require('../models/Intern');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');
const aiService = require('../services/aiService');

/**
 * Interactive Conversational Assistant API
 * POST /api/assistant/chat
 * 
 * Request body:
 * {
 *   "sessionId": "session-123", // optional, generated if omitted
 *   "message": "What is JWT?",
 *   "internId": "...",          // optional if req.user is intern
 *   "meetingId": "..."          // optional meeting reference
 * }
 */
const chat = async (req, res, next) => {
  try {
    const { message, meetingId } = req.body;
    let { sessionId, internId } = req.body;

    // 1. Authenticate & identify intern
    let intern = null;
    if (req.user?.role === 'intern') {
      intern = await Intern.findById(req.user.id).populate('currentTaskId');
    } else if (internId) {
      intern = await Intern.findById(internId).populate('currentTaskId');
    }

    // If admin is testing without specific internId, use the first intern record
    if (!intern) {
      intern = await Intern.findOne().populate('currentTaskId');
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and cannot be empty.',
      });
    }

    const task = intern ? intern.currentTaskId : null;
    const internDbId = intern ? intern._id : (req.user?.id || 'guest');

    // 2. Resolve or generate sessionId
    if (!sessionId || !sessionId.trim()) {
      sessionId = `session-${internDbId}-${new Date().toISOString().slice(0, 10)}`;
    }

    // 3. Load conversation history isolated by intern and session from MongoDB
    let conversation = await Conversation.findOne({
      sessionId,
      internId: internDbId,
    });

    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        internId: internDbId,
        taskId: task?._id || null,
        messages: [],
        metadata: { meetingId: meetingId || null },
      });
    }

    // Take recent history (last 10 turns) to maintain context without overloading context window
    const recentHistory = conversation.messages.slice(-10);

    // 4 & 5 & 6. Send history + current message to Gemini using @google/genai SDK
    const aiResult = await aiService.chatWithAssistant({
      message: message.trim(),
      history: recentHistory,
      intern,
      task,
    });

    // 7. Save both user message and assistant reply to MongoDB
    await conversation.addMessage('user', message.trim());
    await conversation.addMessage('model', aiResult.reply, aiResult.spokenText);

    // Optional: if meetingId provided, append to meeting sessionNotes
    if (meetingId) {
      const meeting = await Meeting.findById(meetingId);
      if (meeting) {
        meeting.sessionNotes = (meeting.sessionNotes || '') +
          `[${new Date().toLocaleTimeString()}] Intern: ${message}\nAssistant: ${aiResult.spokenText || aiResult.reply}\n\n`;
        await meeting.save();
      }
    }

    // 8. Return response matching required format + existing frontend fields
    return res.status(200).json({
      success: true,
      reply: aiResult.reply,
      sessionId,
      data: {
        answerText: aiResult.reply,
        spokenText: aiResult.spokenText,
      },
    });
  } catch (error) {
    console.error('[Assistant Controller Error]', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'AI Assistant service encountered an error.',
    });
  }
};

/**
 * Retrieve conversation history for a session
 * GET /api/assistant/history/:sessionId
 */
const getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const targetInternId = req.user.role === 'intern' ? req.user.id : req.query.internId;

    const query = { sessionId };
    if (targetInternId) {
      query.internId = targetInternId;
    }

    const conversation = await Conversation.findOne(query);

    return res.status(200).json({
      success: true,
      sessionId,
      messages: conversation ? conversation.messages : [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finalize session and save summary notes
 * POST /api/assistant/session-summary
 */
const saveSessionSummary = async (req, res, next) => {
  try {
    const { meetingId, notes, summary } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    meeting.isVoiceSessionCompleted = true;
    meeting.status = 'completed';
    meeting.sessionSummary = summary || 'AI voice task explanation concluded.';
    if (notes) meeting.sessionNotes = notes;
    await meeting.save();

    if (meeting.meetingType === 'explanation') {
      const intern = await Intern.findById(meeting.internId);
      if (intern && intern.status === 'task_allocated') {
        intern.status = 'explanation_completed';
        await intern.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Session summary saved successfully.',
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chat,
  getHistory,
  saveSessionSummary,
};
