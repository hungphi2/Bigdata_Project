import React from 'react';
import { FiMonitor, FiDatabase, FiServer, FiCommand, FiArrowRight } from 'react-icons/fi';
import { SiApachekafka } from 'react-icons/si';

const NODES = [
  { label: 'Frontend',   Icon: FiMonitor,      iconColor: 'var(--text-code)' },
  { label: 'FastAPI',    Icon: FiServer,        iconColor: 'var(--success)'   },
  { label: 'Kafka',      Icon: SiApachekafka,   iconColor: 'var(--primary)'   },
  { label: 'Spark',      Icon: FiCommand,       iconColor: 'var(--warning)'   },
  { label: 'Redis',      Icon: FiDatabase,      iconColor: 'var(--danger)'    },
  { label: 'PostgreSQL', Icon: FiDatabase,      iconColor: 'var(--text-code)' },
];

const PipelineViz = () => (
  <div className="pipeline-wrap">
    {NODES.map((node, i) => (
      <React.Fragment key={node.label}>
        <div className="pipeline-node">
          <node.Icon size={16} style={{ color: node.iconColor, flexShrink: 0 }} />
          <span className="pipeline-node-label">{node.label}</span>
          <span className="pipeline-status" />
        </div>
        {i < NODES.length - 1 && (
          <FiArrowRight size={16} className="pipeline-arrow" />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default PipelineViz;
