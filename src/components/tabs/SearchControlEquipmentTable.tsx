import './styles/SearchControlEquipmentTable.css';
import {
  getStatusIcon,
  getStatusLabel,
  formatDaysRemaining,
  getEquipmentVerificationStatus,
  getLatestVerificationsPerPart,
} from '../../utils/verificationStatusUtils';
import { EquipmentItem } from '../../types/equipment';

interface SearchControlEquipmentTableProps {
  equipment: EquipmentItem[];
  onViewDetails: (item: EquipmentItem) => Promise<void>;
}

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
            // ✅ Розраховуємо статус на основі ОСТАННІХ свідоцтв
            const statusInfo = getEquipmentVerificationStatus(
              item.verifications,
            );

            // ✅ Отримуємо останні свідоцтва
            const latestVerifications = getLatestVerificationsPerPart(
              item.verifications,
            );

            // ✅ Рахуємо архівні свідоцтва
            const totalArchived = item.verifications
              ? item.verifications.length - latestVerifications.length
              : 0;

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
                  {latestVerifications.length > 0 ? (
                    <div className='verification-cell'>
                      <span
                        className='verification-badge'
                        title={getStatusLabel(statusInfo.status)}
                      >
                        {getStatusIcon(statusInfo.status)}{' '}
                        {formatDaysRemaining(statusInfo.days)}
                      </span>
                      {/* ✅ Лічильник архівних свідоцтв */}
                      {totalArchived > 0 && (
                        <span
                          className='verification-archive-badge'
                          title={`${totalArchived} архівних свідоцтв`}
                        >
                          +{totalArchived}
                        </span>
                      )}
                    </div>
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
