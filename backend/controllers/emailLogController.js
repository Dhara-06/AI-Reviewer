const EmailLog = require('../models/EmailLog');

/**
 * Get email logs with pagination, filtering, and search
 * GET /api/email-logs
 */
const getEmailLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, emailType = '', status = '', search = '' } = req.query;
    const query = {};

    if (emailType) query.emailType = emailType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await EmailLog.countDocuments(query);

    const logs = await EmailLog.find(query)
      .populate('internId', 'internId fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: logs,
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

module.exports = {
  getEmailLogs,
};
