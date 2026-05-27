import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/admin.css';
import { useTheme } from '../contexts/ThemeContext';

import { getMetrics, getEvents } from '../services/api';
import AdminHeader from '../components/admin/AdminHeader';
import DashboardCards from '../components/admin/DashboardCards';
import ActivityFeed from '../components/admin/ActivityFeed';
import PipelineViz from '../components/admin/PipelineViz';

const POLL_INTERVAL_MS = 3000;

function AdminDashboard() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    successful: 0,
    failed: 0,
    totalQuotaLeft: 0
  });
  const [activities, setActivities] = useState([]);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await getMetrics();
      setStats(res.data);
    } catch (err) {
      console.error('Fetch metrics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await getEvents(20);
      setActivities(res.data);
    } catch (err) {
      console.error('Fetch events error:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchEvents();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchEvents();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchMetrics, fetchEvents]);

  return (
    <div className="admin-page">
      <Container fluid className="admin-main-container p-4">
        <AdminHeader />

        <section className="admin-section metrics-section">
          <Row className="g-3 g-lg-4">
            <DashboardCards stats={stats} loading={loading} />
          </Row>
        </section>

        <section className="admin-section content-section">
          <Row className="g-3 g-lg-4">
            <Col xs={12}>
              <div className="admin-card-wrapper">
                <h3 className="admin-section-title">Activity Feed</h3>
                <ActivityFeed activities={activities} />
              </div>
            </Col>
          </Row>
        </section>

        <section className="admin-section pipeline-section">
          <Row className="g-3 g-lg-4">
            <Col xs={12}>
              <div className="admin-card-wrapper">
                <h3 className="admin-section-title">Data Pipeline</h3>
                <PipelineViz />
              </div>
            </Col>
          </Row>
        </section>
      </Container>

      <ToastContainer theme={theme} position="bottom-right" />
    </div>
  );
}

export default AdminDashboard;
