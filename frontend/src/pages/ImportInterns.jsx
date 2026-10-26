import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ImportInterns = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.match(/\.(xlsx|xls)$/i)) {
        setError('Please select an Excel (.xlsx or .xls) file.');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
      setResult(null);
    }
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
      setError('Failed to download Excel template.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an Excel file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/interns/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process Excel file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Breadcrumb & Title */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-1 small">
            <li className="breadcrumb-item"><Link to="/admin/dashboard">Dashboard</Link></li>
            <li className="breadcrumb-item"><Link to="/admin/interns">Interns</Link></li>
            <li className="breadcrumb-item active">Import Excel</li>
          </ol>
        </nav>
        <h2 className="fw-bold mb-1">Batch Import Interns via Excel</h2>
        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
          Upload an Excel spreadsheet to enroll interns, allocate tasks, schedule AI explanation sessions, and send automated emails.
        </p>
      </div>

      <div className="row g-4 mb-4">
        {/* Upload Card */}
        <div className="col-12 col-lg-7">
          <div className="card card-custom p-4">
            <h5 className="fw-bold mb-3">Upload .XLSX Spreadsheet</h5>

            {error && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpload}>
              <div className="border border-2 border-dashed rounded-3 p-5 text-center mb-3 bg-light">
                <i className="bi bi-file-earmark-spreadsheet text-primary display-4 d-block mb-3"></i>
                <h6 className="fw-bold mb-1">Drag and drop your spreadsheet here</h6>
                <p className="text-muted small mb-3">Supports .xlsx and .xls (max 10MB)</p>

                <input
                  type="file"
                  id="excelFileInput"
                  className="d-none"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
                <label htmlFor="excelFileInput" className="btn btn-outline-primary btn-sm rounded-pill px-4">
                  <i className="bi bi-folder2-open me-1"></i> Browse Computer
                </label>

                {file && (
                  <div className="mt-3 p-2 bg-white rounded border d-inline-flex align-items-center gap-2 small">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span className="fw-semibold">{file.name}</span>
                    <span className="text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn btn-link text-decoration-none p-0 small text-secondary"
                >
                  <i className="bi bi-file-earmark-arrow-down me-1"></i> Need format? Download Sample Template
                </button>

                <button
                  type="submit"
                  className="btn btn-primary-custom px-4 rounded-pill"
                  disabled={!file || uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Validating & Importing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up me-1"></i> Process & Import Records
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Required Columns Guide */}
        <div className="col-12 col-lg-5">
          <div className="card card-custom p-4 bg-light">
            <h6 className="fw-bold mb-2">Spreadsheet Specifications</h6>
            <p className="text-muted small mb-3">
              The importer strictly validates required fields and dates without silently discarding invalid records.
            </p>

            <ul className="list-unstyled small mb-0">
              <li className="mb-2">
                <span className="badge bg-primary me-2">internId</span>
                Unique intern code (e.g. <code>INT-2026-001</code>)
              </li>
              <li className="mb-2">
                <span className="badge bg-primary me-2">fullName</span>
                Candidate full name
              </li>
              <li className="mb-2">
                <span className="badge bg-primary me-2">email</span>
                Valid email address for calendar invites
              </li>
              <li className="mb-2">
                <span className="badge bg-primary me-2">skills</span>
                Comma-separated technical skills
              </li>
              <li className="mb-2">
                <span className="badge bg-primary me-2">internshipStartDate</span>
                Format: <code>YYYY-MM-DD</code>
              </li>
              <li className="mb-2">
                <span className="badge bg-primary me-2">internshipEndDate</span>
                Format: <code>YYYY-MM-DD</code>
              </li>
              <li className="mb-2">
                <span className="badge bg-secondary me-2">taskTitle</span>
                (Optional) Specific task or AI generates one
              </li>
              <li className="mb-2">
                <span className="badge bg-secondary me-2">taskDescription</span>
                (Optional) Project details
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Results and Validation Preview */}
      {result && (
        <div className="card card-custom p-4 shadow-sm mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Import Processing Summary</h5>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
              Completed
            </span>
          </div>

          {/* Stats Bar */}
          <div className="row g-3 mb-4 text-center">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="fs-3 fw-bold text-dark">{result.stats?.totalRowsInFile || 0}</div>
                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Rows</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-success-subtle rounded-3 border border-success-subtle">
                <div className="fs-3 fw-bold text-success">{result.stats?.importedCount || 0}</div>
                <small className="text-success text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Successfully Imported</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-warning-subtle rounded-3 border border-warning-subtle">
                <div className="fs-3 fw-bold text-warning">{result.stats?.skippedCount || 0}</div>
                <small className="text-warning text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Existing / Skipped</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-danger-subtle rounded-3 border border-danger-subtle">
                <div className="fs-3 fw-bold text-danger">{result.stats?.invalidCount || 0}</div>
                <small className="text-danger text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Invalid Rows Reported</small>
              </div>
            </div>
          </div>

          {/* Imported Interns List */}
          {result.imported && result.imported.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold text-success mb-2">
                <i className="bi bi-check2-circle me-1"></i> Imported Interns & Allocated Sessions
              </h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Intern ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Allocated Task</th>
                      <th>Scheduled Meet Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.imported.map((item, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold">{item.internId}</td>
                        <td>{item.fullName}</td>
                        <td>{item.email}</td>
                        <td>{item.taskTitle}</td>
                        <td>
                          {item.meetLink && (
                            <a href={item.meetLink} target="_blank" rel="noreferrer" className="text-success text-decoration-none">
                              <i className="bi bi-camera-video me-1"></i> Join Call
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invalid Rows Report */}
          {result.invalidRows && result.invalidRows.length > 0 && (
            <div>
              <h6 className="fw-bold text-danger mb-2">
                <i className="bi bi-exclamation-octagon me-1"></i> Invalid Rows Reported (Not Discarded Silently)
              </h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-danger text-danger">
                    <tr>
                      <th>Row #</th>
                      <th>Identified Data</th>
                      <th>Errors Detected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.invalidRows.map((inv, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold text-danger">Row {inv.rowNumber}</td>
                        <td>
                          {inv.data?.fullName || 'N/A'} ({inv.data?.email || 'No email'}) - ID: {inv.data?.internId || 'N/A'}
                        </td>
                        <td>
                          <ul className="mb-0 text-danger ps-3">
                            {inv.errors.map((err, eIdx) => (
                              <li key={eIdx}>{err}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportInterns;
