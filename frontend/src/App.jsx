import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getCourses, checkRegistration } from './api';
import Header from './components/Header';
import DashboardCards from './components/DashboardCards';
import CourseList from './components/CourseList';
import RegisterForm from './components/RegisterForm';
import ActivityFeed from './components/ActivityFeed';
import PipelineViz from './components/PipelineViz';

function App() {
  const [courses, setCourses] = useState([]);
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
    <Container className="dashboard-container p-4" fluid="xl">
      <Header />

      <Row className="g-4 mb-4">
        <DashboardCards stats={stats} />
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={4} className="d-flex flex-column gap-4">
          <RegisterForm courses={courses} onRegisterSuccess={handleRegisterSuccess} onRegisterError={handleRegisterError} />
          <ActivityFeed activities={activities} />
        </Col>

        <Col lg={8} className="d-flex flex-column gap-4">
          <CourseList courses={courses} />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col>
          <PipelineViz />
        </Col>
      </Row>

      <ToastContainer theme="dark" position="bottom-right" />
    </Container>
  );
}

export default App;
