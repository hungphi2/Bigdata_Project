import React from 'react';
import { Card, ProgressBar, Table } from 'react-bootstrap';
import { FiBarChart2 } from 'react-icons/fi';

const CourseList = ({ courses }) => {
  return (
    <Card className="glass-card text-white h-100 d-flex flex-column border-0" style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)' }}>
      <div className="px-3 py-3 border-bottom d-flex align-items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(15,23,42,0.3)' }}>
        <FiBarChart2 className="text-primary" />
        <h6 className="fw-bold mb-0 text-uppercase tracking-wide" style={{fontSize: '0.85em'}}>Course Availability Analytics</h6>
      </div>
      <Card.Body className="p-0 overflow-auto flex-grow-1">
        <Table borderless hover variant="dark" className="mb-0 text-white w-100" style={{ backgroundColor: 'transparent' }}>
          <thead style={{ backgroundColor: 'rgba(15,23,42,0.6)'}}>
            <tr>
              <th className="py-3 px-4 text-muted-custom fw-semibold text-uppercase tracking-wide" style={{fontSize: '0.7em'}}>Course ID</th>
              <th className="py-3 px-4 text-muted-custom fw-semibold text-uppercase tracking-wide" style={{fontSize: '0.7em'}}>Availability</th>
              <th className="py-3 px-4 text-muted-custom fw-semibold text-uppercase tracking-wide" style={{fontSize: '0.7em'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const percentage = ((c.total_quota - c.remaining) / c.total_quota) * 100;
              const isFull = c.remaining === 0;

              return (
                <tr key={c.course_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="py-3 px-4 align-middle fw-bold">{c.course_id}</td>
                  <td className="py-3 px-4 align-middle w-50">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small text-muted-custom" style={{fontSize:'0.75rem'}}>{c.total_quota - c.remaining} filled</span>
                      <span className="small text-muted-custom text-white fw-semibold" style={{fontSize:'0.75rem'}}>{c.remaining} left</span>
                    </div>
                    <ProgressBar 
                      now={percentage} 
                      variant={isFull ? 'danger' : percentage > 70 ? 'warning' : 'primary'}
                      className="progress-custom"
                      style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.3)' }}
                    />
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <span className={`px-2 py-1 rounded small fw-semibold ${isFull ? 'bg-danger bg-opacity-25 text-danger' : 'bg-success bg-opacity-25 text-success'}`} style={{fontSize: '0.70em'}}>
                      {isFull ? 'FULL' : 'OPEN'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default CourseList;
