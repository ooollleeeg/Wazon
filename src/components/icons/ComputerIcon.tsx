import React from 'react';

const ComputerIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = 'currentColor',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Monitor */}
      <rect x='2' y='3' width='20' height='14' rx='2' ry='2' />
      {/* Screen stand */}
      <path d='M12 17v4' />
      <path d='M4 21h16' />
      {/* Screen dot */}
      <circle cx='12' cy='10' r='1.5' fill={color} />
    </svg>
  );
};

export default ComputerIcon;
