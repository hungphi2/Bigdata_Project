import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col } from 'react-bootstrap';
import CourseList from './components/CourseList';
import RegisterForm from './components/RegisterForm';
import StatusChecker from './components/StatusChecker';

function App() {
  return (
    <Container className="mt-4">
      <h1 className="mb-4">Course Registration System</h1>
      <Row>
        <Col md={8}>
          <CourseList />
        </Col>
        <Col md={4}>
          <RegisterForm />
          <hr />
          <StatusChecker />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
