import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import InternsList from './pages/InternsList';
import InternDetail from './pages/InternDetail';
import ImportInterns from './pages/ImportInterns';
import TasksList from './pages/TasksList';
import TaskDetail from './pages/TaskDetail';
import MeetingsList from './pages/MeetingsList';
import ReviewsList from './pages/ReviewsList';
import EmailLogs from './pages/EmailLogs';
import Settings from './pages/Settings';
import InternPortal from './pages/InternPortal';
import VoiceAssistant from './pages/VoiceAssistant';
import VoiceReview from './pages/VoiceReview';

// Admin Layout wrapper providing Sidebar
const AdminLayout = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <main className="flex-grow-1 overflow-auto" style={{ minHeight: 'calc(100vh - 65px)' }}>
        <ProtectedRoute allowedRoles={['admin', 'superadmin']} />
      </main>
    </div>
  );
};

// Root index redirector
const RootRedirect = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/intern/portal" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />

          <div className="flex-grow-1">
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Protected Admin Routes */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/interns" element={<InternsList />} />
                <Route path="/admin/interns/import" element={<ImportInterns />} />
                <Route path="/admin/interns/:id" element={<InternDetail />} />
                <Route path="/admin/tasks" element={<TasksList />} />
                <Route path="/admin/tasks/:id" element={<TaskDetail />} />
                <Route path="/admin/meetings" element={<MeetingsList />} />
                <Route path="/admin/reviews" element={<ReviewsList />} />
                <Route path="/admin/email-logs" element={<EmailLogs />} />
                <Route path="/admin/settings" element={<Settings />} />
              </Route>

              {/* Protected Intern Routes */}
              <Route element={<ProtectedRoute allowedRoles={['intern', 'admin']} />}>
                <Route path="/intern/portal" element={<InternPortal />} />
                <Route path="/intern/assistant" element={<VoiceAssistant />} />
                <Route path="/intern/reviews" element={<VoiceReview />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
