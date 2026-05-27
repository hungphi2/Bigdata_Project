import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/admin.css';
import { useTheme } from '../contexts/ThemeContext';

import { getCourses, checkRegistration } from '../services/api';
import AdminHeader from '../components/admin/AdminHeader';
import DashboardCards from '../components/admin/DashboardCards';
import CourseList from '../components/student/CourseList';
import RegisterForm from '../components/student/RegisterForm';
import ActivityFeed from '../components/admin/ActivityFeed';
import PipelineViz from '../components/admin/PipelineViz';

function AdminDashboard() {
  const { theme } = useTheme();
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [pendingChecks, setPendingChecks] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    successful: 0,
    failed: 0,
    totalQuotaLeft: 0
  });

  const fetchCourses = async () => {
    try {
      const res = await getCourses();
      const data = res.data;
      setCourses(data);
      const totalQuotaLeft = data.reduce((acc, curr) => acc + curr.remaining, 0);
      setStats(prev => ({ ...prev, totalQuotaLeft }));
    } catch (err) {
      console.error('Fetch courses error:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    const interval = setInterval(fetchCourses, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pendingChecks.length === 0) return;
    const interval = setInterval(async () => {
      for (const req of pendingChecks) {
        try {
          const res = await checkRegistration(req.studentId, req.courseId);
          if (res.data && res.data.registered) {
             setPendingChecks(prev => prev.filter(p => !(p.studentId === req.studentId && p.courseId === req.courseId)));
             setActivities(prev => [{
               id: Date.now() + Math.random(),
               studentId: req.studentId,
               courseId: req.courseId,
               status: 'success',
               reason: 'Registered Successfully',
               timestamp: new Date().toISOString()
             }, ...prev]);
             setStats(prev => ({ ...prev, successful: prev.successful + 1 }));
          }
        } catch (error) {
           console.error('Check registration error:', error);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [pendingChecks]);

  const handleRegisterSuccess = (studentId, courseId) => {
    setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
    setPendingChecks(prev => [...prev, { studentId, courseId }]);
  };

  const handleRegisterError = (studentId, courseId, message) => {
    setStats(prev => ({ 
      ...prev, 
      totalRequests: prev.totalRequests + 1,
      failed: prev.failed + 1 
    }));
    
    setActivities(prev => [{
      id: Date.now() + Math.random(),
      studentId: studentId,
      courseId: courseId,
      status: 'failed',
      reason: message || 'Failed',
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  return (
    <div className="admin-page">
      <Container fluid className="admin-main-container p-4">
        {/* Header Section */}
        <AdminHeader />

        {/* Metrics Section - Top */}
        <section className="admin-section metrics-section">
          <Row className="g-3 g-lg-4">
            <DashboardCards stats={stats} loading={coursesLoading} />
          </Row>
        </section>

        {/* Activity & Analytics Section - Middle */}
        <section className="admin-section content-section">
          <Row className="g-3 g-lg-4">
            <Col lg={4} md={6} xs={12} className="d-flex flex-column">
              <div className="admin-card-wrapper">
                <h3 className="admin-section-title">Quick Register</h3>
                <RegisterForm 
                  courses={courses} 
                  onRegisterSuccess={handleRegisterSuccess} 
                  onRegisterError={handleRegisterError} 
                />
              </div>
            </Col>

            <Col lg={8} md={6} xs={12} className="d-flex flex-column">
              <div className="admin-card-wrapper">
                <h3 className="admin-section-title">Activity Feed</h3>
                <ActivityFeed activities={activities} />
              </div>
            </Col>
          </Row>
        </section>

        {/* Course Catalog Section - Lower Middle */}
        <section className="admin-section courses-section">
          <Row className="g-3 g-lg-4">
            <Col xs={12}>
              <h3 className="admin-section-title mb-3">Available Courses</h3>
              <CourseList courses={courses} loading={coursesLoading} />
            </Col>
          </Row>
        </section>

        {/* Pipeline Visualization Section - Bottom */}
        <section className="admin-section pipeline-section">
          <Row className="g-3 g-lg-4">
            <Col xs={12}>
              <div className="admin-card-wrapper">
                <h3 className="admin-section-title">Data Pipeline</h3>
                <PipelineViz />
              </div>
            </Col>
          </Row>
        </section>
      </Container>

      <ToastContainer theme={theme} position="bottom-right" />
    </div>
  );
}

export default AdminDashboard;