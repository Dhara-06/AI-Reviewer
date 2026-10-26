import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isIntern, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center gap-2" to={isAdmin ? '/admin/dashboard' : '/intern/portal'}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.2rem',
            }}
          >
            <i className="bi bi-robot"></i>
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>AI Review System</span>
            <span className="badge bg-primary-subtle text-primary ms-2" style={{ fontSize: '0.68rem', fontWeight: 600 }}>v1.0</span>
          </div>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            {isAuthenticated && isAdmin && (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-secondary fw-semibold" to="/admin/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i> Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-secondary fw-semibold" to="/admin/interns">
                    <i className="bi bi-people me-1"></i> Interns
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-secondary fw-semibold" to="/admin/tasks">
                    <i className="bi bi-list-task me-1"></i> Tasks
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-secondary fw-semibold" to="/admin/meetings">
                    <i className="bi bi-calendar3 me-1"></i> Meetings
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-secondary fw-semibold" to="/admin/reviews">
                    <i className="bi bi-check2-all me-1"></i> Reviews
                  </Link>
                </li>
              </>
            )}

            {isAuthenticated && isIntern && (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-secondary fw-semibold" to="/intern/portal">
                    <i className="bi bi-kanban me-1"></i> Intern Portal
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-secondary fw-semibold" to="/intern/assistant">
                    <i className="bi bi-mic me-1"></i> Voice Assistant
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-secondary fw-semibold" to="/intern/reviews">
                    <i className="bi bi-file-earmark-code me-1"></i> My Reviews
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: isAdmin ? '#eff6ff' : '#ecfdf5',
                      color: isAdmin ? '#2563eb' : '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="d-none d-sm-block text-start lh-1">
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.name}</div>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      <span className={`badge ${isAdmin ? 'bg-primary' : 'bg-success'} rounded-pill`} style={{ fontSize: '0.65rem' }}>
                        {user?.role?.toUpperCase()}
                      </span>
                    </small>
                  </div>
                </div>

                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3">
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary-custom btn-sm rounded-pill px-3">
                <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
