import React from 'react';
import { Card } from 'react-bootstrap';
import { FiTerminal } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityFeed = ({ activities }) => {
  return (
    <Card className="glass-card text-white flex-grow-1 overflow-hidden d-flex flex-column border-0" style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)' }}>
      <div className="px-3 py-2 border-bottom d-flex align-items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(15,23,42,0.3)' }}>
        <FiTerminal className="text-secondary" />
        <h6 className="fw-bold mb-0 text-uppercase tracking-wide" style={{fontSize: '0.85em'}}>Live Events</h6>
      </div>
      <Card.Body className="p-0 position-relative flex-grow-1 d-flex flex-column" style={{ minHeight: '200px' }}>
        <div className="terminal-log flex-grow-1 p-3 m-2 overflow-auto shadow-none bg-dark" style={{ border: 'none', backgroundColor: 'rgba(9, 13, 22, 0.8) !important', margin: '0.5rem !important' }}>
          {activities.length === 0 ? (
            <div className="text-center text-muted-custom py-3 opacity-50 small">
              Listening to /events metric...
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              <AnimatePresence>
                {activities.map((act) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="d-flex align-items-center justify-content-between border-bottom pb-2" style={{ borderColor: 'rgba(255,255,255,0.05) !important' }}
                  >
                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                      <span className="text-muted opacity-50 flex-shrink-0" style={{fontSize: '0.7rem'}}>
                        {new Date(act.timestamp).toLocaleTimeString('en-US', {hour12: false})}
                      </span>
                      <span className="text-info fw-bold" style={{fontSize: '0.8rem'}}>{act.studentId}</span>
                      <span className="text-secondary" style={{fontSize: '0.8rem'}}>→</span>
                      <span className="text-warning fw-bold text-truncate" style={{fontSize: '0.8rem', maxWidth: '60px'}}>{act.courseId}</span>
                    </div>
                    {act.status === 'success' ? (
                      <span className="text-success flex-shrink-0 fw-bold" style={{fontSize: '0.75rem'}}>OK</span>
                    ) : (
                      <span className="text-danger flex-shrink-0 text-end text-truncate" title={act.reason} style={{fontSize: '0.75rem', maxWidth: '80px', pointerEvents: 'auto'}}>ERR</span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ActivityFeed;
