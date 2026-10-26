import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const InternDetail = () => {
  const { id } = useParams();
  const [intern, setIntern] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInternDetails = async () => {
    try {
      setLoading(true);
      const [internRes, meetingsRes, reviewsRes] = await Promise.all([
        api.get(`/interns/${id}`),
        api.get(`/meetings?internId=${id}`),
        api.get(`/reviews/intern/${id}`),
      ]);

      if (internRes.data.success) {
        setIntern(internRes.data.data);
      }
      if (meetingsRes.data.success) {
        setMeetings(meetingsRes.data.data);
      }
      if (reviewsRes.data.success) {
        setReviews(reviewsRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load intern details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error || !intern) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger d-inline-block px-4 py-3">{error || 'Intern not found'}</div>
        <div><Link to="/admin/interns" className="btn btn-primary btn-sm rounded-pill mt-2">Back to Interns</Link></div>
      </div>
    );
  }

  const task = intern.currentTaskId;

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-2">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link to="/admin/dashboard">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link to="/admin/interns">Interns</Link></li>
          <li className="breadcrumb-item active">{intern.fullName}</li>
        </ol>
      </nav>

      {/* Header Profile Banner */}
      <div className="card card-custom p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 700,
              }}
            >
              {intern.fullName.charAt(0)}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h3 className="fw-bold mb-0">{intern.fullName}</h3>
                <StatusBadge status={intern.status} />
              </div>
              <div className="text-muted small mt-1">
                <span className="badge bg-light text-dark border me-2 font-monospace">{intern.internId}</span>
                <i className="bi bi-envelope me-1"></i> {intern.email}
                {intern.githubUsername && (
                  <span className="ms-3">
                    <i className="bi bi-github me-1"></i>
                    <a href={`https://github.com/${intern.githubUsername}`} target="_blank" rel="noreferrer" className="text-decoration-none">
                      {intern.githubUsername}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link to={`/intern/assistant?internId=${intern._id}`} className="btn btn-outline-primary btn-sm rounded-pill px-3">
              <i className="bi bi-mic me-1"></i> Open Voice Assistant
            </Link>
          </div>
        </div>

        <hr className="my-3 text-muted" style={{ opacity: 0.15 }} />

        <div className="row g-3 small">
          <div className="col-6 col-md-3">
            <span className="text-muted d-block">Start Date</span>
            <strong>{new Date(intern.internshipStartDate).toLocaleDateString()}</strong>
          </div>
          <div className="col-6 col-md-3">
            <span className="text-muted d-block">End Date</span>
            <strong>{new Date(intern.internshipEndDate).toLocaleDateString()}</strong>
          </div>
          <div className="col-6 col-md-3">
            <span className="text-muted d-block">Mentor Email</span>
            <strong>{intern.mentorEmail || 'mentor@example.com'}</strong>
          </div>
          <div className="col-6 col-md-3">
            <span className="text-muted d-block">Skills Profile</span>
            <div className="d-flex flex-wrap gap-1 mt-1">
              {intern.skills?.map((s, i) => (
                <span key={i} className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.68rem' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Allocated Task */}
        <div className="col-12 col-lg-7">
          <div className="card card-custom p-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-kanban text-primary"></i> Currently Allocated Task
            </h5>

            {task ? (
              <div>
                <h6 className="fw-bold text-dark mb-1">{task.taskTitle}</h6>
                <p className="text-muted small mb-3">{task.taskDescription}</p>

                {task.businessProblem && (
                  <div className="p-3 bg-light rounded-3 mb-3 small">
                    <strong className="d-block mb-1 text-dark">Business Problem:</strong>
                    <span className="text-secondary">{task.businessProblem}</span>
                  </div>
                )}

                <div className="mb-3">
                  <strong className="small text-dark d-block mb-1">Key Requirements:</strong>
                  <ul className="small text-secondary ps-3 mb-0">
                    {task.actualRequirements?.map((req, idx) => (
                      <li key={idx} className="mb-1">{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong className="small text-dark d-block mb-1">Acceptance Criteria:</strong>
                  <ul className="small text-secondary ps-3 mb-0">
                    {task.acceptanceCriteria?.map((crit, idx) => (
                      <li key={idx} className="mb-1 text-success">✓ {crit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-muted">No task currently allocated.</p>
            )}
          </div>
        </div>

        {/* Scheduled Sessions & Meetings */}
        <div className="col-12 col-lg-5">
          <div className="card card-custom p-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-calendar3 text-info"></i> Meeting Schedule
            </h5>

            {meetings.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {meetings.map((m) => (
                  <div key={m._id} className="p-3 rounded-3 border bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="badge bg-primary-subtle text-primary text-capitalize" style={{ fontSize: '0.72rem' }}>
                        {m.meetingType.replace(/_/g, ' ')}
                      </span>
                      <StatusBadge status={m.status} />
                    </div>
                    <div className="fw-semibold small text-dark">{m.title}</div>
                    <div className="text-muted small mb-2">
                      <i className="bi bi-clock me-1"></i>
                      {new Date(m.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    {m.googleMeetLink && (
                      <a
                        href={m.googleMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-success rounded-pill px-3 py-1"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <i className="bi bi-camera-video me-1"></i> Join Google Meet
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small">No scheduled meetings.</p>
            )}
          </div>
        </div>
      </div>

      {/* Review History */}
      <div className="card card-custom p-4">
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-patch-check text-success"></i> Submission & Review Cycles
        </h5>

        {reviews.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Cycle</th>
                  <th>Submitted Repo</th>
                  <th>Commit SHA</th>
                  <th>Analysis Summary</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <span className="badge bg-secondary rounded-pill">Cycle #{r.cycleNumber}</span>
                    </td>
                    <td>
                      <a href={r.githubRepoUrl} target="_blank" rel="noreferrer" className="text-decoration-none">
                        <i className="bi bi-github me-1"></i> {r.githubRepoUrl.split('github.com/')[1] || r.githubRepoUrl}
                      </a>
                    </td>
                    <td>
                      <code className="small">{r.commitSha ? r.commitSha.substring(0, 7) : 'latest'}</code>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '300px' }} title={r.analysis?.summary}>
                        {r.analysis?.summary || 'Analysis recorded.'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={r.analysis?.reviewStatus || r.status} />
                    </td>
                    <td className="text-muted small">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted mb-0 small">No reviews recorded yet for this intern.</p>
        )}
      </div>
    </div>
  );
};

export default InternDetail;
