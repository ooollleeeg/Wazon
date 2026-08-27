import './styles/SearchControlEquipmentTable.css';
import {
  getVerificationStatus,
  getStatusIcon,
  getStatusLabel,
  formatDaysRemaining,
} from '../../utils/verificationStatusUtils';
import { EquipmentItem } from '../../types/equipment';

interface SearchControlEquipmentTableProps {
  equipment: EquipmentItem[];
  onViewDetails: (item: EquipmentItem) => Promise<void>;
}

// Helper function to get the nearest expiration date from verifications
const getNearestVerificationExpiration = (
  verifications?: Array<{ validUntil: string }>,
) => {
  if (!verifications || verifications.length === 0) return null;

  const validDates = verifications
    .map((v) => v.validUntil)
    .filter((date) => date)
    .map((date) => new Date(date).getTime())
    .sort((a, b) => a - b);

  return validDates.length > 0 ? new Date(validDates[0]) : null;
};

const SearchControlEquipmentTable = ({
  equipment,
  onViewDetails,
}: SearchControlEquipmentTableProps) => {
  return (
    <div className='search-control-table-wrapper'>
      <table className='search-control-table'>
        <thead>
          <tr>
            <th>Категорія</th>
            <th>Назва</th>
            <th>Серійний номер</th>
            <th>Рік випуску</th>
            <th>Технічний стан</th>
            <th>Ціна за одиницю</th>
            <th>Повірка</th>
            <th>Дія</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => {
            const nearestExpiration = getNearestVerificationExpiration(
              item.verifications,
            );
            const statusInfo = nearestExpiration
              ? getVerificationStatus(nearestExpiration)
              : { status: 'ok' as const, days: Infinity };

            return (
              <tr key={item.id} className={`verification-${statusInfo.status}`}>
                <td className='category'>
                  <span className='category-badge'>
                    {item.category === 'Спеціальна пошукова техніка'
                      ? '🔍 Пошукова'
                      : '📏 Вимірювальна'}
                  </span>
                </td>
                <td className='name-cell'>
                  <div className='name'>{item.name}</div>
                  {item.notes && <small className='notes'>{item.notes}</small>}
                </td>
                <td className='serial-number'>{item.serialNumber || '—'}</td>
                <td className='release-year'>{item.releaseYear || '—'}</td>
                <td className='condition'>
                  <span
                    className={`condition-badge ${item.technicalCondition.toLowerCase()}`}
                  >
                    {item.technicalCondition === 'справна'
                      ? '✓ Справна'
                      : '✗ Несправна'}
                  </span>
                </td>
                <td className='price'>
                  {item.pricePerUnit
                    ? `${Number(item.pricePerUnit).toLocaleString('uk-UA')} грн.`
                    : '—'}
                </td>
                <td className='verification-status'>
                  {item.verifications && item.verifications.length > 0 ? (
                    <span
                      className='verification-badge'
                      title={getStatusLabel(statusInfo.status)}
                    >
                      {getStatusIcon(statusInfo.status)}{' '}
                      {formatDaysRemaining(statusInfo.days)}
                    </span>
                  ) : (
                    <span className='verification-badge verification-none'>
                      —
                    </span>
                  )}
                </td>
                <td className='actions'>
                  <button
                    className='btn-details'
                    onClick={() => onViewDetails(item)}
                    title='Переглянути деталі'
                    aria-label={`Переглянути деталі для ${item.name}`}
                  >
                    👁️
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SearchControlEquipmentTable;
