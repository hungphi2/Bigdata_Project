import React from 'react';
import { Badge } from 'react-bootstrap';
import { FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const RegistrationHistory = ({ activities = [] }) => (
  <div className="inner-card">
    <div className="inner-card-header">
      <FiClock style={{ color: 'var(--primary)', flexShrink: 0 }} size={16} />
      <h5 className="inner-card-title">Registration History</h5>
    </div>

    <div className="inner-card-body">
      {activities.length === 0 ? (
        <div className="reg-history-empty">
          <FiClock size={28} />
          <span>No registration attempts yet.</span>
          <span style={{ fontSize: '0.75rem' }}>Your history will appear here.</span>
        </div>
      ) : (
        <div className="reg-history-list">
          <AnimatePresence>
            {activities.map((act) => (
              <motion.div
                key={act.id}
                className={`reg-history-item reg-history-item--${act.status === 'success' ? 'success' : 'error'}`}
                initial={{ opacity: 0, x: -16, y: -8 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25 }}
              >
                <div className="reg-history-icon">
                  {act.status === 'success'
                    ? <FiCheckCircle size={15} style={{ color: 'var(--success)' }} />
                    : <FiAlertCircle size={15} style={{ color: 'var(--danger)' }}  />
                  }
                </div>

                <div className="reg-history-content">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="reg-history-course">{act.courseId}</span>
                    <Badge
                      bg={act.status === 'success' ? 'success' : 'danger'}
                      style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}
                    >
                      {act.status === 'success' ? 'SUCCESS' : 'FAILED'}
                    </Badge>
                  </div>
                  {act.reason && (
                    <p className="reg-history-msg">{act.reason}</p>
                  )}
                </div>

                <span className="reg-history-time">
                  {new Date(act.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
                  })}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  </div>
);

export default RegistrationHistory;
