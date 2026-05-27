import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import RoleSelectionPage from './pages/RoleSelectionPage';
import StudentPage from './pages/StudentPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RoleSelectionPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
