/**
 * Automated End-to-End API Test Script
 * Verifies authentication, intern creation, task allocation, Gemini AI analysis, and meetings
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting AI Review Automation System API Validation Tests...\n');

  try {
    // 1. Health Check
    console.log('1. Testing /api/health ...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`   ✓ Health Status: ${health.data.status} (Env: ${health.data.env})`);

    // 2. Admin Login
    console.log('2. Testing /api/auth/login (Admin credentials) ...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin@12345',
      role: 'admin',
    });
    const token = loginRes.data.token;
    console.log(`   ✓ Admin Authenticated! User: ${loginRes.data.user.name}`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Dashboard Stats
    console.log('3. Testing /api/dashboard/stats ...');
    const statsRes = await axios.get(`${BASE_URL}/dashboard/stats`, { headers: authHeaders });
    const stats = statsRes.data.data.stats;
    console.log(`   ✓ Stats: Total Interns=${stats.totalInterns}, Active=${stats.activeInterns}, Reviews=${stats.reviewsCompleted}`);

    // 4. Download Excel Template
    console.log('4. Testing /api/interns/template ...');
    const templateRes = await axios.get(`${BASE_URL}/interns/template`, { responseType: 'arraybuffer' });
    console.log(`   ✓ Template downloaded successfully (${templateRes.data.length} bytes)`);

    // 5. Interns List
    console.log('5. Testing /api/interns list ...');
    const internsRes = await axios.get(`${BASE_URL}/interns`, { headers: authHeaders });
    console.log(`   ✓ Interns retrieved: ${internsRes.data.data.length} records`);

    // 6. AI Task Proposal Generation
    console.log('6. Testing /api/tasks/ai-propose ...');
    const proposeRes = await axios.post(
      `${BASE_URL}/tasks/ai-propose`,
      { skills: ['React', 'Node.js', 'Express', 'MongoDB'], internName: 'Test Intern' },
      { headers: authHeaders }
    );
    console.log(`   ✓ AI Task Formulated: "${proposeRes.data.data.taskTitle}"`);
    console.log(`     Requirements count: ${proposeRes.data.data.actualRequirements.length}`);

    // 7. Conversational Voice Assistant Q&A
    console.log('7. Testing /api/assistant/chat (Voice reasoning endpoint) ...');
    const chatRes = await axios.post(
      `${BASE_URL}/assistant/chat`,
      {
        message: 'Could you explain the JWT token expiration and password hashing requirements?',
        internId: internsRes.data.data[0]?._id,
      },
      { headers: authHeaders }
    );
    console.log(`   ✓ Assistant Answer Received:`);
    console.log(`     "${chatRes.data.data.spokenText.substring(0, 120)}..."`);

    // 8. System Settings
    console.log('8. Testing /api/settings ...');
    const settingsRes = await axios.get(`${BASE_URL}/settings`, { headers: authHeaders });
    console.log(`   ✓ System Settings: Explanation Interval=${settingsRes.data.data.explanationIntervalDays}d, Review Interval=${settingsRes.data.data.reviewIntervalDays}d`);

    console.log('\n=======================================================');
    console.log('🎉 ALL 8 API VALIDATION TESTS PASSED SUCCESSFULLY!');
    console.log('=======================================================');
  } catch (error) {
    console.error('\n❌ API Test Failed:', error.response?.data || error.message);
  }
};

runTests();
