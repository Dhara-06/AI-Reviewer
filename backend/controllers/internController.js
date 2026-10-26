const Intern = require('../models/Intern');
const Task = require('../models/Task');
const SystemSetting = require('../models/SystemSetting');
const { parseAndValidateExcel, generateSampleTemplate } = require('../services/excelService');
const { proposeTaskForIntern } = require('../services/geminiService');
const { scheduleGoogleMeetSession } = require('../services/calendarService');
const { sendSystemEmail, templates } = require('../services/emailService');

/**
 * Download sample Excel template (.xlsx)
 * GET /api/interns/template
 */
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

/**
 * Upload and parse Excel spreadsheet, import records and trigger initial task allocation
 * POST /api/interns/import
 */
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

    // Fetch system settings for interval defaults
    const settings = (await SystemSetting.findOne({ key: 'global_settings' })) || {
      explanationIntervalDays: 2,
      timezone: 'Asia/Kolkata',
    };

    for (const item of validRows) {
      const data = item.data;

      // Check if intern with email or internId already exists
      let intern = await Intern.findOne({
        $or: [{ email: data.email }, { internId: data.internId }],
      });

      if (intern) {
        skipped.push({
          internId: data.internId,
          email: data.email,
          reason: 'Intern with this ID or Email already exists in database.',
        });
        continue;
      }

      // Create new Intern record
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

      // Prepare task: either from Excel columns or AI proposed
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
        // AI proposed task
        const aiProposal = await proposeTaskForIntern(data.skills, data.fullName);
        taskData = {
          ...aiProposal,
          assignedInternId: intern._id,
        };
      }

      const task = await Task.create(taskData);
      intern.currentTaskId = task._id;
      await intern.save();

      // Schedule initial explanation meeting (default +2 days)
      const daysToAdd = settings.explanationIntervalDays || 2;
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + daysToAdd);
      scheduledDate.setHours(11, 0, 0, 0); // 11:00 AM

      const startTime = new Date(scheduledDate);
      const endTime = new Date(scheduledDate.getTime() + 45 * 60 * 1000);

      const meetingRes = await scheduleGoogleMeetSession({
        internId: intern._id,
        taskId: task._id,
        meetingType: 'explanation',
        title: `AI Task Explanation: ${task.taskTitle}`,
        agenda: `Introduction to the task, requirements walkthrough, acceptance criteria, and technical Q&A session.`,
        scheduledDate,
        startTime,
        endTime,
        timezone: settings.timezone,
        cycleNumber: 1,
        attendeeEmail: intern.email,
      });

      // Send Task Allocation Email
      const formattedExplanationDate = scheduledDate.toLocaleString('en-US', {
        timeZone: settings.timezone,
        dateStyle: 'full',
        timeStyle: 'short',
      });

      const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
      const emailHtml = templates.taskAllocationTemplate({
        internName: intern.fullName,
        taskTitle: task.taskTitle,
        taskDescription: task.taskDescription,
        explanationDate: formattedExplanationDate,
        meetLink: meetingRes.meeting.googleMeetLink,
        portalUrl,
      });

      await sendSystemEmail({
        emailType: 'task_allocation',
        recipient: intern.email,
        internId: intern._id,
        subject: `Internship Task Allocation & AI Explanation Session: ${task.taskTitle}`,
        html: emailHtml,
        payloadMetadata: { taskId: task._id, meetingId: meetingRes.meeting._id },
      });

      imported.push({
        internId: intern.internId,
        fullName: intern.fullName,
        email: intern.email,
        taskId: task._id,
        taskTitle: task.taskTitle,
        meetLink: meetingRes.meeting.googleMeetLink,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Excel import processed: ${imported.length} imported, ${skipped.length} existing skipped, ${invalidRows.length} invalid.`,
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

/**
 * Get all interns with search, filtering, and pagination
 * GET /api/interns
 */
const getInterns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

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

/**
 * Get single intern details with populated task and meetings
 * GET /api/interns/:id
 */
const getInternById = async (req, res, next) => {
  try {
    const intern = await Intern.findById(req.params.id).populate('currentTaskId');
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    res.status(200).json({
      success: true,
      data: intern,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a single intern manually
 * POST /api/interns
 */
const createIntern = async (req, res, next) => {
  try {
    const {
      internId,
      fullName,
      email,
      skills,
      internshipStartDate,
      internshipEndDate,
      githubUsername,
      mentorEmail,
    } = req.body;

    const existing = await Intern.findOne({
      $or: [{ email: email.toLowerCase() }, { internId: internId.toUpperCase() }],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An intern with this ID or Email already exists.',
      });
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

    res.status(201).json({
      success: true,
      message: 'Intern created successfully.',
      data: intern,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an intern record
 * PUT /api/interns/:id
 */
const updateIntern = async (req, res, next) => {
  try {
    const intern = await Intern.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Intern updated successfully.',
      data: intern,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate or Deactivate an intern
 * PATCH /api/interns/:id/toggle-active
 */
const toggleInternActive = async (req, res, next) => {
  try {
    const intern = await Intern.findById(req.params.id);
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    intern.isActive = !intern.isActive;
    if (!intern.isActive) {
      intern.status = 'inactive';
    } else {
      intern.status = 'active';
    }
    await intern.save();

    res.status(200).json({
      success: true,
      message: `Intern ${intern.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: intern,
    });
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
