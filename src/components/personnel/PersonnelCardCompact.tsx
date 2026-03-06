interface PersonnelCardCompactProps {
  id: number;
  fullName: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  onClick: () => void;
}

export default function PersonnelCardCompact({
  fullName,
  position,
  department,
  email,
  phone,
  onClick,
}: PersonnelCardCompactProps) {
  return (
    <div className='compact-card' onClick={onClick}>
      <div className='compact-card-header'>
        <span className='avatar'>👤</span>
        <div className='compact-card-title'>
          <h4>{fullName}</h4>
          <p className='position'>{position}</p>
        </div>
      </div>
      <div className='compact-card-info'>
        {department && <span className='badge'>{department}</span>}
        {email && <span className='icon'>✉️</span>}
        {phone && <span className='icon'>📞</span>}
      </div>
    </div>
  );
}

// import './styles/PersonnelCard.css';

// interface PersonnelCardCompactProps {
//   id: number;
//   fullName: string;
//   position: string;
//   onClick: () => void;
// }

// export default function PersonnelCardCompact({
//   fullName,
//   position,
//   onClick,
// }: PersonnelCardCompactProps) {
//   return (
//     <div className='personnel-card-compact' onClick={onClick}>
//       <div className='compact-content'>
//         <h4 className='compact-name'>{fullName}</h4>
//         <p className='compact-position'>{position}</p>
//       </div>
//       <div className='compact-arrow'>→</div>
//     </div>
//   );
// }
