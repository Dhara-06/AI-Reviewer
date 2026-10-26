const Intern = require('../models/Intern');
const Task = require('../models/Task');
const Review = require('../models/Review');
const Meeting = require('../models/Meeting');
const { generateAssistantResponse } = require('../services/geminiService');

/**
 * Conversational endpoint for AI Voice Assistant
 * POST /api/assistant/chat
 */
const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, internId, meetingId } = req.body;
    const targetInternId = req.user.role === 'intern' ? req.user.id : internId;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const intern = await Intern.findById(targetInternId).populate('currentTaskId');
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern record not found.' });
    }

    const task = intern.currentTaskId;
    const latestReview = await Review.findOne({ internId: intern._id }).sort({ cycleNumber: -1 });

    const response = await generateAssistantResponse({
      userMessage: message,
      intern,
      task,
      previousReview: latestReview,
    });

    // If meetingId provided, log the conversation note to meeting
    if (meetingId) {
      const meeting = await Meeting.findById(meetingId);
      if (meeting) {
        const conversationLine = `[${new Date().toLocaleTimeString()}] Intern: ${message}\nAssistant: ${response.spokenText}\n\n`;
        meeting.sessionNotes = (meeting.sessionNotes || '') + conversationLine;
        await meeting.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        answerText: response.answerText,
        spokenText: response.spokenText,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Summarize and close a voice explanation or review session
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
    meeting.sessionSummary = summary || 'Interactive AI voice explanation session concluded successfully.';
    if (notes) {
      meeting.sessionNotes = notes;
    }
    await meeting.save();

    // Update intern status if explanation session
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
  chatWithAssistant,
  saveSessionSummary,
};
