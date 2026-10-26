import React, { useState, useEffect } from 'react';
import api from '../services/api';

const EmailLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/email-logs?page=${page}&limit=12&status=${statusFilter}&emailType=${typeFilter}&search=${search}`
      );
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, typeFilter]);

  return (
    <div className="container-fluid py-4 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Email Delivery Audit Logs</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Full tracking of automated task allocations, meeting notifications, review feedbacks, and completion emails.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card card-custom p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search recipient or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button onClick={() => { setPage(1); fetchLogs(); }} className="btn btn-primary btn-sm">Search</button>
            </div>
          </div>

          <div className="col-12 col-md-3">
            <select
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Email Types</option>
              <option value="task_allocation">Task Allocation</option>
              <option value="explanation_meeting">Explanation Meeting</option>
              <option value="first_review_meeting">First Review Meeting</option>
              <option value="submission_confirmation">Submission Confirmation</option>
              <option value="review_feedback">Review Feedback</option>
              <option value="next_review_scheduling">Next Review Scheduling</option>
              <option value="meeting_reminder">Meeting Reminder</option>
              <option value="submission_failure">Submission Failure</option>
              <option value="mentor_escalation">Mentor Escalation</option>
              <option value="completion_congratulations">Completion Congratulations</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent (Live SMTP)</option>
              <option value="mock_delivered">Mock Delivered</option>
              <option value="failed">Delivery Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card card-custom overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th>Recipient</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th className="text-end">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading email audit logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <div className="fw-semibold text-dark">{log.recipient}</div>
                      {log.internId && <small className="text-muted">{log.internId.fullName}</small>}
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border text-capitalize" style={{ fontSize: '0.72rem' }}>
                        {log.emailType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="text-truncate d-inline-block" style={{ maxWidth: '300px' }} title={log.subject}>
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
                    <td>
                      <small className="text-muted">
                        {new Date(log.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                      </small>
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <i className="bi bi-eye"></i> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No email audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <button
              className="btn btn-outline-secondary btn-sm rounded-pill"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="small text-muted">Page {page} of {totalPages}</span>
            <button
              className="btn btn-outline-secondary btn-sm rounded-pill"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Email Log Audit Detail</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedLog(null)}></button>
              </div>
              <div className="modal-body p-4 small">
                <div className="mb-2"><strong>Type:</strong> {selectedLog.emailType}</div>
                <div className="mb-2"><strong>Recipient:</strong> {selectedLog.recipient}</div>
                <div className="mb-2"><strong>Subject:</strong> {selectedLog.subject}</div>
                <div className="mb-2"><strong>Status:</strong> {selectedLog.status}</div>
                <div className="mb-2"><strong>Message ID:</strong> <code>{selectedLog.messageId || 'N/A'}</code></div>
                {selectedLog.errorDetails && (
                  <div className="alert alert-danger py-2 px-3 small my-2">
                    <strong>Error:</strong> {selectedLog.errorDetails}
                  </div>
                )}
                <div className="mt-3">
                  <strong>Sanitized Metadata:</strong>
                  <pre className="p-3 bg-light rounded border mt-1" style={{ fontSize: '0.75rem' }}>
                    {JSON.stringify(selectedLog.payloadMetadata || {}, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogs;
