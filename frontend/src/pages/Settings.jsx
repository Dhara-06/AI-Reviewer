import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    explanationIntervalDays: 2,
    reviewIntervalDays: 2,
    reminderHoursBeforeMeeting: 4,
    autoScheduleNextReview: true,
    timezone: 'Asia/Kolkata',
    mentorNotificationEmail: 'mentor@example.com',
    mockServices: { gemini: true, calendar: true, email: true },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        if (res.data.success) {
          setSettings(res.data.data);
        }
      } catch (err) {
        setFeedback({ type: 'danger', text: 'Failed to load system settings.' });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Settings updated successfully.' });
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setOauthLoading(true);
      const res = await api.get('/meetings/oauth-url');
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setFeedback({
        type: 'warning',
        text: 'Google OAuth Client ID & Secret must be configured in backend .env to connect live calendar.',
      });
    } finally {
      setOauthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">System Configuration & Integrations</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Configure task intervals, automatic review cycles, timezone, and Google Calendar OAuth.
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

      <div className="row g-4">
        {/* Main Settings Form */}
        <div className="col-12 col-lg-8">
          <div className="card card-custom p-4">
            <h5 className="fw-bold mb-3">Lifecycle & Review Schedule Intervals</h5>
            <form onSubmit={handleSave}>
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">
                    Task Explanation Meeting Interval (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="form-control"
                    value={settings.explanationIntervalDays}
                    onChange={(e) => setSettings({ ...settings, explanationIntervalDays: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                  <small className="text-muted">Default days between import and initial explanation session (Default: 2)</small>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">
                    Review Cycle Interval (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="form-control"
                    value={settings.reviewIntervalDays}
                    onChange={(e) => setSettings({ ...settings, reviewIntervalDays: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                  <small className="text-muted">Days between reviews when changes are requested (Default: 2)</small>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">
                    Meeting Reminder Alert (Hours Before)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    className="form-control"
                    value={settings.reminderHoursBeforeMeeting}
                    onChange={(e) => setSettings({ ...settings, reminderHoursBeforeMeeting: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                  <small className="text-muted">Hours before session to trigger automated email reminder</small>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Default Timezone</label>
                  <select
                    className="form-select"
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Mentor Escalation Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={settings.mentorNotificationEmail}
                    onChange={(e) => setSettings({ ...settings, mentorNotificationEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12">
                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoScheduleSwitch"
                      checked={settings.autoScheduleNextReview}
                      onChange={(e) => setSettings({ ...settings, autoScheduleNextReview: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="autoScheduleSwitch">
                      Automatically schedule subsequent review cycle after review analysis (if improvements needed)
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary-custom px-4 rounded-pill" disabled={saving}>
                {saving ? 'Saving...' : 'Save Configuration Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Integration Status Card */}
        <div className="col-12 col-lg-4">
          <div className="card card-custom p-4 mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-calendar2-range text-primary"></i> Google Calendar & Meet
            </h6>
            <p className="small text-muted mb-3">
              Connect Google Calendar with OAuth 2.0 to generate genuine Google Meet conferences for meetings.
            </p>

            <button
              onClick={handleConnectGoogle}
              className="btn btn-outline-primary btn-sm w-100 rounded-pill mb-2"
              disabled={oauthLoading}
            >
              <i className="bi bi-google me-2"></i> Connect Google Calendar
            </button>
            <small className="text-muted d-block text-center" style={{ fontSize: '0.75rem' }}>
              Requires Google Client ID & Secret in backend .env
            </small>
          </div>

          <div className="card card-custom p-4 bg-light">
            <h6 className="fw-bold mb-2">Service Operational Modes</h6>
            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex justify-content-between align-items-center p-2 bg-white rounded border">
                <span>Google Gemini AI</span>
                <span className="badge bg-success-subtle text-success">
                  {settings.mockServices?.gemini ? 'Simulation / Mock Ready' : 'Live API'}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 bg-white rounded border">
                <span>Google Meet Conferencing</span>
                <span className="badge bg-success-subtle text-success">
                  {settings.mockServices?.calendar ? 'Real-format Simulation' : 'Live Google API'}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 bg-white rounded border">
                <span>Email Sending (SMTP)</span>
                <span className="badge bg-success-subtle text-success">
                  {settings.mockServices?.email ? 'Logged & Audited' : 'Live SMTP'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
