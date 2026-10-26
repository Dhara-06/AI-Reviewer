import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const InternsList = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // New Intern Form State
  const [formData, setFormData] = useState({
    internId: '',
    fullName: '',
    email: '',
    skills: '',
    internshipStartDate: '',
    internshipEndDate: '',
    githubUsername: '',
    mentorEmail: '',
  });

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/interns?page=${page}&limit=10&search=${search}&status=${statusFilter}`);
      if (res.data.success) {
        setInterns(res.data.data);
        setTotalPages(res.data.pagination.pages || 1);
      }
    } catch (err) {
      setFeedbackMsg({ type: 'danger', text: 'Failed to load intern records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInterns();
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/interns/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'interns_upload_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setFeedbackMsg({ type: 'danger', text: 'Failed to download Excel template.' });
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/interns/${id}/toggle-active`);
      if (res.data.success) {
        setFeedbackMsg({ type: 'success', text: res.data.message });
        fetchInterns();
      }
    } catch (err) {
      setFeedbackMsg({ type: 'danger', text: 'Failed to update intern status.' });
    }
  };

  const handleCreateIntern = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/interns', formData);
      if (res.data.success) {
        setFeedbackMsg({ type: 'success', text: 'Intern added successfully.' });
        setShowAddModal(false);
        setFormData({
          internId: '',
          fullName: '',
          email: '',
          skills: '',
          internshipStartDate: '',
          internshipEndDate: '',
          githubUsername: '',
          mentorEmail: '',
        });
        fetchInterns();
      }
    } catch (err) {
      setFeedbackMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to add intern.' });
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Intern Directory</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Manage enrolled interns, active task assignments, and review cycles.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button onClick={handleDownloadTemplate} className="btn btn-outline-secondary btn-sm rounded-pill px-3">
            <i className="bi bi-download me-1"></i> Download .XLSX Template
          </button>
          <Link to="/admin/interns/import" className="btn btn-outline-primary btn-sm rounded-pill px-3">
            <i className="bi bi-file-earmark-excel me-1"></i> Import Spreadsheet
          </Link>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary-custom btn-sm rounded-pill px-3">
            <i className="bi bi-person-plus me-1"></i> Add Intern
          </button>
        </div>
      </div>

      {feedbackMsg.text && (
        <div className={`alert alert-${feedbackMsg.type} alert-dismissible fade show d-flex align-items-center gap-2`} role="alert">
          <i className="bi bi-info-circle-fill"></i>
          <span>{feedbackMsg.text}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setFeedbackMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card card-custom p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name, email, or intern ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Lifecycle Statuses</option>
              <option value="active">Active</option>
              <option value="task_allocated">Task Allocated</option>
              <option value="explanation_scheduled">Explanation Scheduled</option>
              <option value="explanation_completed">Explanation Completed</option>
              <option value="needs_changes">Needs Changes</option>
              <option value="ready_for_mentor_review">Ready for Mentor Review</option>
              <option value="completed_pending_approval">Pending Approval</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="col-12 col-md-3 text-md-end">
            <span className="text-muted small">Showing {interns.length} records</span>
          </div>
        </form>
      </div>

      {/* Interns Table */}
      <div className="card card-custom overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th>Intern ID</th>
                <th>Intern Name & Email</th>
                <th>Skills</th>
                <th>Duration</th>
                <th>Assigned Task</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading intern records...
                  </td>
                </tr>
              ) : interns.length > 0 ? (
                interns.map((intern) => (
                  <tr key={intern._id}>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace fw-bold">
                        {intern.internId}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin/interns/${intern._id}`} className="fw-semibold text-decoration-none text-dark d-block">
                        {intern.fullName}
                      </Link>
                      <small className="text-muted">{intern.email}</small>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '200px' }}>
                        {intern.skills && intern.skills.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.7rem' }}>
                            {s}
                          </span>
                        ))}
                        {intern.skills && intern.skills.length > 3 && (
                          <span className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>
                            +{intern.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <small className="d-block text-muted">
                        {new Date(intern.internshipStartDate).toLocaleDateString()} - {new Date(intern.internshipEndDate).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      {intern.currentTaskId ? (
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '180px' }} title={intern.currentTaskId.taskTitle}>
                          {intern.currentTaskId.taskTitle}
                        </span>
                      ) : (
                        <span className="text-muted fst-italic">None allocated</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={intern.status} />
                    </td>
                    <td className="text-end">
                      <div className="dropdown">
                        <button className="btn btn-light btn-sm rounded-circle border" type="button" data-bs-toggle="dropdown">
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                          <li>
                            <Link className="dropdown-item" to={`/admin/interns/${intern._id}`}>
                              <i className="bi bi-eye text-primary me-2"></i> View Profile & Timeline
                            </Link>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleToggleActive(intern._id, intern.isActive)}
                            >
                              <i className={`bi ${intern.isActive ? 'bi-person-x text-warning' : 'bi-person-check text-success'} me-2`}></i>
                              {intern.isActive ? 'Deactivate Intern' : 'Activate Intern'}
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-people fs-2 d-block mb-2"></i>
                    No interns found matching the criteria.
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

      {/* Add Intern Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Enroll New Intern</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleCreateIntern}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Intern ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. INT-2026-005"
                        required
                        value={formData.internId}
                        onChange={(e) => setFormData({ ...formData, internId: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. John Doe"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="john.doe@example.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Skills (Comma-separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="React, Node.js, Express, MongoDB"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Internship Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.internshipStartDate}
                        onChange={(e) => setFormData({ ...formData, internshipStartDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Internship End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.internshipEndDate}
                        onChange={(e) => setFormData({ ...formData, internshipEndDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">GitHub Username (optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="johndoe-git"
                        value={formData.githubUsername}
                        onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Mentor Email (optional)</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="mentor@example.com"
                        value={formData.mentorEmail}
                        onChange={(e) => setFormData({ ...formData, mentorEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-custom btn-sm">Save & Register Intern</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternsList;
