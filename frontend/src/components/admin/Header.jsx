import React from 'react';
import { Badge } from 'react-bootstrap';
import { FiActivity } from 'react-icons/fi';

const Header = () => {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end border-bottom border-secondary mb-4 pb-3" style={{ borderColor: 'rgba(255,255,255,0.05) !important' }}>
      <div className="d-flex flex-column">
        <h2 className="d-flex align-items-center fw-bold text-white mb-1">
          <div className="p-2 bg-primary rounded-circle bg-opacity-25 me-3">
            <FiActivity className="text-primary" size={28} />
          </div>
          Big Data Course Registration System
        </h2>
        <div className="text-muted-custom small ms-5 ps-3 tracking-wide text-uppercase fw-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Real-time Course Enrollment Pipeline
        </div>
      </div>
      <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0">
        <Badge bg="dark" className="p-2 border d-flex align-items-center fw-normal rounded-pill" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
          <span className="me-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>FastAPI
        </Badge>
        <Badge bg="dark" className="p-2 border d-flex align-items-center fw-normal rounded-pill" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
          <span className="me-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>Kafka
        </Badge>
        <Badge bg="dark" className="p-2 border d-flex align-items-center fw-normal rounded-pill" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
          <span className="me-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>Spark
        </Badge>
        <Badge bg="dark" className="p-2 border d-flex align-items-center fw-normal rounded-pill" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
          <span className="me-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>Redis
        </Badge>
        <Badge bg="dark" className="p-2 border d-flex align-items-center fw-normal rounded-pill" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
          <span className="me-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>PostgreSQL
        </Badge>
      </div>
    </div>
  );
};

export default Header;
