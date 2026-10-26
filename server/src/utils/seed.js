const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');
const Intern = require('../models/Intern');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');
const Review = require('../models/Review');
const Submission = require('../models/Submission');
const Conversation = require('../models/Conversation');
const EmailLog = require('../models/EmailLog');
const { generateMockMeetLink } = require('../services/calendarService');

const seedData = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri);

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Intern.deleteMany({}),
      Task.deleteMany({}),
      Meeting.deleteMany({}),
      Review.deleteMany({}),
      Submission.deleteMany({}),
      Conversation.deleteMany({}),
      EmailLog.deleteMany({}),
    ]);

    // 1. Admin Account
    console.log('Creating Admin account...');
    const admin = await User.create({
      fullName: 'System Administrator',
      email: 'admin@example.com',
      password: 'Admin@12345',
      role: 'admin',
    });
    console.log(`✓ Admin created: ${admin.email}`);

    // 2. Intern 1: Alex Johnson
    console.log('Creating sample interns and tasks...');
    const intern1 = await Intern.create({
      internId: 'INT-2026-001',
      fullName: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      skills: ['JavaScript', 'Node.js', 'Express', 'MongoDB', 'React'],
      internshipStartDate: new Date('2026-11-01'),
      internshipEndDate: new Date('2026-12-31'),
      githubUsername: 'alexj-dev',
      mentorEmail: 'mentor@example.com',
      status: 'explanation_scheduled',
    });

    const task1 = await Task.create({
      taskTitle: 'Build User Authentication and Profile REST API',
      taskDescription: 'Implement secure JWT authentication, password hashing with bcrypt, and profile management with input validation.',
      businessProblem: 'The application requires a secure authentication gateway to protect user data and ensure granular role-based authorization.',
      actualRequirements: [
        'POST /auth/register with bcrypt password hashing (min 8 chars, 10 salt rounds)',
        'POST /auth/login issuing JSON Web Token with 24h expiration',
        'GET /profile protected by JWT authentication middleware',
        'PUT /profile allowing updates to name, bio, and phone number',
        'Input validation rejecting invalid emails or empty passwords with HTTP 400',
      ],
      functionalRequirements: [
        'Rate limit login attempts to prevent brute force attacks',
        'Consistent JSON response structure with success, message, and data attributes',
        'Global error handling middleware for uncaught exceptions',
      ],
      suggestedTechnologies: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'jsonwebtoken', 'bcryptjs'],
      stepByStepPlan: [
        'Step 1: Set up project structure and configure environment variables',
        'Step 2: Define User Mongoose schema with email validation and pre-save password hash hook',
        'Step 3: Create auth controller with register and login actions',
        'Step 4: Build JWT verification middleware',
        'Step 5: Write comprehensive API tests and push to GitHub repository with README.md',
      ],
      expectedOutput: 'A tested RESTful API with working register/login flows, JWT protection, and a clean README.',
      acceptanceCriteria: [
        'Passwords never stored in plain text in database',
        'JWT tokens expire and are verified properly',
        'Invalid tokens return HTTP 401 Unauthorized',
        'All endpoints documented in README with sample curl requests',
      ],
      assignedInternId: intern1._id,
      status: 'allocated',
    });

    intern1.currentTaskId = task1._id;
    await intern1.save();

    const now = new Date();
    const explanationDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    explanationDate.setHours(11, 0, 0, 0);

    await Meeting.create({
      meetingType: 'explanation',
      internId: intern1._id,
      taskId: task1._id,
      title: `AI Task Explanation: ${task1.taskTitle}`,
      agenda: 'Overview of requirements, security considerations, and Q&A.',
      scheduledDate: explanationDate,
      startTime: explanationDate,
      endTime: new Date(explanationDate.getTime() + 45 * 60 * 1000),
      timezone: 'Asia/Kolkata',
      googleEventId: 'mock-event-001',
      googleMeetLink: generateMockMeetLink(),
      status: 'scheduled',
      cycleNumber: 1,
    });

    // 3. Intern 2: Priya Sharma (Needs Changes)
    const intern2 = await Intern.create({
      internId: 'INT-2026-002',
      fullName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git'],
      internshipStartDate: new Date('2026-10-15'),
      internshipEndDate: new Date('2026-12-15'),
      githubUsername: 'priyasharma-code',
      mentorEmail: 'mentor@example.com',
      status: 'needs_changes',
    });

    const task2 = await Task.create({
      taskTitle: 'Product Catalog Microservice with Search and Filters',
      taskDescription: 'Create a fast asynchronous product catalog with search, price filters, category filters, and pagination.',
      businessProblem: 'E-commerce users need sub-100ms search latency across thousands of products with dynamic price filters.',
      actualRequirements: [
        'CRUD endpoints for products with Pydantic validation',
        'Search query parameter matching product title and description',
        'Filter by category and price range (min_price, max_price)',
        'Pagination with limit and skip parameters',
        'Unit test suite covering primary query filters',
      ],
      suggestedTechnologies: ['Python 3.11', 'FastAPI', 'PostgreSQL', 'Docker', 'pytest'],
      acceptanceCriteria: [
        'All endpoints return correct status codes (200, 201, 404, 422)',
        'Query filter latency under 100ms on 10,000 mock records',
        'Dockerfile builds cleanly',
      ],
      assignedInternId: intern2._id,
      status: 'needs_changes',
    });

    intern2.currentTaskId = task2._id;
    await intern2.save();

    await Review.create({
      internId: intern2._id,
      taskId: task2._id,
      cycleNumber: 1,
      githubRepoUrl: 'https://github.com/priyasharma-code/product-catalog-fastapi',
      commitSha: '8f7d3a2b1c0e9d4f',
      projectDescription: 'FastAPI product catalog with async PostgreSQL queries.',
      inspectionDetails: {
        filesAnalyzed: ['main.py', 'routers/products.py', 'schemas/product.py', 'README.md'],
        totalFiles: 14,
        isLiveAnalysis: false,
      },
      analysis: {
        summary: 'Solid implementation of FastAPI routes and schemas. Code structure is clean, but pagination defaults and boundary validation for negative prices are missing.',
        requirementsSatisfied: ['CRUD endpoints for products with Pydantic validation', 'Search query parameter'],
        requirementsPartiallySatisfied: ['Filter by price range (missing validation for negative prices)'],
        requirementsMissing: ['Pagination parameter upper bound clamping', 'Unit tests for edge cases'],
        strengths: ['Clean Pydantic schemas', 'Clear README documentation'],
        problemsAndFixes: [{ problem: 'Negative prices allowed', suggestedFix: 'Use Query(..., ge=0)' }],
        recommendedNextSteps: ['Add ge=0 to min_price', 'Enforce max limit=100 on pagination'],
        suggestedTestCases: ['GET /products?min_price=-10 -> should return 422'],
        reviewStatus: 'needs_changes',
      },
      spokenFeedbackSummary: 'Hello Priya, I reviewed your FastAPI product catalog repository. Your architecture and Pydantic schemas are very well organized. However, query filters allow negative prices and pagination lacks an upper bound. Please add validation constraints and prepare for our next review.',
      status: 'changes_requested',
    });

    // 4. Intern 3: David Chen (Ready for Mentor Review)
    const intern3 = await Intern.create({
      internId: 'INT-2026-003',
      fullName: 'David Chen',
      email: 'david.chen@example.com',
      skills: ['React', 'TypeScript', 'CSS', 'Bootstrap', 'REST APIs'],
      internshipStartDate: new Date('2026-10-01'),
      internshipEndDate: new Date('2026-12-01'),
      githubUsername: 'davidchen-ui',
      mentorEmail: 'mentor@example.com',
      status: 'completed_pending_approval',
    });

    const task3 = await Task.create({
      taskTitle: 'Interactive Task Management Kanban Board',
      taskDescription: 'Build a responsive React Kanban board with drag-and-drop task movement, local storage persistence, and filter search.',
      actualRequirements: [
        'Columns for Todo, In-Progress, and Done',
        'Add, edit, delete tasks with title and priority',
        'Filter tasks by priority and tag',
        'Responsive UI using Bootstrap 5',
        'Persist board state in browser localStorage',
      ],
      acceptanceCriteria: [
        'Tasks persist across browser refresh',
        'Smooth drag-and-drop interaction',
        'Zero console errors',
      ],
      assignedInternId: intern3._id,
      status: 'completed_pending_approval',
    });

    intern3.currentTaskId = task3._id;
    await intern3.save();

    await Review.create({
      internId: intern3._id,
      taskId: task3._id,
      cycleNumber: 2,
      githubRepoUrl: 'https://github.com/davidchen-ui/react-kanban-board',
      commitSha: '3a1f9e8d7c6b5a4',
      analysis: {
        summary: 'Exceptional work. All functional requirements and acceptance criteria have been rigorously met. Unit tests pass with 94% coverage. Ready for final mentor approval.',
        requirementsSatisfied: task3.actualRequirements,
        requirementsPartiallySatisfied: [],
        requirementsMissing: [],
        evidence: ['src/hooks/useLocalStorage.js: Resilient persistence', 'src/components/KanbanBoard.jsx: Clean drag and drop'],
        strengths: ['Great test coverage', 'Polished responsive UI'],
        problemsAndFixes: [],
        recommendedNextSteps: ['Submit for formal mentor sign-off'],
        suggestedTestCases: ['All tests passing'],
        reviewStatus: 'completed_pending_approval',
      },
      spokenFeedbackSummary: 'Hello David, congratulations! Your updated submission for the Kanban Board satisfies every single acceptance criterion with great test coverage. Your project has been submitted for final mentor approval.',
      status: 'ready_for_mentor_review',
    });

    // 5. Seed sample conversation for Alex Johnson
    console.log('Seeding initial conversation session...');
    const sessionDate = new Date().toISOString().slice(0, 10);
    const sampleSessionId = `session-${intern1._id}-${sessionDate}`;

    await Conversation.create({
      sessionId: sampleSessionId,
      internId: intern1._id,
      taskId: task1._id,
      messages: [
        {
          role: 'user',
          content: 'Hi! Could you briefly introduce my task?',
          spokenText: 'Hi! Could you briefly introduce my task?',
          timestamp: new Date(Date.now() - 60000),
        },
        {
          role: 'model',
          content: 'Hello Alex! Your assigned task is **Build User Authentication and Profile REST API**. You will implement secure user registration with bcrypt password hashing and JWT token issuance for authentication. Let me know if you would like me to explain any specific requirement!',
          spokenText: 'Hello Alex! Your assigned task is Build User Authentication and Profile REST API. You will implement secure user registration with bcrypt password hashing and JWT token issuance for authentication. Let me know if you would like me to explain any specific requirement!',
          timestamp: new Date(Date.now() - 30000),
        },
      ],
    });

    console.log('=======================================================');
    console.log('🎉 Server Database Seed Completed Successfully!');
    console.log('-------------------------------------------------------');
    console.log('Admin Login:');
    console.log('  Email:    admin@example.com');
    console.log('  Password: Admin@12345');
    console.log('Intern Logins (Password: Intern@123):');
    console.log('  1. alex.johnson@example.com  (INT-2026-001)');
    console.log('  2. priya.sharma@example.com  (INT-2026-002)');
    console.log('  3. david.chen@example.com    (INT-2026-003)');
    console.log('=======================================================');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedData();
