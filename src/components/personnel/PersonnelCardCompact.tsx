import './styles/PersonnelCard.css';

interface PersonnelCardCompactProps {
  id: number;
  fullName: string;
  position: string;
  onClick: () => void;
}

export default function PersonnelCardCompact({
  fullName,
  position,
  onClick,
}: PersonnelCardCompactProps) {
  return (
    <div className='personnel-card-compact' onClick={onClick}>
      <div className='compact-content'>
        <h4 className='compact-name'>{fullName}</h4>
        <p className='compact-position'>{position}</p>
      </div>
      <div className='compact-arrow'>→</div>
    </div>
  );
}
