import React from 'react';
import { Badge } from 'react-bootstrap';
import { FiActivity } from 'react-icons/fi';
import ThemeToggle from '../shared/ThemeToggle';

const SERVICES = ['FastAPI', 'Kafka', 'Spark', 'Redis', 'PostgreSQL'];

const AdminHeader = () => {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end admin-header-bar mb-4 pb-3">
      <div className="d-flex flex-column">
        <h2 className="d-flex align-items-center fw-bold mb-1" style={{ color: 'var(--text-main)' }}>
          <div className="p-2 rounded-circle me-3 admin-header-icon-wrap">
            <FiActivity size={28} style={{ color: 'var(--primary)' }} />
          </div>
          Big Data Course Registration System
        </h2>
        <div
          className="small ms-5 ps-3 tracking-wide text-uppercase fw-semibold"
          style={{ color: 'var(--text-muted)' }}
        >
          Real-time Course Enrollment Pipeline
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mt-3 mt-md-0">
        {SERVICES.map(svc => (
          <Badge
            key={svc}
            bg="dark"
            className="p-2 d-flex align-items-center fw-normal rounded-pill admin-service-badge"
          >
            <span className="me-2 rounded-circle bg-success" style={{ width: 8, height: 8, boxShadow: '0 0 5px #22c55e', display: 'inline-block' }} />
            {svc}
          </Badge>
        ))}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default AdminHeader;
