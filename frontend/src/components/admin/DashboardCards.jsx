import React from 'react';
import { Col } from 'react-bootstrap';
import { FiUsers, FiCheckCircle, FiXCircle, FiDatabase } from 'react-icons/fi';
import { StatCardSkeleton } from '../shared/Loading';

const CARDS = [
  { key: 'totalRequests', label: 'Total Req.',   Icon: FiUsers,       iconMod: '--primary', valueMod: ''         },
  { key: 'successful',    label: 'Accepted',     Icon: FiCheckCircle, iconMod: '--success', valueMod: '--success' },
  { key: 'failed',        label: 'Failed',       Icon: FiXCircle,     iconMod: '--danger',  valueMod: '--danger'  },
  { key: 'totalQuotaLeft',label: 'Quota Left',   Icon: FiDatabase,    iconMod: '--warning', valueMod: '--warning' },
];

const DashboardCards = ({ stats, loading = false }) => (
  <>
    {CARDS.map(({ key, label, Icon, iconMod, valueMod }) => (
      <Col key={key} lg={3} md={6}>
        {loading ? (
          <StatCardSkeleton />
        ) : (
          <div className="stat-card">
            <div>
              <p className="stat-label">{label}</p>
              <p className={`stat-value${valueMod ? ` stat-value${valueMod}` : ''}`}>
                {stats[key] ?? 0}
              </p>
            </div>
            <div className={`stat-icon stat-icon${iconMod}`}>
              <Icon size={20} />
            </div>
          </div>
        )}
      </Col>
    ))}
  </>
);

export default DashboardCards;
