import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { getCourses } from '../api';

const CourseList = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await getCourses();
        setCourses(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
    const interval = setInterval(fetchCourses, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Course List</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Course ID</th>
            <th>Total Quota</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.course_id}>
              <td>{c.course_id}</td>
              <td>{c.total_quota}</td>
              <td>{c.remaining}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default CourseList;
