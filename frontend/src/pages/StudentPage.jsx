import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/student.css';
import { useTheme } from '../contexts/ThemeContext';

import { getCourses, checkRegistration } from '../services/api';
import StudentHeader from '../components/student/StudentHeader';
import CourseList from '../components/student/CourseList';
import RegisterForm from '../components/student/RegisterForm';
import RegistrationHistory from '../components/student/RegistrationHistory';

function StudentPage() {
  const { theme } = useTheme();
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [pendingChecks, setPendingChecks] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const fetchCourses = async () => {
    try {
      const res = await getCourses();
      setCourses(res.data);
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

  // Poll pending registrations and update their status once confirmed
  useEffect(() => {
    if (pendingChecks.length === 0) return;
    const interval = setInterval(async () => {
      for (const req of pendingChecks) {
        try {
          const res = await checkRegistration(req.studentId, req.courseId);
          if (res.data && res.data.registered) {
            setPendingChecks(prev =>
              prev.filter(p => p.id !== req.id)
            );
            setRegistrations(prev =>
              prev.map(r =>
                r.id === req.id
                  ? { ...r, status: 'success', reason: 'Registered Successfully' }
                  : r
              )
            );
          }
        } catch (error) {
          console.error('Check registration error:', error);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [pendingChecks]);

  // Called by RegisterForm on successful HTTP submit → add PENDING entry immediately
  const handleRegisterSuccess = (studentId, courseId) => {
    const id = Date.now() + Math.random();
    setRegistrations(prev => [{
      id,
      studentId,
      courseId,
      status: 'pending',
      reason: 'Processing…',
      timestamp: new Date().toISOString()
    }, ...prev]);
    setPendingChecks(prev => [...prev, { id, studentId, courseId }]);
  };

  // Called by RegisterForm on HTTP error → add FAILED entry immediately
  const handleRegisterError = (studentId, courseId, message) => {
    setRegistrations(prev => [{
      id: Date.now() + Math.random(),
      studentId,
      courseId,
      status: 'failed',
      reason: message || 'Registration failed',
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
  };

  return (
    <div className="student-page">
      <StudentHeader />

      <Container className="student-main-container">
        <section className="student-section course-section">
          <CourseList
            courses={courses}
            onSelectCourse={handleSelectCourse}
            loading={coursesLoading}
          />
        </section>

        <section className="student-section registration-section">
          <Row className="g-4">
            <Col lg={6} className="d-flex flex-column">
              <div className="student-card-wrapper">
                <h3 className="student-section-title">Register for Course</h3>
                <RegisterForm
                  courses={courses}
                  onRegisterSuccess={handleRegisterSuccess}
                  onRegisterError={handleRegisterError}
                  selectedCourseId={selectedCourseId}
                />
              </div>
            </Col>
            <Col lg={6} className="d-flex flex-column">
              <div className="student-card-wrapper">
                <h3 className="student-section-title">Registration Activity</h3>
                <RegistrationHistory registrations={registrations} />
              </div>
            </Col>
          </Row>
        </section>
      </Container>

      <ToastContainer theme={theme} position="bottom-right" />
    </div>
  );
}

export default StudentPage;
