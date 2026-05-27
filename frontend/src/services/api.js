import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export const registerCourse = (studentId, courseId) =>
  axios.post(`${API_BASE}/register`, null, {
    params: {
      student_id: studentId,
      course_id: courseId
    }
  });

export const checkRegistration = (studentId, courseId) =>
  axios.get(`${API_BASE}/check/${studentId}/${courseId}`);

export const getCourses = () =>
  axios.get(`${API_BASE}/courses`);
