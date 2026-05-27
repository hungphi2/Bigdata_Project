import React from 'react';
import { Badge } from 'react-bootstrap';
import { FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  success: {
    icon: <FiCheckCircle size={15} style={{ color: 'var(--success)' }} />,
    badgeVariant: 'success',
    label: 'SUCCESS',
    itemMod: 'success',
  },
  failed: {
    icon: <FiAlertCircle size={15} style={{ color: 'var(--danger)' }} />,
    badgeVariant: 'danger',
    label: 'FAILED',
    itemMod: 'error',
  },
  pending: {
    icon: <FiClock size={15} style={{ color: 'var(--warning, #f59e0b)' }} />,
    badgeVariant: 'warning',
    label: 'PENDING',
    itemMod: 'pending',
  },
};

const RegistrationHistory = ({ registrations = [] }) => (
  <div className="inner-card">
    <div className="inner-card-header">
      <FiClock style={{ color: 'var(--primary)', flexShrink: 0 }} size={16} />
      <h5 className="inner-card-title">Registration History</h5>
    </div>

    <div className="inner-card-body">
      {registrations.length === 0 ? (
        <div className="reg-history-empty">
          <FiClock size={28} />
          <span>No registration attempts yet.</span>
          <span style={{ fontSize: '0.75rem' }}>Your history will appear here.</span>
        </div>
      ) : (
        <div className="reg-history-list">
          <AnimatePresence>
            {registrations.map((reg) => {
              const cfg = STATUS_CONFIG[reg.status] ?? STATUS_CONFIG.failed;
              return (
                <motion.div
                  key={reg.id}
                  className={`reg-history-item reg-history-item--${cfg.itemMod}`}
                  initial={{ opacity: 0, x: -16, y: -8 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="reg-history-icon">{cfg.icon}</div>

                  <div className="reg-history-content">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="reg-history-course">{reg.courseId}</span>
                      <Badge
                        bg={cfg.badgeVariant}
                        style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                    {reg.reason && (
                      <p className="reg-history-msg">{reg.reason}</p>
                    )}
                  </div>

                  <span className="reg-history-time">
                    {new Date(reg.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
                    })}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  </div>
);

export default RegistrationHistory;
