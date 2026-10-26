import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-auto py-3 bg-white border-top">
      <div className="container-fluid px-4 text-center text-muted" style={{ fontSize: '0.82rem' }}>
        <span>AI-Powered Intern Task Allocation, Voice Review & Feedback Automation System</span>
        <span className="mx-2">•</span>
        <span>Node.js + Express + React + MongoDB</span>
        <span className="mx-2">•</span>
        <span className="text-primary fw-semibold">Google Gemini & Google Meet Integrated</span>
      </div>
    </footer>
  );
};

export default Footer;
