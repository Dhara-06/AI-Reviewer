/**
 * Professional HTML Email Templates for AI Review Automation System
 */

const baseEmailWrapper = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f6fb; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .email-header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
    .email-header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .email-header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .email-body { padding: 30px 24px; line-height: 1.6; font-size: 15px; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 20px; background-color: #eff6ff; color: #1d4ed8; }
    .details-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
    .details-box table { width: 100%; border-collapse: collapse; }
    .details-box td { padding: 6px 0; }
    .details-box td.label { font-weight: 600; color: #64748b; width: 35%; }
    .btn { display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; background: #2563eb; color: #ffffff !important; margin: 15px 0; text-align: center; }
    .btn-success { background: #10b981; }
    .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>AI Intern Training & Review System</h1>
      <p>${title}</p>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated notification from the AI Review Automation System.</p>
      <p>Please do not reply directly to this email unless directed to your mentor.</p>
    </div>
  </div>
</body>
</html>
`;

// 1. Task Allocation
const taskAllocationTemplate = ({ internName, taskTitle, taskDescription, explanationDate, meetLink, portalUrl }) => {
  const content = `
    <p>Dear <strong>${internName}</strong>,</p>
    <p>Welcome! A new technical task has been allocated to you as part of your internship curriculum.</p>
    
    <div class="details-box">
      <table>
        <tr><td class="label">Task Title:</td><td><strong>${taskTitle}</strong></td></tr>
        <tr><td class="label">Description:</td><td>${taskDescription}</td></tr>
        <tr><td class="label">Explanation Session:</td><td>${explanationDate}</td></tr>
      </table>
    </div>

    <p>An interactive AI task-explanation session has been scheduled for you. You can join the session directly via Google Meet or access the AI voice assistant on your intern portal:</p>
    
    <div style="text-align: center;">
      <a href="${meetLink}" class="btn" target="_blank">Join Google Meet Session</a>
      <br/>
      <a href="${portalUrl}" style="color: #2563eb; font-size: 13px; text-decoration: underline;">Open Intern Portal</a>
    </div>

    <p>Best regards,<br/><strong>Internship Mentorship Team</strong></p>
  `;
  return baseEmailWrapper('New Task Allocation', content);
};

// 2. Initial Task Explanation Meeting
const explanationMeetingTemplate = ({ internName, taskTitle, meetingDate, startTime, endTime, timezone, meetLink, agenda }) => {
  const content = `
    <p>Dear <strong>${internName}</strong>,</p>
    <p>Your AI task explanation session has been scheduled. In this session, our AI Training Assistant will guide you through the requirements, technical expectations, and acceptance criteria.</p>

    <div class="details-box">
      <table>
        <tr><td class="label">Task:</td><td><strong>${taskTitle}</strong></td></tr>
        <tr><td class="label">Date:</td><td>${meetingDate}</td></tr>
        <tr><td class="label">Time:</td><td>${startTime} - ${endTime} (${timezone})</td></tr>
        <tr><td class="label">Agenda:</td><td>${agenda || 'Step-by-step task breakdown and Q&A'}</td></tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${meetLink}" class="btn" target="_blank">Join Google Meet</a>
    </div>

    <p><em>Note: You can also use the interactive voice assistant inside your web portal at any time to ask questions regarding this task.</em></p>
  `;
  return baseEmailWrapper('Task Explanation Meeting Details', content);
};

// 3. First Review Meeting
const firstReviewMeetingTemplate = ({ internName, taskTitle, reviewDate, startTime, endTime, timezone, meetLink, submissionDeadline, agenda }) => {
  const content = `
    <p>Dear <strong>${internName}</strong>,</p>
    <p>Your <strong>First Project Review</strong> has been scheduled. Please ensure your project source code is pushed to your GitHub repository before the submission deadline.</p>

    <div class="details-box">
      <table>
        <tr><td class="label">Task:</td><td><strong>${taskTitle}</strong></td></tr>
        <tr><td class="label">Review Date:</td><td>${reviewDate}</td></tr>
        <tr><td class="label">Time:</td><td>${startTime} - ${endTime} (${timezone})</td></tr>
        <tr><td class="label">Submission Deadline:</td><td><strong style="color: #dc2626;">${submissionDeadline}</strong></td></tr>
        <tr><td class="label">Agenda:</td><td>${agenda || 'Code inspection, functional coverage, and architectural review'}</td></tr>
      </table>
    </div>

    <p><strong>Submission Instructions:</strong></p>
    <ul>
      <li>Push all code to your repository with a clear README.md.</li>
      <li>Log in to your Intern Portal and submit the repository URL.</li>
      <li>Ensure repository permissions allow code analysis.</li>
    </ul>

    <div style="text-align: center;">
      <a href="${meetLink}" class="btn" target="_blank">Join Review Meeting</a>
    </div>
  `;
  return baseEmailWrapper('First Review Meeting Scheduled', content);
};

// 4. Submission Confirmation
const submissionConfirmationTemplate = ({ internName, taskTitle, githubRepoUrl, commitSha, submittedAt }) => {
  const content = `
    <p>Dear <strong>${internName}</strong>,</p>
    <p>We have successfully received your project submission for <strong>${taskTitle}</strong>.</p>

    <div class="details-box">
      <table>
        <tr><td class="label">Repository:</td><td><a href="${githubRepoUrl}" target="_blank">${githubRepoUrl}</a></td></tr>
        <tr><td class="label">Commit SHA:</td><td><code>${commitSha || 'Latest main/master'}</code></td></tr>
        <tr><td class="label">Submitted At:</td><td>${submittedAt}</td></tr>
      </table>
    </div>

    <p>Our automated AI code inspection engine is analyzing your implementation against the acceptance criteria. You will receive structured feedback shortly.</p>
  `;
  return baseEmailWrapper('Project Submission Received', content);
};

// 5. Review Feedback
const reviewFeedbackTemplate = ({ internName, taskTitle, reviewStatus, summary, satisfiedCount, missingCount, actionItems, portalUrl }) => {
  const statusColor = reviewStatus === 'completed_pending_approval' ? '#10b981' : reviewStatus === 'ready_for_mentor_review' ? '#3b82f6' : '#f59e0b';
  const content = `
    <p>Dear <strong>${internName}</strong>,</p>
    <p>The automated code inspection and review for <strong>${taskTitle}</strong> is complete.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 15px 0;">
      <p style="margin: 0; font-size: 16px;">Status: <strong style="color: ${statusColor}; text-transform: uppercase;">${reviewStatus.replace(/_/g, ' ')}</strong></p>
      <p style="margin: 8px 0 0; color: #475569;">${summary}</p>
      <div style="margin-top: 10px; font-size: 13px;">
        <span style="color: #16a34a; font-weight: 600;">✓ Requirements Met: ${satisfiedCount}</span> &nbsp;|&nbsp; 
        <span style="color: #dc2626; font-weight: 600;">✗ Action Required: ${missingCount}</span>
      </div>
    </div>

    ${actionItems && actionItems.length > 0 ? `
      <p><strong>Key Improvements Needed:</strong></p>
      <ul>
        ${actionItems.map(item => `<li>${item}</li>`).join('')}
      </ul>
    ` : ''}

    <div style="text-align: center;">
      <a href="${portalUrl}" class="btn" target="_blank">View Detailed Review & Voice Feedback</a>
    </div>
  `;
  return baseEmailWrapper('Project Review & Feedback', content);
};

// 6. Next Review Scheduling
const nextReviewSchedulingTemplate = ({ internName, taskTitle, cycleNumber, meetingDate, startTime, endTime, timezone, meetLink, suggestedActions }) => {
  const content = `
    <p>Dear <strong>${internName}</strong>,</p>
    <p>Based on your latest submission review, <strong>Review Cycle #${cycleNumber}</strong> has been scheduled to evaluate your requested improvements.</p>

    <div class="details-box">
      <table>
        <tr><td class="label">Task:</td><td><strong>${taskTitle}</strong></td></tr>
        <tr><td class="label">Next Review Date:</td><td>${meetingDate}</td></tr>
        <tr><td class="label">Time:</td><td>${startTime} - ${endTime} (${timezone})</td></tr>
      </table>
    </div>

    ${suggestedActions && suggestedActions.length > 0 ? `
      <p><strong>Suggested Action List for Next Review:</strong></p>
      <ul>
        ${suggestedActions.map(action => `<li>${action}</li>`).join('')}
      </ul>
    ` : ''}

    <div style="text-align: center;">
      <a href="${meetLink}" class="btn" target="_blank">Join Next Review Session</a>
    </div>
  `;
  return baseEmailWrapper(`Review Cycle #${cycleNumber} Scheduled`, content);
};

// 7. Meeting Reminder
const meetingReminderTemplate = ({ internName, meetingTitle, startTime, timezone, meetLink, agenda }) => {
  const content = `
    <p>Dear <strong>${internName}</strong>,</p>
    <p>This is a quick reminder that you have an upcoming session starting soon.</p>

    <div class="details-box">
      <table>
        <tr><td class="label">Session:</td><td><strong>${meetingTitle}</strong></td></tr>
        <tr><td class="label">Start Time:</td><td><strong>${startTime} (${timezone})</strong></td></tr>
        <tr><td class="label">Agenda:</td><td>${agenda}</td></tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${meetLink}" class="btn" target="_blank">Click Here to Join Call</a>
    </div>
  `;
  return baseEmailWrapper('Reminder: Upcoming Scheduled Session', content);
};

// 8. Submission Failure Notification
const submissionFailureTemplate = ({ internName, taskTitle, errorMessage, retryUrl }) => {
  const content = `
    <p>Dear <strong>${internName}</strong>,</p>
    <p>We encountered an issue while attempting to analyze your submitted GitHub repository for <strong>${taskTitle}</strong>.</p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 15px 0; color: #991b1b;">
      <p style="margin: 0; font-weight: 600;">Analysis Error Details:</p>
      <p style="margin: 6px 0 0; font-size: 14px;">${errorMessage}</p>
    </div>

    <p><strong>Common causes:</strong></p>
    <ul>
      <li>Repository is set to Private without authorized token access.</li>
      <li>Incorrect repository URL format (expected: https://github.com/username/repo).</li>
      <li>Repository contains no commits or has no standard branch.</li>
    </ul>

    <div style="text-align: center;">
      <a href="${retryUrl}" class="btn" style="background-color: #dc2626;">Update & Retry Submission</a>
    </div>
  `;
  return baseEmailWrapper('Action Required: Submission Analysis Issue', content);
};

// 9. Mentor Escalation
const mentorEscalationTemplate = ({ internName, internEmail, taskTitle, reason, portalUrl }) => {
  const content = `
    <p>Dear Mentor,</p>
    <p>An intern requires your review or intervention in the AI Review Automation System.</p>

    <div class="details-box">
      <table>
        <tr><td class="label">Intern:</td><td>${internName} (${internEmail})</td></tr>
        <tr><td class="label">Task:</td><td><strong>${taskTitle}</strong></td></tr>
        <tr><td class="label">Escalation Reason:</td><td><strong style="color: #dc2626;">${reason}</strong></td></tr>
      </table>
    </div>

    <p>Please log in to the Admin Dashboard to inspect the code analysis, review notes, and approve or guide the next cycle.</p>

    <div style="text-align: center;">
      <a href="${portalUrl}" class="btn">Open Mentor Dashboard</a>
    </div>
  `;
  return baseEmailWrapper('Mentor Action Required: Intern Escalation', content);
};

// 10. Internship Completion Congratulations
const completionCongratulationsTemplate = ({ internName, taskTitle, completionDate, nextSteps }) => {
  const content = `
    <p>Dear <strong>${internName}</strong>,</p>
    <p>🎉 <strong>Heartiest Congratulations!</strong> Your mentor has approved the successful completion of your internship project: <strong>${taskTitle}</strong>.</p>

    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #065f46; margin: 0 0 8px;">Internship Milestone Completed</h3>
      <p style="color: #047857; margin: 0; font-size: 14px;">Completion Date: <strong>${completionDate}</strong></p>
    </div>

    <p>Thank you for your sincere dedication, engineering rigor, and perseverance across each review cycle.</p>

    ${nextSteps ? `
      <p><strong>Approved Next Steps:</strong></p>
      <p>${nextSteps}</p>
    ` : ''}

    <p>We wish you the very best in all your future software engineering endeavors!</p>
    <p>Warm regards,<br/><strong>Internship Evaluation & Mentorship Board</strong></p>
  `;
  return baseEmailWrapper('Congratulations on Completing Your Internship!', content);
};

module.exports = {
  taskAllocationTemplate,
  explanationMeetingTemplate,
  firstReviewMeetingTemplate,
  submissionConfirmationTemplate,
  reviewFeedbackTemplate,
  nextReviewSchedulingTemplate,
  meetingReminderTemplate,
  submissionFailureTemplate,
  mentorEscalationTemplate,
  completionCongratulationsTemplate,
};
