import './styles/PersonnelCardCompact.css';

interface PersonnelCardCompactProps {
  id: number;
  fullName: string;
  position: string;
  actualRank?: string;
  onClick: () => void;
}

export default function PersonnelCardCompact({
  fullName,
  position,
  actualRank,
  onClick,
}: PersonnelCardCompactProps) {
  return (
    <div className='personnel-compact-card' onClick={onClick}>
      <div className='personnel-compact-avatar'>👤</div>
      <div className='personnel-compact-content'>
        <h4 className='personnel-compact-name'>{fullName}</h4>
        <p className='personnel-compact-position'>{position}</p>
        {actualRank && (
          <span className='personnel-compact-rank'>{actualRank}</span>
        )}
      </div>
      <div className='personnel-compact-arrow'>›</div>
    </div>
  );
}
