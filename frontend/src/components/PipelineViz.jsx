import React from 'react';
import { Card } from 'react-bootstrap';
import { FiMonitor, FiDatabase, FiServer, FiCommand, FiArrowRight } from 'react-icons/fi';
import { SiApachekafka } from 'react-icons/si';

const PipelineViz = () => {
  return (
    <Card className="glass-card text-white overflow-hidden border-0" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
      <Card.Body className="p-3">
        <div className="pipeline-container d-flex align-items-center justify-content-between gap-1 py-1" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          
          <div className="d-flex align-items-center bg-dark bg-opacity-25 rounded px-3 py-2 border flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <FiMonitor size={18} className="text-info me-2" />
            <span className="fw-bold tracking-wide" style={{fontSize: '0.8em'}}>Frontend</span>
            <span className="ms-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>
          </div>
          
          <div className="text-muted flex-shrink-0"><FiArrowRight size={20} /></div>
          
          <div className="d-flex align-items-center bg-dark bg-opacity-25 rounded px-3 py-2 border flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <FiServer size={18} className="text-success me-2" />
            <span className="fw-bold tracking-wide" style={{fontSize: '0.8em'}}>FastAPI</span>
            <span className="ms-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>
          </div>
          
          <div className="text-muted flex-shrink-0"><FiArrowRight size={20} /></div>
          
          <div className="d-flex align-items-center bg-dark bg-opacity-25 rounded px-3 py-2 border flex-shrink-0" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <SiApachekafka size={18} className="text-primary me-2" />
            <span className="fw-bold tracking-wide" style={{fontSize: '0.8em'}}>Kafka</span>
            <span className="ms-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>
          </div>
          
          <div className="text-muted flex-shrink-0"><FiArrowRight size={20} /></div>
          
          <div className="d-flex align-items-center bg-dark bg-opacity-25 rounded px-3 py-2 border flex-shrink-0" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <FiCommand size={18} className="text-warning me-2" />
            <span className="fw-bold tracking-wide" style={{fontSize: '0.8em'}}>Spark</span>
            <span className="ms-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>
          </div>
          
          <div className="text-muted flex-shrink-0"><FiArrowRight size={20} /></div>
          
          <div className="d-flex align-items-center bg-dark bg-opacity-25 rounded px-3 py-2 border flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <FiDatabase size={18} className="text-danger me-2" />
            <span className="fw-bold tracking-wide" style={{fontSize: '0.8em'}}>Redis</span>
            <span className="ms-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>
          </div>

          <div className="text-muted flex-shrink-0"><FiArrowRight size={20} /></div>

          <div className="d-flex align-items-center bg-dark bg-opacity-25 rounded px-3 py-2 border flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <FiDatabase size={18} className="text-info me-2" />
            <span className="fw-bold tracking-wide" style={{fontSize: '0.8em'}}>PostgreSQL</span>
            <span className="ms-2 rounded-circle bg-success shadow-sm" style={{width: '8px', height: '8px', boxShadow: '0 0 5px #22c55e'}}></span>
          </div>

        </div>
      </Card.Body>
    </Card>
  );
};

export default PipelineViz;
