import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const ReviewsList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [mentorNotes, setMentorNotes] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews');
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Failed to fetch reviews.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApproveCompletion = async () => {
    if (!selectedReview) return;

    try {
      setApprovalLoading(true);
      const res = await api.post(`/reviews/${selectedReview._id}/approve`, { mentorNotes });
      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `Internship completion approved! Official congratulations email sent to ${selectedReview.internId?.fullName}.`,
        });
        setShowApprovalModal(false);
        setSelectedReview(null);
        setMentorNotes('');
        fetchReviews();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Failed to approve review.' });
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">AI Project Code Reviews</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Detailed code inspection, requirements coverage analysis, and mentor completion sign-offs.
          </p>
        </div>
      </div>

      {feedback.text && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show d-flex align-items-center gap-2 mb-4`}>
          <i className="bi bi-info-circle-fill"></i>
          <span>{feedback.text}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setFeedback({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Reviews Table */}
      <div className="card card-custom overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th>Intern Details</th>
                <th>Task Assignment</th>
                <th>Cycle #</th>
                <th>Repository & Commit</th>
                <th>Review Status</th>
                <th>Submitted Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading code reviews...
                  </td>
                </tr>
              ) : reviews.length > 0 ? (
                reviews.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="fw-semibold text-dark">{r.internId?.fullName || 'Intern'}</div>
                      <small className="text-muted font-monospace">{r.internId?.internId}</small>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '200px' }} title={r.taskId?.taskTitle}>
                        {r.taskId?.taskTitle || 'Project'}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-secondary rounded-pill">
                        #{r.cycleNumber}
                      </span>
                    </td>
                    <td>
                      <a href={r.githubRepoUrl} target="_blank" rel="noreferrer" className="text-decoration-none">
                        <i className="bi bi-github me-1"></i> {r.githubRepoUrl.split('github.com/')[1] || 'Repository'}
                      </a>
                      <small className="text-muted d-block font-monospace">
                        {r.commitSha ? r.commitSha.substring(0, 7) : 'latest'}
                      </small>
                    </td>
                    <td>
                      <StatusBadge status={r.analysis?.reviewStatus || r.status} />
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          onClick={() => setSelectedReview(r)}
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                        >
                          <i className="bi bi-file-earmark-text me-1"></i> View Report
                        </button>

                        {(r.analysis?.reviewStatus === 'completed_pending_approval' ||
                          r.analysis?.reviewStatus === 'ready_for_mentor_review') &&
                          !r.mentorApproval?.isApproved && (
                            <button
                              onClick={() => {
                                setSelectedReview(r);
                                setShowApprovalModal(true);
                              }}
                              className="btn btn-success btn-sm rounded-pill px-3"
                            >
                              <i className="bi bi-award me-1"></i> Approve
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No project reviews recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detailed Report Modal */}
      {selectedReview && !showApprovalModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold mb-0">
                    AI Review Evaluation: Cycle #{selectedReview.cycleNumber}
                  </h5>
                  <small className="text-muted">
                    Intern: {selectedReview.internId?.fullName} ({selectedReview.internId?.internId})
                  </small>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedReview(null)}></button>
              </div>

              <div className="modal-body p-4">
                {/* Summary Banner */}
                <div className="card p-3 bg-light border mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-dark">Executive Evaluation Summary</span>
                    <StatusBadge status={selectedReview.analysis?.reviewStatus || selectedReview.status} />
                  </div>
                  <p className="text-secondary small mb-0">{selectedReview.analysis?.summary}</p>
                </div>

                {/* Spoken Feedback */}
                {selectedReview.spokenFeedbackSummary && (
                  <div className="card p-3 border-info-subtle bg-info-subtle mb-4">
                    <strong className="text-info-emphasis d-block mb-1 small">
                      <i className="bi bi-chat-quote-fill me-1"></i> Spoken Voice Feedback Script:
                    </strong>
                    <p className="text-dark small mb-0 fst-italic">
                      "{selectedReview.spokenFeedbackSummary}"
                    </p>
                  </div>
                )}

                {/* Satisfied vs Missing Requirements */}
                <div className="row g-3 mb-4 small">
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-success-subtle rounded-3 border border-success-subtle h-100">
                      <strong className="text-success d-block mb-2">
                        ✓ Requirements Satisfied ({(selectedReview.analysis?.requirementsSatisfied || []).length})
                      </strong>
                      <ul className="mb-0 ps-3 text-success-emphasis">
                        {selectedReview.analysis?.requirementsSatisfied?.map((req, i) => (
                          <li key={i} className="mb-1">{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-danger-subtle rounded-3 border border-danger-subtle h-100">
                      <strong className="text-danger d-block mb-2">
                        ✗ Requirements Missing or Incomplete ({(selectedReview.analysis?.requirementsMissing || []).length})
                      </strong>
                      <ul className="mb-0 ps-3 text-danger-emphasis">
                        {selectedReview.analysis?.requirementsMissing?.map((req, i) => (
                          <li key={i} className="mb-1">{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Problems and Suggested Fixes */}
                {selectedReview.analysis?.problemsAndFixes && selectedReview.analysis.problemsAndFixes.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2">Code Inspection Problems & Recommended Fixes</h6>
                    <div className="d-flex flex-column gap-2">
                      {selectedReview.analysis.problemsAndFixes.map((item, idx) => (
                        <div key={idx} className="p-3 rounded border bg-light small">
                          <div className="text-danger fw-semibold mb-1">
                            <i className="bi bi-x-circle me-1"></i> Issue: {item.problem}
                          </div>
                          <div className="text-success mb-1">
                            <i className="bi bi-check-circle me-1"></i> Fix: {item.suggestedFix}
                          </div>
                          {item.file && <small className="text-muted font-monospace">File: {item.file}</small>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Next Steps */}
                {selectedReview.analysis?.recommendedNextSteps && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2">Recommended Next Steps for Next Review Cycle</h6>
                    <ul className="small text-secondary ps-3 mb-0">
                      {selectedReview.analysis.recommendedNextSteps.map((step, idx) => (
                        <li key={idx} className="mb-1">{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Files Inspected */}
                {selectedReview.inspectionDetails?.filesAnalyzed && (
                  <div className="p-3 bg-light rounded border small">
                    <strong className="d-block mb-1 text-dark">
                      Files Inspected Safely ({selectedReview.inspectionDetails.filesAnalyzed.length}):
                    </strong>
                    <div className="d-flex flex-wrap gap-1 font-monospace">
                      {selectedReview.inspectionDetails.filesAnalyzed.map((f, i) => (
                        <span key={i} className="badge bg-white text-dark border">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedReview(null)}>Close</button>
                {selectedReview.analysis?.reviewStatus === 'completed_pending_approval' && !selectedReview.mentorApproval?.isApproved && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm px-3"
                    onClick={() => setShowApprovalModal(true)}
                  >
                    <i className="bi bi-award me-1"></i> Mentor Approve Completion
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Approval Dialog Modal */}
      {showApprovalModal && selectedReview && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-award-fill me-2"></i> Confirm Internship Completion
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowApprovalModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="small mb-3">
                  You are approving formal completion of <strong>{selectedReview.taskId?.taskTitle}</strong> for intern <strong>{selectedReview.internId?.fullName}</strong>.
                </p>
                <div className="alert alert-info py-2 px-3 small mb-3">
                  <i className="bi bi-info-circle me-1"></i> This will mark the task as <strong>Completed</strong> and automatically send an official congratulatory completion email.
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Mentor Feedback & Approved Next Steps</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="3"
                    placeholder="Provide closing appreciation, feedback, or recommended career next steps..."
                    value={mentorNotes}
                    onChange={(e) => setMentorNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowApprovalModal(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-success btn-sm px-4"
                  onClick={handleApproveCompletion}
                  disabled={approvalLoading}
                >
                  {approvalLoading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-check2-circle me-1"></i>}
                  Confirm & Send Congratulations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
