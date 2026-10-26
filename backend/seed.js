require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Intern = require('./models/Intern');
const Task = require('./models/Task');
const Meeting = require('./models/Meeting');
const Review = require('./models/Review');
const EmailLog = require('./models/EmailLog');
const SystemSetting = require('./models/SystemSetting');
const { generateMockMeetLink } = require('./services/calendarService');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_review_system';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing collections for fresh seed...');
    await Promise.all([
      Admin.deleteMany({}),
      Intern.deleteMany({}),
      Task.deleteMany({}),
      Meeting.deleteMany({}),
      Review.deleteMany({}),
      EmailLog.deleteMany({}),
      SystemSetting.deleteMany({}),
    ]);

    // 1. Create Default Admin
    console.log('Creating Admin account...');
    const admin = await Admin.create({
      fullName: 'System Administrator',
      email: 'admin@example.com',
      password: 'Admin@12345',
      role: 'admin',
    });
    console.log(`✓ Admin created: ${admin.email} (Password: Admin@12345)`);

    // 2. Create Global Settings
    console.log('Creating Default System Settings...');
    await SystemSetting.create({
      key: 'global_settings',
      explanationIntervalDays: 2,
      reviewIntervalDays: 2,
      reminderHoursBeforeMeeting: 4,
      autoScheduleNextReview: true,
      mentorNotificationEmail: 'mentor@example.com',
      timezone: 'Asia/Kolkata',
      mockServices: {
        gemini: true,
        calendar: true,
        email: true,
      },
    });

    // 3. Create Intern 1: Alex Johnson (Task Allocated, Explanation Scheduled)
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
      submissionInstructions: 'Push full code to GitHub and submit repository URL on the Intern Portal.',
      assignedInternId: intern1._id,
      status: 'allocated',
    });

    intern1.currentTaskId = task1._id;
    await intern1.save();

    // Schedule Explanation Meeting for Alex
    const now = new Date();
    const explanationDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    explanationDate.setHours(11, 0, 0, 0);

    const meet1 = await Meeting.create({
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

    // 4. Create Intern 2: Priya Sharma (Review Submitted, Needs Changes)
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
      functionalRequirements: [
        'Asynchronous database operations using asyncpg or Motor',
        'Automatic OpenAPI documentation accessible at /docs',
        'Docker containerization with Dockerfile and compose file',
      ],
      suggestedTechnologies: ['Python 3.11', 'FastAPI', 'PostgreSQL', 'Docker', 'pytest'],
      stepByStepPlan: [
        'Step 1: Setup FastAPI project with Poetry/Pipenv',
        'Step 2: Model database schemas and migrations',
        'Step 3: Implement filtered query repository logic',
        'Step 4: Add Pydantic response models and documentation tags',
        'Step 5: Write unit tests with pytest',
      ],
      expectedOutput: 'FastAPI microservice running in Docker with comprehensive test coverage.',
      acceptanceCriteria: [
        'All endpoints return correct status codes (200, 201, 404, 422)',
        'Query filter latency under 100ms on 10,000 mock records',
        'Dockerfile builds cleanly',
      ],
      assignedInternId: intern2._id,
      status: 'changes_requested',
    });

    intern2.currentTaskId = task2._id;
    await intern2.save();

    // Create Review Cycle 1 for Priya
    const review2 = await Review.create({
      internId: intern2._id,
      taskId: task2._id,
      cycleNumber: 1,
      githubRepoUrl: 'https://github.com/priyasharma-code/product-catalog-fastapi',
      commitSha: '8f7d3a2b1c0e9d4f',
      projectDescription: 'FastAPI product catalog with async PostgreSQL queries and Docker configuration.',
      submissionNotes: 'Implemented search and category filters. Need to add price bounds validation.',
      deploymentUrl: 'https://product-catalog-demo.onrender.com',
      inspectionDetails: {
        filesAnalyzed: ['main.py', 'routers/products.py', 'schemas/product.py', 'README.md', 'tests/test_products.py'],
        totalFiles: 14,
        isLiveAnalysis: false,
        repositoryMetadata: {
          stars: 3,
          forks: 1,
          defaultBranch: 'main',
          lastUpdated: new Date(),
        },
      },
      analysis: {
        summary: 'Solid implementation of FastAPI routes and schemas. Code structure is clean, but pagination defaults and boundary validation for negative prices are missing.',
        requirementsSatisfied: [
          'CRUD endpoints for products with Pydantic validation',
          'Search query parameter matching product title and description',
          'Filter by category',
        ],
        requirementsPartiallySatisfied: [
          'Filter by price range (missing validation for negative prices)',
        ],
        requirementsMissing: [
          'Pagination parameters (limit and skip) need maximum bounds to prevent memory denial-of-service',
          'Unit test coverage for price filter edge cases',
        ],
        evidence: [
          'main.py: FastAPI app initialized with CORS middleware',
          'routers/products.py: GET /products handles category filtering but lacks max limit clamp',
        ],
        strengths: [
          'Clean type annotations with Pydantic v2',
          'Comprehensive README with Docker setup steps',
          'Proper asynchronous route handlers',
        ],
        problemsAndFixes: [
          {
            problem: 'Price query parameters allow negative numbers',
            suggestedFix: 'Use Query(..., ge=0) in FastAPI parameter definition',
            file: 'routers/products.py',
          },
          {
            problem: 'Limit parameter allows arbitrarily high values',
            suggestedFix: 'Set Query(10, le=100) to cap max page size',
            file: 'routers/products.py',
          },
        ],
        recommendedNextSteps: [
          'Add ge=0 constraint to min_price and max_price',
          'Enforce max limit=100 on pagination queries',
          'Add unit tests in test_products.py verifying invalid price queries return 422',
        ],
        suggestedTestCases: [
          'GET /products?min_price=-10 -> should return 422 Unprocessable Entity',
          'GET /products?limit=500 -> should return 422 or clamp to 100',
        ],
        reviewStatus: 'needs_changes',
      },
      spokenFeedbackSummary: 'Hello Priya, I reviewed your FastAPI product catalog repository. Your architecture and Pydantic schemas are very well organized. However, we found that query filters allow negative prices and pagination lacks an upper bound. Please add validation constraints and prepare for our next review.',
      status: 'changes_requested',
    });

    // Schedule Next Review Cycle for Priya
    const nextReviewDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    nextReviewDate.setHours(15, 30, 0, 0);

    const meet2 = await Meeting.create({
      meetingType: 'subsequent_review',
      internId: intern2._id,
      taskId: task2._id,
      title: `Review Cycle #2: ${task2.taskTitle}`,
      agenda: 'Evaluate price bounds validation, pagination clamps, and updated unit test suite.',
      scheduledDate: nextReviewDate,
      startTime: nextReviewDate,
      endTime: new Date(nextReviewDate.getTime() + 45 * 60 * 1000),
      timezone: 'Asia/Kolkata',
      googleEventId: 'mock-event-002',
      googleMeetLink: generateMockMeetLink(),
      status: 'scheduled',
      cycleNumber: 2,
    });

    // 5. Create Intern 3: David Chen (Ready for Mentor Review / Completed Pending Approval)
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
        'GitHub repository includes automated component tests',
      ],
      assignedInternId: intern3._id,
      status: 'completed_pending_approval',
    });

    intern3.currentTaskId = task3._id;
    await intern3.save();

    // Review for David
    await Review.create({
      internId: intern3._id,
      taskId: task3._id,
      cycleNumber: 2,
      githubRepoUrl: 'https://github.com/davidchen-ui/react-kanban-board',
      commitSha: '3a1f9e8d7c6b5a4',
      projectDescription: 'Completed responsive Kanban board with full persistence and unit tests.',
      inspectionDetails: {
        filesAnalyzed: ['src/App.jsx', 'src/components/KanbanBoard.jsx', 'src/components/TaskCard.jsx', 'src/hooks/useLocalStorage.js', 'README.md'],
        totalFiles: 18,
        isLiveAnalysis: false,
      },
      analysis: {
        summary: 'Exceptional work. All functional requirements and acceptance criteria have been rigorously met. Unit tests pass with 94% coverage. Ready for final mentor approval.',
        requirementsSatisfied: [
          'Columns for Todo, In-Progress, and Done',
          'Add, edit, delete tasks with title and priority',
          'Filter tasks by priority and tag',
          'Responsive UI using Bootstrap 5',
          'Persist board state in browser localStorage',
        ],
        requirementsPartiallySatisfied: [],
        requirementsMissing: [],
        evidence: [
          'src/hooks/useLocalStorage.js: Implements resilient synchronization with localStorage',
          'src/components/KanbanBoard.jsx: Clean drag-and-drop state transitions with touch support',
        ],
        strengths: [
          'High test coverage with Vitest and React Testing Library',
          'Polished responsive UI with custom CSS transitions',
          'Clean accessibility attributes on interactive elements',
        ],
        problemsAndFixes: [],
        recommendedNextSteps: ['Submit for formal mentor sign-off'],
        suggestedTestCases: ['All tests passing'],
        reviewStatus: 'completed_pending_approval',
      },
      spokenFeedbackSummary: 'Hello David, congratulations! Your updated submission for the Kanban Board satisfies every single acceptance criterion with great test coverage. Your project has been submitted for final mentor approval.',
      status: 'ready_for_mentor_review',
    });

    // 6. Seed Sample Email Logs
    console.log('Seeding sample Email Logs...');
    await EmailLog.create([
      {
        emailType: 'task_allocation',
        recipient: 'alex.johnson@example.com',
        internId: intern1._id,
        subject: `Internship Task Allocation: ${task1.taskTitle}`,
        status: 'mock_delivered',
        messageId: 'mock-mail-001',
        attempts: 1,
      },
      {
        emailType: 'first_review_meeting',
        recipient: 'priya.sharma@example.com',
        internId: intern2._id,
        subject: `First Review Meeting Scheduled: ${task2.taskTitle}`,
        status: 'mock_delivered',
        messageId: 'mock-mail-002',
        attempts: 1,
      },
      {
        emailType: 'review_feedback',
        recipient: 'priya.sharma@example.com',
        internId: intern2._id,
        subject: `Review Feedback: ${task2.taskTitle} (Cycle #1)`,
        status: 'mock_delivered',
        messageId: 'mock-mail-003',
        attempts: 1,
      },
      {
        emailType: 'next_review_scheduling',
        recipient: 'priya.sharma@example.com',
        internId: intern2._id,
        subject: `Review Cycle #2 Scheduled: ${task2.taskTitle}`,
        status: 'mock_delivered',
        messageId: 'mock-mail-004',
        attempts: 1,
      },
    ]);

    console.log('=======================================================');
    console.log('🎉 Seed Completed Successfully!');
    console.log('-------------------------------------------------------');
    console.log('Admin Login:');
    console.log('  Email:    admin@example.com');
    console.log('  Password: Admin@12345');
    console.log('Intern Logins (Password: Intern@123):');
    console.log('  1. alex.johnson@example.com  (INT-2026-001) - Explanation Pending');
    console.log('  2. priya.sharma@example.com  (INT-2026-002) - Review Cycle 2 (Needs Changes)');
    console.log('  3. david.chen@example.com    (INT-2026-003) - Completed Pending Mentor Approval');
    console.log('=======================================================');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedData();
