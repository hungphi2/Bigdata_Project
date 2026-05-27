import React from 'react';
import { FiTerminal, FiRadio } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityRowSkeleton } from '../shared/Loading';

const SKELETON_ROWS = 4;

const ActivityFeed = ({ activities, loading = false }) => (
  <div className="inner-card" style={{ minHeight: 260 }}>
    <div className="activity-header">
      <FiTerminal size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <p className="activity-header-label">Live Events</p>
    </div>

    <div className="activity-terminal">
      {loading ? (
        Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <ActivityRowSkeleton key={i} />
        ))
      ) : activities.length === 0 ? (
        <div className="activity-empty">
          <FiRadio size={22} />
          <span>Waiting for activity…</span>
          <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>
            Events will appear here as registrations are processed.
          </span>
        </div>
      ) : (
        <AnimatePresence>
          {activities.map((act) => (
            <motion.div
              key={act.id}
              className="activity-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="activity-time">
                {new Date(act.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <span className="activity-student">{act.studentId}</span>
              <span className="activity-sep">→</span>
              <span className="activity-course">{act.courseId}</span>
              {act.status === 'success'
                ? <span className="activity-ok">OK</span>
                : <span className="activity-err" title={act.reason}>ERR</span>
              }
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  </div>
);

export default ActivityFeed;
