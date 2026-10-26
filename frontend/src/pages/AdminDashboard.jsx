import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="mt-3 text-muted fw-semibold">Loading real-time dashboard metrics...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  const statCards = [
    { title: 'Total Interns', value: stats.totalInterns || 0, icon: 'bi-people-fill', color: '#2563eb', bg: '#eff6ff', link: '/admin/interns' },
    { title: 'Active Interns', value: stats.activeInterns || 0, icon: 'bi-person-check-fill', color: '#10b981', bg: '#ecfdf5', link: '/admin/interns?status=active' },
    { title: 'Pending Explanations', value: stats.pendingTaskExplanations || 0, icon: 'bi-mic-fill', color: '#8b5cf6', bg: '#f5f3ff', link: '/admin/meetings?type=explanation' },
    { title: 'Upcoming Meetings', value: stats.upcomingMeetings || 0, icon: 'bi-calendar-event-fill', color: '#06b6d4', bg: '#ecfeff', link: '/admin/meetings' },
    { title: 'Pending Submissions', value: stats.pendingSubmissions || 0, icon: 'bi-clock-history', color: '#f59e0b', bg: '#fffbeb', link: '/admin/interns' },
    { title: 'Reviews Completed', value: stats.reviewsCompleted || 0, icon: 'bi-check-all', color: '#3b82f6', bg: '#eff6ff', link: '/admin/reviews' },
    { title: 'Tasks Needing Changes', value: stats.tasksRequiringImprovement || 0, icon: 'bi-arrow-repeat', color: '#ef4444', bg: '#fef2f2', link: '/admin/reviews?status=needs_changes' },
    { title: 'Completed Internships', value: stats.completedInternships || 0, icon: 'bi-patch-check-fill', color: '#059669', bg: '#ecfdf5', link: '/admin/interns?status=completed' },
  ];

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Page Title & Actions */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Intern Training & Review Dashboard</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Real-time lifecycle monitoring, automated task allocations, and AI-driven code reviews.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/interns/import" className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold">
            <i className="bi bi-file-earmark-arrow-up me-1"></i> Import Excel
          </Link>
          <Link to="/admin/tasks" className="btn btn-primary-custom btn-sm rounded-pill px-3 fw-semibold">
            <i className="bi bi-plus-circle me-1"></i> Allocate Task
          </Link>
          <button onClick={fetchStats} className="btn btn-light btn-sm rounded-pill px-2 border" title="Refresh">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>{error}</span>
        </div>
      )}

      {/* 8 Stats Cards Grid */}
      <div className="row g-3 mb-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-lg-3">
            <Link to={card.link} className="text-decoration-none">
              <div className="card-stat">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      {card.title}
                    </span>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.8rem' }}>
                      {card.value}
                    </h3>
                  </div>
                  <div
                    className="stat-icon"
                    style={{ backgroundColor: card.bg, color: card.color }}
                  >
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Two Column Section: Upcoming Meetings & Recent AI Reviews */}
      <div className="row g-4 mb-4">
        {/* Upcoming Meetings Card */}
        <div className="col-12 col-lg-6">
          <div className="card card-custom h-100 p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-calendar-check text-primary me-2"></i> Upcoming Meetings
              </h5>
              <Link to="/admin/meetings" className="text-decoration-none small fw-semibold">
                View All <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {data?.recentMeetings && data.recentMeetings.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Intern</th>
                      <th>Type</th>
                      <th>Scheduled Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentMeetings.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <div className="fw-semibold text-dark">{m.internId?.fullName || 'Intern'}</div>
                          <small className="text-muted">{m.internId?.internId}</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border text-capitalize">
                            {m.meetingType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          {new Date(m.startTime).toLocaleString('en-US', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td>
                          {m.googleMeetLink && (
                            <a
                              href={m.googleMeetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-success rounded-pill px-2 py-0"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <i className="bi bi-camera-video me-1"></i> Meet
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-calendar-x fs-2 d-block mb-2"></i>
                <p className="mb-0">No upcoming meetings scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent AI Reviews */}
        <div className="col-12 col-lg-6">
          <div className="card card-custom h-100 p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-patch-check text-success me-2"></i> Recent AI Reviews
              </h5>
              <Link to="/admin/reviews" className="text-decoration-none small fw-semibold">
                View All <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {data?.recentReviews && data.recentReviews.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Intern</th>
                      <th>Task</th>
                      <th>Cycle</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentReviews.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div className="fw-semibold text-dark">{r.internId?.fullName || 'Intern'}</div>
                          <small className="text-muted">{r.internId?.internId}</small>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '180px' }} title={r.taskId?.taskTitle}>
                            {r.taskId?.taskTitle || 'Assigned Project'}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill">
                            #{r.cycleNumber}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={r.analysis?.reviewStatus || r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-journal-code fs-2 d-block mb-2"></i>
                <p className="mb-0">No reviews recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Email Activity Feed */}
      <div className="card card-custom p-3 p-md-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-envelope-paper text-info me-2"></i> Automated Email Delivery Activity
          </h5>
          <Link to="/admin/email-logs" className="text-decoration-none small fw-semibold">
            View All Logs <i className="bi bi-arrow-right"></i>
          </Link>
        </div>

        {data?.recentEmailLogs && data.recentEmailLogs.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Recipient</th>
                  <th>Email Type</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEmailLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="fw-semibold text-dark">{log.recipient}</td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {log.emailType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="text-truncate d-inline-block" style={{ maxWidth: '280px' }}>
                        {log.subject}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill ${
                          log.status === 'sent'
                            ? 'bg-success'
                            : log.status === 'mock_delivered'
                            ? 'bg-info text-dark'
                            : 'bg-danger'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-3 text-muted">No emails logged yet.</div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
