import React, { useState } from 'react';
import { Card, Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import { FiZap } from 'react-icons/fi';
import { registerCourse } from '../api';
import { toast } from 'react-toastify';

const RegisterForm = ({ courses, onRegisterSuccess, onRegisterError }) => {
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !courseId) {
      toast.warning('Please fill in all fields!');
      return;
    }
    
    setLoading(true);
    try {
      await registerCourse(studentId, courseId);
      onRegisterSuccess(studentId, courseId);
      setStudentId('');
    } catch (err) {
      let msg = 'Failed to submit request';
      if (err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      onRegisterError && onRegisterError(studentId, courseId, msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card text-white flex-shrink-0 border-0" style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)' }}>
      <div className="px-3 py-2 border-bottom d-flex align-items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(15,23,42,0.3)' }}>
        <FiZap className="text-warning" />
        <h6 className="fw-bold mb-0 text-uppercase tracking-wide" style={{fontSize: '0.85em'}}>Fast Reg Stream</h6>
      </div>
      <Card.Body className="p-3">
        <Form onSubmit={handleSubmit}>
          <Row className="g-2">
            <Col xs={12}>
              <Form.Control
                type="text"
                placeholder="Student ID (e.g. SV001)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="form-control-dark shadow-none py-2 text-sm"
                style={{
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  borderColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}
              />
            </Col>
            <Col xs={12}>
              <Form.Select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="form-select-dark shadow-none py-2 text-sm"
              >
                <option value="">-- Choose Course --</option>
                {courses.map(c => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.course_id} ({c.remaining} left)
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12}>
              <Button 
                type="submit" 
                className="w-100 btn-primary-custom py-2 shadow-none border-0 mt-1"
                disabled={loading}
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', fontWeight: 600 }}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Emit to Pipeline'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default RegisterForm;
