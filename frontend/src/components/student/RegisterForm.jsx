import React, { useState, useEffect } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { FiEdit3 } from 'react-icons/fi';
import { registerCourse } from '../../services/api';
import { toast } from 'react-toastify';

const RegisterForm = ({ courses, onRegisterSuccess, onRegisterError, selectedCourseId }) => {
  const [studentId, setStudentId] = useState('');
  const [courseId,  setCourseId]  = useState('');
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (selectedCourseId) setCourseId(selectedCourseId);
  }, [selectedCourseId]);

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
      const msg = err.response?.data?.detail ?? 'Failed to submit request';
      onRegisterError && onRegisterError(studentId, courseId, msg);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !studentId || !courseId;

  return (
    <div className="inner-card">
      <div className="inner-card-header">
        <FiEdit3 style={{ color: 'var(--primary)', flexShrink: 0 }} size={16} />
        <h5 className="inner-card-title">Register for a Course</h5>
      </div>

      <div className="inner-card-body">
        <Form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="reg-student-id">
              Student ID
            </label>
            <Form.Control
              id="reg-student-id"
              type="text"
              placeholder="e.g. SV001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              autoComplete="off"
            />
            <span className="field-hint">Your unique student identifier</span>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="reg-course-select">
              Course
            </label>
            <Form.Select
              id="reg-course-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">— Choose a course —</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_id}
                  {c.remaining > 0 ? ` · ${c.remaining} seats left` : ' · FULL'}
                </option>
              ))}
            </Form.Select>
            <span className="field-hint">Or click a course card above to auto-select</span>
          </div>

          <button
            type="submit"
            className="themed-submit-btn mt-2"
            disabled={isDisabled}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" />
                Registering…
              </>
            ) : 'Register'}
          </button>
        </Form>
      </div>
    </div>
  );
};

export default RegisterForm;
