const Task = require('../models/Task');
const Intern = require('../models/Intern');
const { proposeTaskForIntern } = require('../services/geminiService');

/**
 * Get all tasks with filtering
 * GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const { status = '', search = '', internId = '' } = req.query;
    const query = {};

    if (status) query.status = status;
    if (internId) query.assignedInternId = internId;
    if (search) {
      query.$or = [
        { taskTitle: { $regex: search, $options: 'i' } },
        { taskDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignedInternId', 'internId fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single task by ID
 * GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedInternId');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * AI-powered Task Proposal
 * POST /api/tasks/ai-propose
 */
const proposeAiTask = async (req, res, next) => {
  try {
    const { skills, internName, internId } = req.body;

    let targetSkills = skills || [];
    let targetName = internName || 'Intern';

    if (internId) {
      const intern = await Intern.findById(internId);
      if (intern) {
        targetSkills = intern.skills && intern.skills.length > 0 ? intern.skills : targetSkills;
        targetName = intern.fullName || targetName;
      }
    }

    const proposal = await proposeTaskForIntern(targetSkills, targetName);

    res.status(200).json({
      success: true,
      message: 'AI Task proposal generated successfully.',
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task and associate with an intern
 * POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const { assignedInternId } = req.body;

    const intern = await Intern.findById(assignedInternId);
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Assigned intern not found.' });
    }

    const task = await Task.create(req.body);
    intern.currentTaskId = task._id;
    intern.status = 'task_allocated';
    await intern.save();

    res.status(201).json({
      success: true,
      message: 'Task created and allocated to intern.',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 * PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  proposeAiTask,
  createTask,
  updateTask,
};
