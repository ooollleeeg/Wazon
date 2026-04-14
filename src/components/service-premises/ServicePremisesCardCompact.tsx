import './styles/ServicePremisesCardCompact.css';

interface ServicePremisesCardCompactProps {
  id: number;
  subdivisionName: string;
  premisesNumber: string;
  address: string;
  onClick: () => void;
}

export default function ServicePremisesCardCompact({
  subdivisionName,
  premisesNumber,
  address,
  onClick,
}: ServicePremisesCardCompactProps) {
  return (
    <div className='service-premises-compact-card' onClick={onClick}>
      <div className='service-premises-compact-avatar'>🏠</div>
      <div className='service-premises-compact-content'>
        <h4 className='service-premises-compact-subdivision'>
          {subdivisionName}
        </h4>
        <p className='service-premises-compact-premises'>{premisesNumber}</p>
        <p className='service-premises-compact-address'>{address}</p>
      </div>
      <div className='service-premises-compact-arrow'>›</div>
    </div>
  );
}
