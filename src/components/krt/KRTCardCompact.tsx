import React from 'react';
import './styles/KRTCardCompact.css';

interface KRTCardCompactProps {
  subdivisionName?: string;
  premisesNumber?: string;
  address?: string;
}

const KRTCardCompact: React.FC<KRTCardCompactProps> = ({
  subdivisionName = '',
  premisesNumber = '',
  address = '',
}) => {
  return (
    <div className='krt-compact-card'>
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
