import React from 'react';
import { Col, Card } from 'react-bootstrap';
import { FiUsers, FiCheckCircle, FiXCircle, FiDatabase } from 'react-icons/fi';

const DashboardCards = ({ stats }) => {
  return (
    <>
      <Col md={6} lg={3}>
        <Card className="glass-card text-white h-100 border-0" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
          <Card.Body className="d-flex justify-content-between align-items-center p-3">
            <div>
              <p className="mb-0 text-muted-custom small fw-semibold text-uppercase tracking-wide" style={{fontSize: '0.7em'}}>Total Req</p>
              <h4 className="mb-0 fw-bold">{stats.totalRequests || 0}</h4>
            </div>
            <div className="p-2 bg-primary bg-opacity-25 rounded text-primary">
              <FiUsers size={20} />
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={3} md={6}>
        <Card className="glass-card text-white h-100 border-0" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
          <Card.Body className="d-flex justify-content-between align-items-center p-3">
            <div>
              <p className="mb-0 text-muted-custom small fw-semibold text-uppercase tracking-wide" style={{fontSize: '0.7em'}}>Accepted</p>
              <h4 className="mb-0 fw-bold text-success">{stats.successful || 0}</h4>
            </div>
            <div className="p-2 bg-success bg-opacity-25 rounded text-success">
              <FiCheckCircle size={20} />
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={3} md={6}>
        <Card className="glass-card text-white h-100 border-0" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
          <Card.Body className="d-flex justify-content-between align-items-center p-3">
            <div>
              <p className="mb-0 text-muted-custom small fw-semibold text-uppercase tracking-wide" style={{fontSize: '0.7em'}}>Failed</p>
              <h4 className="mb-0 fw-bold text-danger">{stats.failed || 0}</h4>
            </div>
            <div className="p-2 bg-danger bg-opacity-25 rounded text-danger">
              <FiXCircle size={20} />
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={3} md={6}>
        <Card className="glass-card text-white h-100 border-0" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
          <Card.Body className="d-flex justify-content-between align-items-center p-3">
            <div>
              <p className="mb-0 text-muted-custom small fw-semibold text-uppercase tracking-wide" style={{fontSize: '0.7em'}}>Quota Left</p>
              <h4 className="mb-0 fw-bold text-warning">{stats.totalQuotaLeft || 0}</h4>
            </div>
            <div className="p-2 bg-warning bg-opacity-25 rounded text-warning">
              <FiDatabase size={20} />
            </div>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default DashboardCards;
