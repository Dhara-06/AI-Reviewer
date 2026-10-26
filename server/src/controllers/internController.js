const Intern = require('../models/Intern');
const Task = require('../models/Task');
const { parseAndValidateExcel, generateSampleTemplate } = require('../services/excelService');
const { proposeTaskForIntern } = require('../services/aiService');
const { scheduleGoogleMeetSession } = require('../services/calendarService');
const { sendSystemEmail } = require('../services/emailService');
const config = require('../config/env');

const downloadTemplate = (req, res, next) => {
  try {
    const buffer = generateSampleTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="interns_upload_template.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const importExcel = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file uploaded. Please upload a valid .xlsx or .xls file.',
      });
    }

    const { validRows, invalidRows, totalRows } = parseAndValidateExcel(req.file.buffer);
    const imported = [];
    const skipped = [];

    for (const item of validRows) {
      const data = item.data;

      let intern = await Intern.findOne({
        $or: [{ email: data.email }, { internId: data.internId }],
      });

      if (intern) {
        skipped.push({ internId: data.internId, email: data.email, reason: 'Already exists.' });
        continue;
      }

      intern = await Intern.create({
        internId: data.internId,
        fullName: data.fullName,
        email: data.email,
        skills: data.skills,
        internshipStartDate: data.internshipStartDate,
        internshipEndDate: data.internshipEndDate,
        githubUsername: data.githubUsername,
        mentorEmail: data.mentorEmail,
        status: 'task_allocated',
      });

      let taskData = null;
      if (data.taskTitle && data.taskDescription) {
        taskData = {
          taskTitle: data.taskTitle,
          taskDescription: data.taskDescription,
          actualRequirements: data.actualRequirements.length > 0 ? data.actualRequirements : [data.taskDescription],
          acceptanceCriteria: data.acceptanceCriteria.length > 0 ? data.acceptanceCriteria : ['Code pushed to GitHub with README'],
          assignedInternId: intern._id,
        };
      } else {
        try {
          const aiProposal = await proposeTaskForIntern({ skills: data.skills, internName: data.fullName });
          taskData = { ...aiProposal, assignedInternId: intern._id };
        } catch (err) {
          taskData = {
            taskTitle: `Technical Project for ${data.fullName}`,
            taskDescription: `Implement full-stack module using ${data.skills.join(', ')}`,
            actualRequirements: ['Build core endpoints', 'Include database models', 'Write tests'],
            acceptanceCriteria: ['Pass unit tests', 'Code pushed to GitHub'],
            assignedInternId: intern._id,
          };
        }
      }

      const task = await Task.create(taskData);
      intern.currentTaskId = task._id;
      await intern.save();

      // Schedule explanation meeting (+2 days)
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + (config.intervals.explanationDays || 2));
      scheduledDate.setHours(11, 0, 0, 0);

      const startTime = new Date(scheduledDate);
      const endTime = new Date(scheduledDate.getTime() + 45 * 60 * 1000);

      const meetingRes = await scheduleGoogleMeetSession({
        internId: intern._id,
        taskId: task._id,
        meetingType: 'explanation',
        title: `AI Task Explanation: ${task.taskTitle}`,
        agenda: 'Requirements walkthrough and technical Q&A session.',
        scheduledDate,
        startTime,
        endTime,
        timezone: config.intervals.timezone,
        attendeeEmail: intern.email,
      });

      // Send email
      const html = `
        <h2>Task Allocated: ${task.taskTitle}</h2>
        <p>Dear ${intern.fullName},</p>
        <p>${task.taskDescription}</p>
        <p>Join explanation session: <a href="${meetingRes.meeting.googleMeetLink}">${meetingRes.meeting.googleMeetLink}</a></p>
      `;

      await sendSystemEmail({
        emailType: 'task_allocation',
        recipient: intern.email,
        internId: intern._id,
        subject: `Task Allocation: ${task.taskTitle}`,
        html,
        payloadMetadata: { taskId: task._id },
      });

      imported.push({
        internId: intern.internId,
        fullName: intern.fullName,
        email: intern.email,
        taskTitle: task.taskTitle,
        meetLink: meetingRes.meeting.googleMeetLink,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Excel processed: ${imported.length} imported, ${skipped.length} skipped, ${invalidRows.length} invalid.`,
      stats: {
        totalRowsInFile: totalRows,
        importedCount: imported.length,
        skippedCount: skipped.length,
        invalidCount: invalidRows.length,
      },
      imported,
      skipped,
      invalidRows,
    });
  } catch (error) {
    next(error);
  }
};

const getInterns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { internId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Intern.countDocuments(query);
    const interns = await Intern.find(query)
      .populate('currentTaskId', 'taskTitle status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: interns,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getInternById = async (req, res, next) => {
  try {
    const intern = await Intern.findById(req.params.id).populate('currentTaskId');
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found.' });
    res.status(200).json({ success: true, data: intern });
  } catch (error) {
    next(error);
  }
};

const createIntern = async (req, res, next) => {
  try {
    const { internId, fullName, email, skills, internshipStartDate, internshipEndDate, githubUsername, mentorEmail } = req.body;
    const existing = await Intern.findOne({ $or: [{ email: email.toLowerCase() }, { internId: internId.toUpperCase() }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Intern ID or Email already exists.' });
    }

    const intern = await Intern.create({
      internId,
      fullName,
      email,
      skills: Array.isArray(skills) ? skills : String(skills || '').split(',').map((s) => s.trim()),
      internshipStartDate,
      internshipEndDate,
      githubUsername,
      mentorEmail,
    });

    res.status(201).json({ success: true, message: 'Intern created.', data: intern });
  } catch (error) {
    next(error);
  }
};

const updateIntern = async (req, res, next) => {
  try {
    const intern = await Intern.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found.' });
    res.status(200).json({ success: true, message: 'Intern updated.', data: intern });
  } catch (error) {
    next(error);
  }
};

const toggleInternActive = async (req, res, next) => {
  try {
    const intern = await Intern.findById(req.params.id);
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found.' });

    intern.isActive = !intern.isActive;
    intern.status = intern.isActive ? 'active' : 'inactive';
    await intern.save();

    res.status(200).json({ success: true, message: `Intern ${intern.isActive ? 'activated' : 'deactivated'}.`, data: intern });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadTemplate,
  importExcel,
  getInterns,
  getInternById,
  createIntern,
  updateIntern,
  toggleInternActive,
};
