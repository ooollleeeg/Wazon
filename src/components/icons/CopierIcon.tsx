import React from 'react';

const CopierIcon: React.FC<{ size?: number; color?: string }> = ({
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
      {/* Main body */}
      <rect x='3' y='4' width='18' height='16' rx='2' ry='2' />
      {/* Top section */}
      <path d='M3 8h18' />
      {/* Paper tray */}
      <rect x='5' y='10' width='14' height='6' rx='1' ry='1' />
      {/* Papers in tray (three lines) */}
      <path d='M7 11h10' strokeWidth='1' />
      <path d='M7 13h10' strokeWidth='1' />
      <path d='M7 15h10' strokeWidth='1' />
      {/* Output tray indicator */}
      <path d='M12 20v2' />
    </svg>
  );
};

export default CopierIcon;
