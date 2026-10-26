import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionExpired = new URLSearchParams(location.search).get('sessionExpired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, role);
      if (res.success) {
        if (res.user.role === 'admin' || res.user.role === 'superadmin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/intern/portal');
        }
      } else {
        setError(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass, demoRole) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setRole(demoRole);
    setError('');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card card-custom p-4 p-md-5 shadow-lg">
            {/* Header */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  color: '#fff',
                  fontSize: '1.8rem',
                }}
              >
                <i className="bi bi-robot"></i>
              </div>
              <h2 className="fw-bold mb-1">Welcome Back</h2>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                AI Review & Intern Lifecycle Automation System
              </p>
            </div>

            {sessionExpired && (
              <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2">
                <i className="bi bi-clock-history"></i>
                <span>Your session expired. Please sign in again.</span>
              </div>
            )}

            {error && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-circle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Role Toggle Tabs */}
            <div className="d-flex p-1 bg-light rounded-pill mb-4 border">
              <button
                type="button"
                className={`btn btn-sm flex-fill rounded-pill fw-semibold ${
                  role === 'admin' ? 'btn-primary-custom shadow-sm' : 'text-secondary'
                }`}
                onClick={() => setRole('admin')}
              >
                <i className="bi bi-shield-lock me-1"></i> Admin / Mentor
              </button>
              <button
                type="button"
                className={`btn btn-sm flex-fill rounded-pill fw-semibold ${
                  role === 'intern' ? 'btn-primary-custom shadow-sm' : 'text-secondary'
                }`}
                onClick={() => setRole('intern')}
              >
                <i className="bi bi-person-workspace me-1"></i> Intern Portal
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0"
                    placeholder={role === 'admin' ? 'admin@example.com' : 'intern@example.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-secondary">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-key text-muted"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary-custom w-100 py-2 fw-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-1"></i> Sign In to {role === 'admin' ? 'Admin Portal' : 'Intern Portal'}
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins for Instant Testing */}
            <div className="mt-4 pt-3 border-top">
              <span className="text-muted fw-bold d-block text-center mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                QUICK DEMO ACCOUNTS (CLICK TO AUTO-FILL)
              </span>
              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center"
                  onClick={() => fillDemo('admin@example.com', 'Admin@12345', 'admin')}
                >
                  <span><i className="bi bi-shield-check text-primary me-2"></i>Admin: <strong>admin@example.com</strong></span>
                  <span className="badge bg-primary-subtle text-primary">Admin@12345</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center"
                  onClick={() => fillDemo('alex.johnson@example.com', 'Intern@123', 'intern')}
                >
                  <span><i className="bi bi-person text-success me-2"></i>Intern: <strong>Alex (Explanation)</strong></span>
                  <span className="badge bg-success-subtle text-success">Intern@123</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center"
                  onClick={() => fillDemo('priya.sharma@example.com', 'Intern@123', 'intern')}
                >
                  <span><i className="bi bi-person text-warning me-2"></i>Intern: <strong>Priya (Review Cycle 2)</strong></span>
                  <span className="badge bg-warning-subtle text-warning">Intern@123</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
