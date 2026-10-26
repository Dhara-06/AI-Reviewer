const xlsx = require('xlsx');

const REQUIRED_COLUMNS = [
  'internId',
  'fullName',
  'email',
  'skills',
  'internshipStartDate',
  'internshipEndDate',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseAndValidateExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('The uploaded Excel workbook contains no readable sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The uploaded sheet is empty. Please add intern records.');
  }

  const validRows = [];
  const invalidRows = [];
  const seenInternIds = new Set();
  const seenEmails = new Set();

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const errors = [];

    REQUIRED_COLUMNS.forEach((col) => {
      if (!row[col] || String(row[col]).trim() === '') {
        errors.push(`Missing required field: "${col}"`);
      }
    });

    const internId = String(row.internId || '').trim();
    const email = String(row.email || '').trim().toLowerCase();

    if (internId) {
      if (seenInternIds.has(internId)) {
        errors.push(`Duplicate internId "${internId}" in file`);
      } else {
        seenInternIds.add(internId);
      }
    }

    if (email) {
      if (!EMAIL_REGEX.test(email)) {
        errors.push(`Invalid email format: "${email}"`);
      } else if (seenEmails.has(email)) {
        errors.push(`Duplicate email "${email}" in file`);
      } else {
        seenEmails.add(email);
      }
    }

    let startDate = null;
    let endDate = null;

    if (row.internshipStartDate) {
      startDate = new Date(row.internshipStartDate);
      if (isNaN(startDate.getTime())) {
        errors.push(`Invalid start date format: "${row.internshipStartDate}"`);
      }
    }

    if (row.internshipEndDate) {
      endDate = new Date(row.internshipEndDate);
      if (isNaN(endDate.getTime())) {
        errors.push(`Invalid end date format: "${row.internshipEndDate}"`);
      }
    }

    if (startDate && endDate && startDate > endDate) {
      errors.push('internshipStartDate cannot be after internshipEndDate');
    }

    const skills = typeof row.skills === 'string'
      ? row.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const actualRequirements = typeof row.actualRequirements === 'string'
      ? row.actualRequirements.split(/[|;]/).map((r) => r.trim()).filter(Boolean)
      : [];

    const acceptanceCriteria = typeof row.acceptanceCriteria === 'string'
      ? row.acceptanceCriteria.split(/[|;]/).map((a) => a.trim()).filter(Boolean)
      : [];

    const parsedData = {
      internId,
      fullName: String(row.fullName || '').trim(),
      email,
      skills,
      internshipStartDate: startDate,
      internshipEndDate: endDate,
      taskTitle: String(row.taskTitle || '').trim(),
      taskDescription: String(row.taskDescription || '').trim(),
      actualRequirements,
      acceptanceCriteria,
      githubUsername: String(row.githubUsername || '').trim(),
      mentorEmail: String(row.mentorEmail || '').trim().toLowerCase(),
    };

    if (errors.length > 0) {
      invalidRows.push({ rowNumber, data: parsedData, errors });
    } else {
      validRows.push({ rowNumber, data: parsedData });
    }
  });

  return {
    totalRows: rawRows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows,
  };
};

const generateSampleTemplate = () => {
  const sampleData = [
    {
      internId: 'INT-2026-001',
      fullName: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      skills: 'JavaScript, React, Node.js, Express, MongoDB',
      internshipStartDate: '2026-11-01',
      internshipEndDate: '2026-12-31',
      taskTitle: 'Build User Authentication and Profile REST API',
      taskDescription: 'Implement secure JWT authentication, password hashing with bcrypt, and profile management.',
      actualRequirements: 'POST /auth/register with bcrypt | POST /auth/login returning JWT | GET /profile with auth middleware | PUT /profile update',
      acceptanceCriteria: 'Passwords stored securely hashed | JWT token expires in 24 hours | 400 error on duplicate email | GitHub repo has setup instructions',
      githubUsername: 'alexj-dev',
      mentorEmail: 'mentor@example.com',
    },
    {
      internId: 'INT-2026-002',
      fullName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      skills: 'Python, FastAPI, PostgreSQL, Docker, Git',
      internshipStartDate: '2026-11-05',
      internshipEndDate: '2027-01-05',
      taskTitle: 'Product Catalog Microservice with Search',
      taskDescription: 'Create a fast asynchronous product catalog with search, price filters, and pagination.',
      actualRequirements: 'CRUD endpoints for products | Asynchronous database queries | Pydantic request models | Query filters for category and price',
      acceptanceCriteria: 'All endpoints documented via Swagger UI | Response time under 100ms | Unit test suite passing',
      githubUsername: 'priyasharma-code',
      mentorEmail: 'mentor@example.com',
    },
  ];

  const worksheet = xlsx.utils.json_to_sheet(sampleData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Interns_Template');

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 28 },
    { wch: 35 },
    { wch: 20 },
    { wch: 20 },
    { wch: 35 },
    { wch: 45 },
    { wch: 55 },
    { wch: 55 },
    { wch: 20 },
    { wch: 28 },
  ];

  return xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
};

module.exports = {
  parseAndValidateExcel,
  generateSampleTemplate,
};
