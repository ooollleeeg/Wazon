// import React from 'react';
import './styles/ClassASCardCompact.css';

interface ClassASCardCompactProps {
  id: number;
  subdivisionName: string;
  systemName: string;
  systemClass: string;
  onClick: () => void;
}

export default function ClassASCardCompact({
  subdivisionName,
  systemName,
  systemClass,
  onClick,
}: ClassASCardCompactProps) {
  return (
    <div className='class-as-card-compact' onClick={onClick}>
      <div className='compact-content'>
        <h4 className='compact-title'>{subdivisionName}</h4>
        <p className='compact-system'>{systemName}</p>
        <span className='compact-class'>{systemClass}</span>
      </div>
      <div className='compact-arrow'>→</div>
    </div>
  );
}
