import '../class-as/styles/ClassASCardCompact.css';
import { highlightText } from '../../utils/searchUtils';

interface KtziCardCompactProps {
  subdivisionName?: string;
  objectTypes: string[];
  premisesNumber?: string;
  searchTerm: string;
  onClick: () => void;
}

export default function KtziCardCompact({
  subdivisionName,
  objectTypes,
  premisesNumber,
  searchTerm,
  onClick,
}: KtziCardCompactProps) {
  return (
    <div className='class-as-compact-card' onClick={onClick}>
      <div className='class-as-compact-avatar'>🏢</div>
      <div className='class-as-compact-content'>
        <h4 className='class-as-compact-name'>
          {highlightText(subdivisionName || 'Без підрозділу', searchTerm)}
        </h4>
        <p className='class-as-compact-object-type'>
          {highlightText(
            objectTypes.length ? objectTypes.join(', ') : 'Без об’єктів',
            searchTerm,
          )}
        </p>
        <p className='class-as-compact-address'>
          {premisesNumber
            ? `Приміщення ${highlightText(premisesNumber, searchTerm)}`
            : 'Приміщення не вказано'}
        </p>
      </div>
      <div className='class-as-compact-arrow'>›</div>
    </div>
  );
}
