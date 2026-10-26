import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const InternPortal = () => {
  const { user } = useAuth();
  const [intern, setIntern] = useState(null);
  const [task, setTask] = useState(null);
  const [latestReview, setLatestReview] = useState(null);
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  // Submission Form State
  const [repoUrl, setRepoUrl] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState({ type: '', text: '' });

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const [meRes, reviewsRes, meetingsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get(`/reviews/intern/${user?.id}`),
        api.get(`/meetings?internId=${user?.id}`),
      ]);

      if (meRes.data.success) {
        setIntern(meRes.data.user);
        setTask(meRes.data.user.currentTaskId);
      }
      if (reviewsRes.data.success && reviewsRes.data.data.length > 0) {
        setLatestReview(reviewsRes.data.data[0]); // Sorted desc by cycleNumber
      }
      if (meetingsRes.data.success && meetingsRes.data.data.length > 0) {
        const scheduled = meetingsRes.data.data.find((m) => m.status === 'scheduled');
        setUpcomingMeeting(scheduled || meetingsRes.data.data[0]);
      }
    } catch (err) {
      console.error('Portal load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPortalData();
    }
  }, [user?.id]);

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!repoUrl) {
      setSubmitFeedback({ type: 'danger', text: 'GitHub repository URL is required.' });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitFeedback({ type: '', text: '' });

      const res = await api.post('/submissions', {
        githubRepoUrl: repoUrl,
        projectDescription,
        submissionNotes,
        deploymentUrl,
      });

      if (res.data.success) {
        setSubmitFeedback({
          type: 'success',
          text: 'Project submitted and analyzed successfully by AI inspection engine!',
        });
        setRepoUrl('');
        setProjectDescription('');
        setSubmissionNotes('');
        setDeploymentUrl('');
        fetchPortalData();
      }
    } catch (err) {
      setSubmitFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Submission failed. Please verify your repository is accessible.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const playSpokenSummary = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="card card-custom p-4 mb-4 bg-white border-0 shadow-sm">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h2 className="fw-bold mb-0">Welcome, {intern?.fullName}!</h2>
              <StatusBadge status={intern?.status} />
            </div>
            <p className="text-muted mb-0 small">
              Intern ID: <strong className="font-monospace text-dark">{intern?.internId}</strong> | Assigned Mentor: {intern?.mentorEmail || 'mentor@example.com'}
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link to="/intern/assistant" className="btn btn-primary-custom btn-sm rounded-pill px-4 shadow-sm">
              <i className="bi bi-mic me-1"></i> Open AI Voice Assistant
            </Link>
          </div>
        </div>
      </div>

      {submitFeedback.text && (
        <div className={`alert alert-${submitFeedback.type} alert-dismissible fade show d-flex align-items-center gap-2 mb-4`}>
          <i className="bi bi-info-circle-fill"></i>
          <span>{submitFeedback.text}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setSubmitFeedback({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Two Column Layout: Assigned Task + Upcoming Session */}
      <div className="row g-4 mb-4">
        {/* Assigned Task */}
        <div className="col-12 col-lg-8">
          <div className="card card-custom p-4 h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="text-muted small text-uppercase fw-bold">Current Assigned Task</span>
                <h4 className="fw-bold text-dark mt-1 mb-2">{task?.taskTitle || 'Task Allocation Pending'}</h4>
              </div>
              {task?.status && <StatusBadge status={task.status} />}
            </div>

            <p className="text-secondary small mb-3">{task?.taskDescription}</p>

            {task?.businessProblem && (
              <div className="p-3 bg-light rounded-3 mb-3 small">
                <strong className="text-dark d-block mb-1">Business Context:</strong>
                <span className="text-muted">{task.businessProblem}</span>
              </div>
            )}

            <div className="mb-3">
              <strong className="small text-dark d-block mb-1">Technical Requirements to Satisfy:</strong>
              <ul className="small text-secondary ps-3 mb-0">
                {task?.actualRequirements?.map((req, idx) => (
                  <li key={idx} className="mb-1">{req}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong className="small text-dark d-block mb-1">Acceptance Criteria:</strong>
              <ul className="small text-secondary ps-3 mb-0">
                {task?.acceptanceCriteria?.map((crit, idx) => (
                  <li key={idx} className="mb-1 text-success">✓ {crit}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Upcoming Meeting / Google Meet */}
        <div className="col-12 col-lg-4">
          <div className="card card-custom p-4 h-100 bg-light">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-calendar-event text-primary"></i> Next Scheduled Session
            </h5>

            {upcomingMeeting ? (
              <div>
                <span className="badge bg-primary-subtle text-primary border text-capitalize mb-2" style={{ fontSize: '0.72rem' }}>
                  {upcomingMeeting.meetingType.replace(/_/g, ' ')}
                </span>
                <h6 className="fw-bold text-dark mb-1">{upcomingMeeting.title}</h6>
                <p className="small text-muted mb-2">
                  <i className="bi bi-clock me-1"></i>
                  {new Date(upcomingMeeting.startTime).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>

                {upcomingMeeting.agenda && (
                  <p className="small text-secondary mb-3">
                    <strong>Agenda:</strong> {upcomingMeeting.agenda}
                  </p>
                )}

                {upcomingMeeting.googleMeetLink && (
                  <a
                    href={upcomingMeeting.googleMeetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success btn-sm w-100 rounded-pill py-2 shadow-sm"
                  >
                    <i className="bi bi-camera-video me-2"></i> Join Google Meet Call
                  </a>
                )}
              </div>
            ) : (
              <p className="text-muted small">No upcoming meeting scheduled.</p>
            )}

            <hr className="my-3 text-muted" style={{ opacity: 0.2 }} />

            <div className="text-center">
              <span className="small text-muted d-block mb-2">Need immediate task clarification?</span>
              <Link to="/intern/assistant" className="btn btn-outline-primary btn-sm rounded-pill w-100">
                <i className="bi bi-robot me-1"></i> Talk with AI Voice Assistant
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Project Submission Form */}
      <div className="card card-custom p-4 mb-4">
        <h5 className="fw-bold mb-2 d-flex align-items-center gap-2">
          <i className="bi bi-github text-dark"></i> Submit GitHub Repository for Automated Review
        </h5>
        <p className="text-muted small mb-4">
          Submit your public or authorized repository. Our automated AI engine will safely inspect code files and verify requirement coverage.
        </p>

        <form onSubmit={handleSubmitProject}>
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label small fw-semibold">GitHub Repository URL *</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-link-45deg"></i></span>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://github.com/username/project-repo"
                  required
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">Live Deployment URL (optional)</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://my-app.vercel.app"
                value={deploymentUrl}
                onChange={(e) => setDeploymentUrl(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Project Description</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Brief summary of your architecture, libraries used, and how it addresses requirements..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Submission Notes</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Any special setup instructions, test commands, or known limitations..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="col-12 text-end">
              <button
                type="submit"
                className="btn btn-primary-custom px-4 py-2 rounded-pill fw-semibold shadow-sm"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Inspecting Code with AI...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up me-1"></i> Submit Project for Review
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Latest Review Feedback Panel */}
      {latestReview && (
        <div className="card card-custom p-4 shadow-sm mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h5 className="fw-bold mb-0">Latest Review Feedback (Cycle #{latestReview.cycleNumber})</h5>
              <small className="text-muted">Commit: {latestReview.commitSha?.substring(0, 7) || 'latest'}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <StatusBadge status={latestReview.analysis?.reviewStatus || latestReview.status} />
              {latestReview.spokenFeedbackSummary && (
                <button
                  type="button"
                  onClick={() => playSpokenSummary(latestReview.spokenFeedbackSummary)}
                  className="btn btn-sm btn-outline-primary rounded-pill px-3"
                  title="Speak Feedback Aloud"
                >
                  <i className="bi bi-volume-up-fill me-1"></i> Listen to AI Feedback
                </button>
              )}
            </div>
          </div>

          <div className="p-3 bg-light rounded-3 mb-3 small">
            <strong>Summary: </strong> {latestReview.analysis?.summary}
          </div>

          <div className="row g-3 mb-3 small">
            <div className="col-12 col-md-6">
              <div className="p-3 bg-success-subtle rounded border border-success-subtle h-100">
                <strong className="text-success d-block mb-1">Requirements Satisfied:</strong>
                <ul className="mb-0 ps-3 text-success-emphasis">
                  {latestReview.analysis?.requirementsSatisfied?.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 bg-danger-subtle rounded border border-danger-subtle h-100">
                <strong className="text-danger d-block mb-1">Action Items Needing Improvement:</strong>
                <ul className="mb-0 ps-3 text-danger-emphasis">
                  {latestReview.analysis?.requirementsMissing?.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {latestReview.analysis?.recommendedNextSteps && (
            <div className="small">
              <strong className="d-block mb-1">Recommended Next Steps:</strong>
              <ul className="text-muted ps-3 mb-0">
                {latestReview.analysis.recommendedNextSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InternPortal;
