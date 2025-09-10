import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { CitizenRoute, ResponderRoute, HospitalRoute } from './components/ProtectedRoute';
import { PageSpinner } from './components/Spinner';

// Pages
import LoginPage from './pages/LoginPage';
import CitizenSOSPage from './pages/citizen/CitizenSOSPage';
import CitizenTrackingPage from './pages/citizen/CitizenTrackingPage';
import ResponderDashboardPage from './pages/responder/ResponderDashboardPage';
import ResponderIncidentPage from './pages/responder/ResponderIncidentPage';
import HospitalDashboardPage from './pages/hospital/HospitalDashboardPage';
import HospitalResourcePage from './pages/hospital/HospitalResourcePage';

// Error and fallback components
const UnauthorizedPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl text-red-500 mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go Back
      </button>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl text-gray-400 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-4">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/login"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go to Login
      </a>
    </div>
  </div>
);

// Home redirect component
const HomeRedirect = () => {
  const role = localStorage.getItem('guardiannet_role');
  const token = localStorage.getItem('guardiannet_token');
  const user = localStorage.getItem('guardiannet_user');
  
  // Check if all required auth data exists
  if (!token || !role || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on role
  switch (role) {
    case 'citizen':
      return <Navigate to="/citizen/sos" replace />;
    case 'responder':
      return <Navigate to="/responder/dashboard" replace />;
    case 'hospital':
      return <Navigate to="/hospital/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Home redirect */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Citizen routes */}
            <Route path="/citizen/sos" element={
              <CitizenRoute>
                <CitizenSOSPage />
              </CitizenRoute>
            } />
            <Route path="/citizen/tracking" element={
              <CitizenRoute>
                <CitizenTrackingPage />
              </CitizenRoute>
            } />
            
            {/* Responder routes */}
            <Route path="/responder/dashboard" element={
              <ResponderRoute>
                <ResponderDashboardPage />
              </ResponderRoute>
            } />
            <Route path="/responder/incident/:incidentId" element={
              <ResponderRoute>
                <ResponderIncidentPage />
              </ResponderRoute>
            } />
            
            {/* Hospital routes */}
            <Route path="/hospital/dashboard" element={
              <HospitalRoute>
                <HospitalDashboardPage />
              </HospitalRoute>
            } />
            <Route path="/hospital/resources" element={
              <HospitalRoute>
                <HospitalResourcePage />
              </HospitalRoute>
            } />
            
            {/* Catch all route for 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
