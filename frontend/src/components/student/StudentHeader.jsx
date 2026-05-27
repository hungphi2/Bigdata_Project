import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ThemeToggle from '../shared/ThemeToggle';

const StudentHeader = () => {
  return (
    <div className="student-header">
      <Container>
        <Row className="align-items-center">
          <Col>
            <h1 className="fw-bold mb-2">Course Registration Portal</h1>
            <p className="mb-0" style={{ fontSize: '1.1rem', opacity: 0.85 }}>
              Real-Time Enrollment System
            </p>
          </Col>
          <Col xs="auto">
            <ThemeToggle />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StudentHeader;
