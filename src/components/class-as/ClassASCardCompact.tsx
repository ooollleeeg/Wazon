import './styles/ClassASCardCompact.css';

interface ClassASCardCompactProps {
  id: number;
  systemName: string;
  address: string;
  systemClass: string;
  subdivisionName?: string;
  objectType?: string;
  isProcessingSuspended?: boolean;
  onClick: () => void;
}

export default function ClassASCardCompact({
  systemName,
  address,
  systemClass,
  subdivisionName,
  objectType,
  isProcessingSuspended = false,
  onClick,
}: ClassASCardCompactProps) {
  return (
    <div
      className={`class-as-compact-card ${isProcessingSuspended ? 'suspended' : ''}`}
      onClick={onClick}
    >
      <div className='class-as-compact-avatar'>🖥️</div>
      <div className='class-as-compact-content'>
        <h4 className='class-as-compact-name'>{systemName}</h4>
        <p className='class-as-compact-class'>{systemClass}</p>
        {objectType && (
          <p className='class-as-compact-object-type'>{objectType}</p>
        )}
        <p className='class-as-compact-address'>{address}</p>
        {subdivisionName && (
          <span className='class-as-compact-subdivision'>
            {subdivisionName}
          </span>
        )}
      </div>
      <div className='class-as-compact-arrow'>›</div>
    </div>
  );
}
