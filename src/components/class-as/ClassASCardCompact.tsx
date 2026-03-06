interface ClassASCardCompactProps {
  id: number;
  systemName: string;
  address: string;
  systemClass: string;
  subdivisionName?: string;
  onClick: () => void;
}

export default function ClassASCardCompact({
  systemName,
  address,
  systemClass,
  subdivisionName,
  onClick,
}: ClassASCardCompactProps) {
  return (
    <div className='compact-card' onClick={onClick}>
      <div className='compact-card-header'>
        <span className='avatar'>🖥️</span>
        <div className='compact-card-title'>
          <h4>{systemName}</h4>
          <p className='subtitle'>{systemClass}</p>
        </div>
      </div>
      <div className='compact-card-info'>
        <p className='address'>{address}</p>
        {subdivisionName && <span className='badge'>{subdivisionName}</span>}
      </div>
    </div>
  );
}

// // import React from 'react';
// import './styles/ClassASCardCompact.css';

// interface ClassASCardCompactProps {
//   id: number;
//   subdivisionName: string;
//   systemName: string;
//   systemClass: string;
//   onClick: () => void;
// }

// export default function ClassASCardCompact({
//   subdivisionName,
//   systemName,
//   systemClass,
//   onClick,
// }: ClassASCardCompactProps) {
//   return (
//     <div className='class-as-card-compact' onClick={onClick}>
//       <div className='compact-content'>
//         <h4 className='compact-title'>{subdivisionName}</h4>
//         <p className='compact-system'>{systemName}</p>
//         <span className='compact-class'>{systemClass}</span>
//       </div>
//       <div className='compact-arrow'>→</div>
//     </div>
//   );
// }
