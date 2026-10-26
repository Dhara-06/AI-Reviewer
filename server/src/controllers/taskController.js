const Task = require('../models/Task');
const Intern = require('../models/Intern');
const { proposeTaskForIntern } = require('../services/aiService');

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

const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedInternId');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

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

    const proposal = await proposeTaskForIntern({ skills: targetSkills, internName: targetName });
    res.status(200).json({ success: true, message: 'AI task proposed.', data: proposal });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { assignedInternId } = req.body;
    const intern = await Intern.findById(assignedInternId);
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found.' });

    const task = await Task.create(req.body);
    intern.currentTaskId = task._id;
    intern.status = 'task_allocated';
    await intern.save();

    res.status(201).json({ success: true, message: 'Task allocated.', data: task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.status(200).json({ success: true, message: 'Task updated.', data: task });
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
