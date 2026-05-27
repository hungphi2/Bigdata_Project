import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { FiBook } from 'react-icons/fi';
import CourseCard from './CourseCard';
import EmptyState from '../shared/EmptyState';
import { CourseCardSkeleton } from '../shared/Loading';

const SKELETON_COUNT = 3;

const CourseList = ({ courses, onSelectCourse, loading = false }) => (
  <div>
    <div className="course-catalog-header">
      <div className="d-flex align-items-center gap-2 mb-1">
        <FiBook style={{ color: 'var(--primary)', flexShrink: 0 }} size={22} />
        <h2 className="mb-0" style={{ color: 'var(--text-main)' }}>Available Courses</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginLeft: '30px' }}>
        Browse and select courses for registration
      </p>
    </div>

    <Row className="g-3">
      {loading ? (
        Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <Col key={i} lg={4} md={6} xs={12}>
            <CourseCardSkeleton />
          </Col>
        ))
      ) : courses.length > 0 ? (
        courses.map((course) => (
          <Col key={course.course_id} lg={4} md={6} xs={12}>
            <CourseCard course={course} onSelectCourse={onSelectCourse} />
          </Col>
        ))
      ) : (
        <Col xs={12}>
          <EmptyState
            icon={FiBook}
            title="No courses available"
            description="There are no courses listed at the moment. Check back soon."
          />
        </Col>
      )}
    </Row>
  </div>
);

export default CourseList;
