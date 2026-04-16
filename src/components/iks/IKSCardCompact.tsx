import React from 'react';
import './styles/IKSCardCompact.css';

interface IKSCardCompactProps {
  id: number;
  systemName?: string;
  systemClass?: string;
  accessMode?: string;
  onClick: () => void;
  [key: string]: any;
}

const IKSCardCompact: React.FC<IKSCardCompactProps> = ({
  systemName = 'Без назви',
  systemClass = '',
  accessMode = '',
  onClick,
}) => {
  return (
    <div className='iks-card-compact' onClick={onClick}>
      <div className='iks-card-avatar'>🌐</div>
      <div className='iks-card-content'>
        <div className='iks-card-title'>{systemName}</div>
        <div className='iks-card-subtitle'>
          {systemClass} • {accessMode}
        </div>
      </div>
      <div className='iks-card-arrow'>›</div>
    </div>
  );
};

export default IKSCardCompact;
