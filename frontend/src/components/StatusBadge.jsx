import React from 'react';

const statusConfig = {
  active: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: 'bi-check-circle', label: 'Active' },
  task_allocated: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: 'bi-journal-check', label: 'Task Allocated' },
  allocated: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: 'bi-journal-check', label: 'Allocated' },
  explanation_scheduled: { bg: '#fdf4ff', color: '#9333ea', border: '#f0abfc', icon: 'bi-calendar-event', label: 'Explanation Scheduled' },
  explanation_completed: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: 'bi-mic', label: 'Explanation Done' },
  review_pending: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: 'bi-clock-history', label: 'Review Pending' },
  needs_changes: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: 'bi-exclamation-triangle', label: 'Needs Changes' },
  changes_requested: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: 'bi-arrow-repeat', label: 'Changes Requested' },
  ready_for_mentor_review: { bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd', icon: 'bi-person-check', label: 'Ready for Mentor' },
  completed_pending_approval: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', icon: 'bi-shield-check', label: 'Pending Approval' },
  completed: { bg: '#ecfdf5', color: '#047857', border: '#6ee7b7', icon: 'bi-patch-check-fill', label: 'Completed' },
  inactive: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', icon: 'bi-dash-circle', label: 'Inactive' },
  overdue: { bg: '#450a0a', color: '#fecaca', border: '#991b1b', icon: 'bi-alarm-fill', label: 'Overdue' },
  scheduled: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: 'bi-calendar-check', label: 'Scheduled' },
  cancelled: { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', icon: 'bi-x-circle', label: 'Cancelled' },
};

const StatusBadge = ({ status }) => {
  const normalized = String(status || '').toLowerCase();
  const cfg = statusConfig[normalized] || {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#cbd5e1',
    icon: 'bi-dot',
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
  };

  return (
    <span
      className="badge-status"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <i className={`bi ${cfg.icon}`}></i>
      <span>{cfg.label}</span>
    </span>
  );
};

export default StatusBadge;
