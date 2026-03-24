import React from 'react';
import './LoadingSpinner.css';

export type SpinnerSize = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'medium',
  label = 'Завантаження...',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const containerClass = fullScreen ? 'spinner-fullscreen' : 'spinner-inline';

  return (
    <div className={`loading-spinner ${containerClass}`}>
      <div className={`spinner spinner-pulse spinner-${size}`}>
        <div className='pulse-ring'></div>
      </div>
      {label && <p className='spinner-label'>{label}</p>}
    </div>
  );
}
