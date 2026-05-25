import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { checkRegistration } from '../api';

const StatusChecker = () => {
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await checkRegistration(studentId, courseId);
      if (res.data.registered) {
        setStatus("Registered successfully.");
      } else {
        setStatus("Not registered.");
      }
    } catch (err) {
      setStatus("Error checking status.");
    }
  };

  return (
    <div>
      <h3>Check Status</h3>
      {status && <Alert variant="info">{status}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Student ID</Form.Label>
          <Form.Control type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Course ID</Form.Label>
          <Form.Control type="text" value={courseId} onChange={(e) => setCourseId(e.target.value)} required />
        </Form.Group>
        <Button variant="secondary" type="submit">Check</Button>
      </Form>
    </div>
  );
};

export default StatusChecker;
