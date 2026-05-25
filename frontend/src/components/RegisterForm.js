import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { registerCourse } from '../api';

const RegisterForm = () => {
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const res = await registerCourse(studentId, courseId);
      setMessage(res.data.message);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail);
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div>
      <h3>Register</h3>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Student ID</Form.Label>
          <Form.Control type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Course ID</Form.Label>
          <Form.Control type="text" value={courseId} onChange={(e) => setCourseId(e.target.value)} required />
        </Form.Group>
        <Button variant="primary" type="submit">Submit</Button>
      </Form>
    </div>
  );
};

export default RegisterForm;
