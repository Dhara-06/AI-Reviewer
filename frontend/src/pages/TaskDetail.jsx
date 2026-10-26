import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const TaskDetail = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tasks/${id}`);
        if (res.data.success) {
          setTask(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch task details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger d-inline-block px-4 py-3">{error || 'Task not found'}</div>
        <div><Link to="/admin/tasks" className="btn btn-primary btn-sm rounded-pill mt-2">Back to Tasks</Link></div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-2">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link to="/admin/dashboard">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link to="/admin/tasks">Tasks</Link></li>
          <li className="breadcrumb-item active">{task.taskTitle}</li>
        </ol>
      </nav>

      {/* Task Header */}
      <div className="card card-custom p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <h2 className="fw-bold mb-0">{task.taskTitle}</h2>
              <StatusBadge status={task.status} />
              {task.isAiGenerated && (
                <span className="badge bg-purple-subtle text-purple border" style={{ fontSize: '0.7rem' }}>
                  AI Generated
                </span>
              )}
            </div>
            <p className="text-secondary mb-0">{task.taskDescription}</p>
          </div>

          {task.assignedInternId && (
            <div className="p-3 bg-light rounded-3 border">
              <span className="text-muted d-block small">Allocated Intern</span>
              <Link to={`/admin/interns/${task.assignedInternId._id}`} className="fw-bold text-dark text-decoration-none">
                {task.assignedInternId.fullName} ({task.assignedInternId.internId})
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Business Problem & Requirements */}
        <div className="col-12 col-lg-7">
          <div className="card card-custom p-4 mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-briefcase text-primary"></i> Business Context & Problem
            </h5>
            <p className="text-secondary small mb-0">
              {task.businessProblem || 'Standard full-stack software module delivery.'}
            </p>
          </div>

          <div className="card card-custom p-4 mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-card-checklist text-primary"></i> Technical Requirements
            </h5>
            <ul className="small text-secondary ps-3 mb-0">
              {task.actualRequirements?.map((req, idx) => (
                <li key={idx} className="mb-2"><strong>Req {idx + 1}:</strong> {req}</li>
              ))}
            </ul>
          </div>

          {task.functionalRequirements && task.functionalRequirements.length > 0 && (
            <div className="card card-custom p-4 mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-cpu text-info"></i> Functional Specifications
              </h5>
              <ul className="small text-secondary ps-3 mb-0">
                {task.functionalRequirements.map((freq, idx) => (
                  <li key={idx} className="mb-1">{freq}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Implementation Plan */}
          {task.stepByStepPlan && task.stepByStepPlan.length > 0 && (
            <div className="card card-custom p-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-signpost-split text-warning"></i> Step-by-Step Implementation Plan
              </h5>
              <div className="d-flex flex-column gap-2">
                {task.stepByStepPlan.map((step, idx) => (
                  <div key={idx} className="p-3 bg-light rounded-3 d-flex align-items-start gap-3 small">
                    <span className="step-number">{idx + 1}</span>
                    <span className="text-secondary">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acceptance Criteria & Instructions */}
        <div className="col-12 col-lg-5">
          <div className="card card-custom p-4 mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-check2-square text-success"></i> Acceptance Criteria
            </h5>
            <ul className="small text-secondary ps-3 mb-0">
              {task.acceptanceCriteria?.map((crit, idx) => (
                <li key={idx} className="mb-2 text-success">
                  <span className="text-dark"><strong>AC-{idx + 1}:</strong> {crit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card card-custom p-4 mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-tools text-secondary"></i> Suggested Technologies
            </h5>
            <div className="d-flex flex-wrap gap-2">
              {task.suggestedTechnologies?.map((tech, idx) => (
                <span key={idx} className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="card card-custom p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-send text-primary"></i> Submission Guidelines
            </h5>
            <p className="text-secondary small mb-3">
              {task.submissionInstructions}
            </p>
            <div className="p-3 bg-light rounded-3 small">
              <strong className="text-dark d-block mb-1">Review Schedule:</strong>
              <span className="text-muted">{task.reviewSchedule}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
