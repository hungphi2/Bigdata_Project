import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { FiUsers, FiSettings } from 'react-icons/fi';
import ThemeToggle from '../components/shared/ThemeToggle';

function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="role-selection-page">
      <div className="role-selection-toggle">
        <ThemeToggle />
      </div>

      <Container>
        <Row className="mb-5">
          <Col xs={12} className="text-center">
            <h1 className="fw-bold mb-2 role-selection-title">
              Course Registration System
            </h1>
            <p className="role-selection-subtitle">Select your role to continue</p>
          </Col>
        </Row>

        <Row className="g-4 justify-content-center">
          {/* Student card */}
          <Col lg={5} md={6}>
            <div className="role-card role-card--student">
              <div className="role-card-icon-wrap role-card-icon-wrap--student">
                <FiUsers size={40} />
              </div>

              <h3 className="fw-bold mb-2 role-card-heading">Student</h3>
              <p className="role-card-desc">Register for courses and manage your enrollment</p>

              <button
                className="role-card-btn role-card-btn--student"
                onClick={() => navigate('/student')}
              >
                Continue as Student
              </button>
            </div>
          </Col>

          {/* Admin card */}
          <Col lg={5} md={6}>
            <div className="role-card role-card--admin">
              <div className="role-card-icon-wrap role-card-icon-wrap--admin">
                <FiSettings size={40} />
              </div>

              <h3 className="fw-bold mb-2 role-card-heading">Admin</h3>
              <p className="role-card-desc">Monitor registrations and system activity</p>

              <button
                className="role-card-btn role-card-btn--admin"
                onClick={() => navigate('/admin')}
              >
                Continue as Admin
              </button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default RoleSelectionPage;
