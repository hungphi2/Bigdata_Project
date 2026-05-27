import React from 'react';

const Skeleton = ({ className = '', style = {} }) => (
  <div className={`skeleton ${className}`} style={style} />
);

export const CourseCardSkeleton = () => (
  <div className="course-card" style={{ cursor: 'default', pointerEvents: 'none' }}>
    <div className="course-card__header">
      <div className="course-card__title">
        <Skeleton style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0 }} />
        <Skeleton style={{ width: 110, height: 16, borderRadius: 4 }} />
      </div>
      <Skeleton style={{ width: 44, height: 20, borderRadius: 4, flexShrink: 0 }} />
    </div>

    <Skeleton style={{ width: '80%', height: 13, borderRadius: 4 }} />

    <div className="course-card__stats">
      <div className="course-card__stat-group">
        <Skeleton style={{ width: 55, height: 10, borderRadius: 3, marginBottom: 5 }} />
        <Skeleton style={{ width: 40, height: 15, borderRadius: 3 }} />
      </div>
      <div className="course-card__stat-group" style={{ textAlign: 'right' }}>
        <Skeleton style={{ width: 55, height: 10, borderRadius: 3, marginBottom: 5 }} />
        <Skeleton style={{ width: 28, height: 20, borderRadius: 3 }} />
      </div>
    </div>

    <div>
      <div className="course-card__capacity-header">
        <Skeleton style={{ width: 58, height: 11, borderRadius: 3 }} />
        <Skeleton style={{ width: 30, height: 11, borderRadius: 3 }} />
      </div>
      <div className="course-card__progress-track" style={{ marginTop: 6 }}>
        <Skeleton style={{ width: '55%', height: '100%', borderRadius: 3, animation: 'none', backgroundColor: 'var(--border-light)' }} />
      </div>
    </div>

    <Skeleton style={{ width: '100%', height: 36, borderRadius: 'var(--radius-sm)', marginTop: 'auto' }} />
  </div>
);

export const StatCardSkeleton = () => (
  <div className="stat-card" style={{ pointerEvents: 'none' }}>
    <div>
      <Skeleton style={{ width: 68, height: 10, borderRadius: 3, marginBottom: 10 }} />
      <Skeleton style={{ width: 54, height: 28, borderRadius: 4 }} />
    </div>
    <Skeleton style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
  </div>
);

export const ActivityRowSkeleton = () => (
  <div className="activity-row" style={{ pointerEvents: 'none', gap: '0.5rem' }}>
    <Skeleton style={{ width: 55, height: 10, borderRadius: 3, flexShrink: 0 }} />
    <Skeleton style={{ width: 48, height: 10, borderRadius: 3, flexShrink: 0 }} />
    <Skeleton style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0 }} />
    <Skeleton style={{ width: 60, height: 10, borderRadius: 3, flexShrink: 0 }} />
    <Skeleton style={{ width: 24, height: 10, borderRadius: 3, marginLeft: 'auto', flexShrink: 0 }} />
  </div>
);

const Loading = ({ text = 'Loading…' }) => (
  <div className="loading-page-spinner">
    <div className="loading-spinner-ring" />
    {text && <span className="loading-spinner-text">{text}</span>}
  </div>
);

export default Loading;
