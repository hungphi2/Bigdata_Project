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
  const [pendingChecks, setPendingChecks] = useState([]);
  const [activities, setActivities] = useState([]);
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
          }
        } catch (error) {
          console.error('Check registration error:', error);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [pendingChecks]);

  const handleRegisterSuccess = (studentId, courseId) => {
    setPendingChecks(prev => [...prev, { studentId, courseId }]);
  };

  const handleRegisterError = (studentId, courseId, message) => {
    console.error(`Registration failed for ${studentId}: ${message}`);
    setActivities(prev => [{
      id: Date.now() + Math.random(),
      studentId: studentId,
      courseId: courseId,
      status: 'failed',
      reason: message || 'Failed',
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
  };

  return (
    <div className="student-page">
      {/* Header Section */}
      <StudentHeader />
      
      {/* Main Content Container - Centered with max-width */}
      <Container className="student-main-container">
        {/* Course Catalog Section */}
        <section className="student-section course-section">
          <CourseList courses={courses} onSelectCourse={handleSelectCourse} loading={coursesLoading} />
        </section>

        {/* Registration & History Section */}
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
                <RegistrationHistory activities={activities} />
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