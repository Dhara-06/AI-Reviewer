import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedInternId, setSelectedInternId] = useState('');
  const [customSkills, setCustomSkills] = useState('');
  const [proposedTask, setProposedTask] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [tasksRes, internsRes] = await Promise.all([
        api.get(`/tasks?status=${statusFilter}&search=${search}`),
        api.get('/interns?limit=100'),
      ]);

      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }
      if (internsRes.data.success) {
        setInterns(internsRes.data.data);
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Failed to fetch tasks.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const handleProposeWithAi = async () => {
    try {
      setAiLoading(true);
      setFeedback({ type: '', text: '' });

      const payload = {
        internId: selectedInternId || undefined,
        skills: customSkills ? customSkills.split(',').map((s) => s.trim()) : undefined,
      };

      const res = await api.post('/tasks/ai-propose', payload);
      if (res.data.success) {
        setProposedTask(res.data.data);
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'AI proposal failed.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveProposedTask = async () => {
    if (!selectedInternId) {
      alert('Please select an intern to assign this proposed task to.');
      return;
    }

    try {
      const payload = {
        ...proposedTask,
        assignedInternId: selectedInternId,
      };

      const res = await api.post('/tasks', payload);
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Task created and allocated successfully.' });
        setShowAiModal(false);
        setProposedTask(null);
        fetchTasks();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Failed to save task.' });
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Intern Tasks & Projects</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Curriculum task assignments, requirements breakdown, and AI generation.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={() => {
              setShowAiModal(true);
              setProposedTask(null);
            }}
            className="btn btn-primary-custom btn-sm rounded-pill px-3 fw-semibold"
          >
            <i className="bi bi-magic me-1"></i> Propose Task with AI (Gemini)
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

      {/* Filter and Search Bar */}
      <div className="card card-custom p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search tasks by title or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button onClick={fetchTasks} className="btn btn-primary btn-sm">Search</button>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="allocated">Allocated</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="ready_for_mentor_review">Ready for Mentor Review</option>
              <option value="completed_pending_approval">Pending Approval</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card card-custom overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th>Task Title</th>
                <th>Assigned Intern</th>
                <th>Requirements</th>
                <th>Acceptance Criteria</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <div className="fw-semibold text-dark">{task.taskTitle}</div>
                      <small className="text-muted d-block text-truncate" style={{ maxWidth: '280px' }}>
                        {task.taskDescription}
                      </small>
                    </td>
                    <td>
                      {task.assignedInternId ? (
                        <div>
                          <Link to={`/admin/interns/${task.assignedInternId._id}`} className="fw-semibold text-decoration-none">
                            {task.assignedInternId.fullName}
                          </Link>
                          <small className="text-muted d-block">{task.assignedInternId.internId}</small>
                        </div>
                      ) : (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {task.actualRequirements?.length || 0} Requirements
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {task.acceptanceCriteria?.length || 0} Criteria
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="text-end">
                      <Link to={`/admin/tasks/${task._id}`} className="btn btn-outline-primary btn-sm rounded-pill px-3">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No tasks found. Click "Propose Task with AI" to generate one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Task Generator Modal */}
      {showAiModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-magic text-primary"></i> AI Task Architecture Generator (Gemini)
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAiModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Target Intern</label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedInternId}
                      onChange={(e) => setSelectedInternId(e.target.value)}
                    >
                      <option value="">Select an intern (optional)</option>
                      {interns.map((int) => (
                        <option key={int._id} value={int._id}>
                          {int.fullName} ({int.internId}) - Skills: {int.skills?.join(', ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Or Enter Skills Profile</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. React, Node.js, Express, MongoDB"
                        value={customSkills}
                        onChange={(e) => setCustomSkills(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleProposeWithAi}
                        className="btn btn-primary"
                        disabled={aiLoading}
                      >
                        {aiLoading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-stars me-1"></i>}
                        Generate Proposal
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Proposal Preview */}
                {proposedTask && (
                  <div className="card p-4 bg-light border">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-bold text-primary mb-1">{proposedTask.taskTitle}</h5>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        AI Formulated
                      </span>
                    </div>

                    <p className="text-secondary small mb-3">{proposedTask.taskDescription}</p>

                    <div className="p-3 bg-white rounded border mb-3 small">
                      <strong className="text-dark d-block mb-1">Business Problem:</strong>
                      <span className="text-secondary">{proposedTask.businessProblem}</span>
                    </div>

                    <div className="row g-3 small mb-3">
                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-white rounded border h-100">
                          <strong className="text-dark d-block mb-2">Technical Requirements:</strong>
                          <ul className="mb-0 ps-3">
                            {proposedTask.actualRequirements?.map((r, i) => (
                              <li key={i} className="mb-1">{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-white rounded border h-100">
                          <strong className="text-dark d-block mb-2">Acceptance Criteria:</strong>
                          <ul className="mb-0 ps-3">
                            {proposedTask.acceptanceCriteria?.map((c, i) => (
                              <li key={i} className="mb-1 text-success">✓ {c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-success btn-sm rounded-pill px-4"
                        onClick={handleSaveProposedTask}
                      >
                        <i className="bi bi-check-lg me-1"></i> Accept & Allocate to Selected Intern
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksList;
