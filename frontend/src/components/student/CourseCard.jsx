import React from 'react';
import { Badge } from 'react-bootstrap';
import { FiBook, FiUsers } from 'react-icons/fi';

const CourseCard = ({ course, onSelectCourse }) => {
  const enrolled   = course.total_quota - course.remaining;
  const percentage = (enrolled / course.total_quota) * 100;
  const isFull     = course.remaining === 0;
  const fillColor  = isFull ? 'var(--danger)' : percentage > 70 ? 'var(--warning)' : 'var(--primary)';

  return (
    <div
      className={`course-card${isFull ? ' full' : ''}`}
      onClick={() => !isFull && onSelectCourse && onSelectCourse(course.course_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && !isFull && onSelectCourse && onSelectCourse(course.course_id)}
    >
      {/* Header */}
      <div className="course-card__header">
        <div className="course-card__title">
          <FiBook style={{ color: 'var(--primary)', flexShrink: 0 }} size={18} />
          <h5>{course.course_id}</h5>
        </div>
        <Badge
          bg={isFull ? 'danger' : 'success'}
          style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}
        >
          {isFull ? 'FULL' : 'OPEN'}
        </Badge>
      </div>

      {/* Description */}
      <p className="course-card__desc">{course.course_name || 'Course Name'}</p>

      {/* Stats */}
      <div className="course-card__stats">
        <div className="course-card__stat-group">
          <span className="course-card__stat-label">
            <FiUsers size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Enrolled
          </span>
          <span className="course-card__stat-value">
            {enrolled}/{course.total_quota}
          </span>
        </div>
        <div className="course-card__stat-group" style={{ textAlign: 'right' }}>
          <span className="course-card__stat-label">Remaining</span>
          <span className="course-card__remaining">{course.remaining}</span>
        </div>
      </div>

      {/* Capacity bar */}
      <div>
        <div className="course-card__capacity-header">
          <span className="course-card__capacity-label">Capacity</span>
          <span className="course-card__capacity-pct">{percentage.toFixed(0)}%</span>
        </div>
        <div className="course-card__progress-track">
          <div
            className="course-card__progress-fill"
            style={{ width: `${percentage}%`, backgroundColor: fillColor }}
          />
        </div>
      </div>

      {/* Button */}
      <button
        className="course-card__btn"
        disabled={isFull}
        onClick={(e) => {
          e.stopPropagation();
          onSelectCourse && onSelectCourse(course.course_id);
        }}
      >
        {isFull ? 'Course Full' : 'Select Course'}
      </button>
    </div>
  );
};

export default CourseCard;
