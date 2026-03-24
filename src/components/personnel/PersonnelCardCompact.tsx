import { highlightText } from '../../utils/searchUtils';
import './styles/PersonnelCardCompact.css';

interface PersonnelCardCompactProps {
  id: number;
  fullName: string;
  position: string;
  actualRank?: string;
  searchTerm?: string;
  onClick: () => void;
}

export default function PersonnelCardCompact({
  fullName,
  position,
  actualRank,
  searchTerm = '',
  onClick,
}: PersonnelCardCompactProps) {
  return (
    <div className='personnel-compact-card' onClick={onClick}>
      <div className='personnel-compact-avatar'>👤</div>
      <div className='personnel-compact-content'>
        <h4 className='personnel-compact-name'>
          {highlightText(fullName, searchTerm)}
        </h4>
        <p className='personnel-compact-position'>
          {highlightText(position, searchTerm)}
        </p>
        {actualRank && (
          <span className='personnel-compact-rank'>
            {highlightText(actualRank, searchTerm)}
          </span>
        )}
      </div>
      <div className='personnel-compact-arrow'>›</div>
    </div>
  );
}
