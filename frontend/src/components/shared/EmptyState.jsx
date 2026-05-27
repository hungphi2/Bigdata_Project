import React from 'react';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
}) => (
  <div className={`empty-state empty-state--${size}`}>
    {Icon && (
      <div className="empty-state-icon">
        <Icon size={size === 'sm' ? 22 : 34} />
      </div>
    )}
    {title && <p className="empty-state-title">{title}</p>}
    {description && <p className="empty-state-desc">{description}</p>}
    {action && (
      <button className="empty-state-action" onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
