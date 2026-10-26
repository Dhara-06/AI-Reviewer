import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'bi-grid-1x2-fill' },
    { label: 'Interns', path: '/admin/interns', icon: 'bi-people-fill' },
    { label: 'Tasks', path: '/admin/tasks', icon: 'bi-kanban-fill' },
    { label: 'Meetings', path: '/admin/meetings', icon: 'bi-calendar-event-fill' },
    { label: 'Reviews', path: '/admin/reviews', icon: 'bi-patch-check-fill' },
    { label: 'Email Logs', path: '/admin/email-logs', icon: 'bi-envelope-paper-fill' },
    { label: 'Settings', path: '/admin/settings', icon: 'bi-gear-fill' },
  ];

  return (
    <aside className="sidebar d-none d-md-block">
      <div className="mb-4 px-2">
        <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
          Management
        </span>
      </div>

      <nav className="nav flex-column">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <hr className="my-4 text-muted" style={{ opacity: 0.15 }} />

      <div className="px-2">
        <NavLink
          to="/admin/interns/import"
          className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2"
        >
          <i className="bi bi-file-earmark-excel"></i>
          <span>Import Excel</span>
        </NavLink>
      </div>

      <div className="mt-5 p-3 rounded-3 bg-light border text-center">
        <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>AI Automation Mode</small>
        <span className="badge bg-success-subtle text-success border border-success-subtle">
          <i className="bi bi-lightning-charge-fill me-1"></i> Gemini Active
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
