import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExamCatalogPage from './pages/ExamCatalogPage';
import ExamDetailPage from './pages/ExamDetailPage';
import ExamInterfacePage from './pages/ExamInterfacePage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ExamManagement from './pages/ExamManagement';
import QuestionManagement from './pages/QuestionManagement';
import BulkQuestionUploadPage from './pages/BulkQuestionUploadPage';
import EnhancedBulkUploadPage from './pages/EnhancedBulkUploadPage';
import CaseStudyManagement from './pages/CaseStudyManagement';

// Component to handle content wrapper
function AppContent() {
  const location = useLocation();
  
  // Pages that don't need navbar spacing (full-screen pages)
  const noNavbarSpacingPages = [
    '/login',
    '/register'
  ];
  
  // Pages that need special handling for exam interface
  const examInterfacePages = location.pathname.includes('/take/');
  
  // Determine the appropriate wrapper class
  const getWrapperClass = () => {
    if (noNavbarSpacingPages.includes(location.pathname)) {
      return 'no-navbar-spacing';
    }
    if (examInterfacePages) {
      return 'no-navbar-spacing'; // Exam interface handles its own layout
    }
    return ''; // No wrapper class needed - using body padding instead
  };
  
  const shouldShowSpacer = !noNavbarSpacingPages.includes(location.pathname) && !examInterfacePages;
  
  return (
    <div className="App">
      <Navbar />
      {shouldShowSpacer && <div className="navbar-spacer"></div>}
      <div className={getWrapperClass()}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/exams" element={<PrivateRoute><ExamCatalogPage /></PrivateRoute>} />
          <Route path="/exams/:examId" element={<PrivateRoute><ExamDetailPage /></PrivateRoute>} />
          <Route path="/exams/:examId/take/:attemptId" element={<PrivateRoute><ExamInterfacePage /></PrivateRoute>} />
          <Route path="/results/:attemptId" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/exams" element={<AdminRoute><ExamManagement /></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><QuestionManagement /></AdminRoute>} />
          <Route path="/admin/questions/bulk-upload" element={<AdminRoute><BulkQuestionUploadPage /></AdminRoute>} />
          <Route path="/admin/questions/enhanced-bulk-upload" element={<AdminRoute><EnhancedBulkUploadPage /></AdminRoute>} />
          <Route path="/admin/case-studies" element={<AdminRoute><CaseStudyManagement /></AdminRoute>} />
          
          {/* Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
