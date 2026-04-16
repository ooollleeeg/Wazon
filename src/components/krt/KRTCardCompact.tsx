import React from 'react';
import './styles/KRTCardCompact.css';

interface KRTCardCompactProps {
  subdivisionName?: string;
  premisesNumber?: string;
  address?: string;
  onClick?: () => void;
}

const KRTCardCompact: React.FC<KRTCardCompactProps> = ({
  subdivisionName = '',
  premisesNumber = '',
  address = '',
  onClick,
}) => {
  return (
    <div className='krt-compact-card' onClick={onClick}>
      <div className='krt-compact-avatar'>
        <span className='krt-compact-icon'>🖨️</span>
      </div>
      <div className='krt-compact-content'>
        <div className='krt-compact-title'>{subdivisionName}</div>
        {premisesNumber && (
          <div className='krt-compact-premises'>Каб. {premisesNumber}</div>
        )}
        {address && <div className='krt-compact-address'>{address}</div>}
      </div>
      <div className='krt-compact-arrow'>›</div>
    </div>
  );
};

export default KRTCardCompact;
