import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const MeetingsList = () => {
  const [meetings, setMeetings] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    internId: '',
    taskId: '',
    meetingType: 'explanation',
    title: '',
    agenda: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    timezone: 'Asia/Kolkata',
  });

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const [meetRes, intRes] = await Promise.all([
        api.get(`/meetings?meetingType=${typeFilter}`),
        api.get('/interns?limit=100'),
      ]);

      if (meetRes.data.success) {
        setMeetings(meetRes.data.data);
      }
      if (intRes.data.success) {
        setInterns(intRes.data.data);
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Failed to load meetings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [typeFilter]);

  const handleInternChange = (e) => {
    const selectedId = e.target.value;
    const selectedIntern = interns.find((i) => i._id === selectedId);
    setFormData({
      ...formData,
      internId: selectedId,
      taskId: selectedIntern?.currentTaskId?._id || '',
      title: selectedIntern ? `Meeting with ${selectedIntern.fullName}` : '',
    });
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/meetings/schedule', formData);
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Meeting scheduled successfully with Google Meet link.' });
        setShowModal(false);
        fetchMeetings();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Failed to schedule meeting.' });
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Calendar & Google Meet Sessions</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Scheduled task explanation walkthroughs and iterative review meetings.
          </p>
        </div>
        <div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary-custom btn-sm rounded-pill px-3">
            <i className="bi bi-calendar-plus me-1"></i> Schedule Custom Session
          </button>
        </div>
      </div>

      {feedback.text && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show d-flex align-items-center gap-2 mb-4`}>
          <i className="bi bi-info-circle-fill"></i>
          <span>{feedback.text}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setFeedback({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Filter */}
      <div className="card card-custom p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Session Types</option>
              <option value="explanation">Task Explanation Sessions</option>
              <option value="first_review">First Reviews</option>
              <option value="subsequent_review">Subsequent Review Cycles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="card card-custom overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th>Session Title & Type</th>
                <th>Intern Details</th>
                <th>Scheduled Time</th>
                <th>Google Meet Link</th>
                <th>Status</th>
                <th>Reminder</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading scheduled meetings...
                  </td>
                </tr>
              ) : meetings.length > 0 ? (
                meetings.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <div className="fw-semibold text-dark">{m.title}</div>
                      <span className="badge bg-light text-secondary border text-capitalize" style={{ fontSize: '0.72rem' }}>
                        {m.meetingType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {m.internId ? (
                        <div>
                          <Link to={`/admin/interns/${m.internId._id}`} className="fw-semibold text-decoration-none">
                            {m.internId.fullName}
                          </Link>
                          <small className="text-muted d-block">{m.internId.email}</small>
                        </div>
                      ) : (
                        <span className="text-muted">Unspecified</span>
                      )}
                    </td>
                    <td>
                      <div>
                        {new Date(m.startTime).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                      <small className="text-muted">{m.timezone}</small>
                    </td>
                    <td>
                      {m.googleMeetLink ? (
                        <a
                          href={m.googleMeetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-success rounded-pill px-3 py-1"
                          style={{ fontSize: '0.78rem' }}
                        >
                          <i className="bi bi-camera-video me-1"></i> Join Call
                        </a>
                      ) : (
                        <span className="text-muted small">No link</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={m.status} />
                    </td>
                    <td>
                      {m.reminderSent ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <i className="bi bi-check2"></i> Sent
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No scheduled sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Custom Session Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Schedule Google Meet Session</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleScheduleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Select Intern *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={formData.internId}
                        onChange={handleInternChange}
                      >
                        <option value="">Choose an intern</option>
                        {interns.map((int) => (
                          <option key={int._id} value={int._id}>
                            {int.fullName} ({int.internId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Session Type *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.meetingType}
                        onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                      >
                        <option value="explanation">Task Explanation Session</option>
                        <option value="first_review">First Project Review</option>
                        <option value="subsequent_review">Subsequent Review Cycle</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Session Title *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        placeholder="e.g. AI Task Explanation: User Auth API"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Agenda</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="Key discussion topics and deliverables walkthrough..."
                        value={formData.agenda}
                        onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Scheduled Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        required
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Start Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        required
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">End Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        required
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-custom btn-sm">Schedule & Generate Google Meet</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsList;
