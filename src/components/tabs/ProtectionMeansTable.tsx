import { highlightText } from '../../utils/searchUtils';

export interface ProtectionMean {
  id: string;
  category: string;
  name: string;
  objectName?: string;
  objectAddress?: string;
  objectId?: string;
  objectType?: string;
  serialNumber?: string;
  departmentType: string;
  status: 'installed' | 'in_stock';
  [key: string]: any;
}

interface ProtectionMeansTableProps {
  means: ProtectionMean[];
  onViewDetails: (mean: ProtectionMean) => void;
  searchTerm?: string;
}

const ProtectionMeansTable = ({ means, onViewDetails, searchTerm = '' }: ProtectionMeansTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'installed':
        return <span className='badge badge-installed'>✅ Встановлено</span>;
      case 'in_stock':
        return <span className='badge badge-in-stock'>🔄 На складі</span>;
      default:
        return <span className='badge badge-unknown'>⚠️ Невідомо</span>;
    }
  };

  const getDepartmentLabel = (dept: string) => {
    const map: Record<string, string> = {
      apparatus: 'Апарат',
      territorial: 'Територіальні',
      in_warehouse: 'Склад',
    };
    return map[dept] || dept;
  };

  if (means.length === 0) {
    return (
      <div className='empty-state'>
        <p>📭 Немає записів, які відповідають вашим фільтрам</p>
      </div>
    );
  }

  return (
    <div className='protection-means-table-container'>
      <table className='protection-means-table'>
        <thead>
          <tr>
            <th>Категорія</th>
            <th>Назва засобу</th>
            <th>Об'єкт установки</th>
            <th>Тип підрозділу</th>
            <th>Серійний номер</th>
            <th>Статус</th>
            <th>Дія</th>
          </tr>
        </thead>
        <tbody>
          {means.map((mean: ProtectionMean, idx: number) => (
            <tr key={`${mean.id || mean.serialNumber || mean.name}-${idx}`} className={`mean-row mean-${mean.status}`}>
              <td className='category-cell'>
                <span className='category-badge'>
                  {highlightText(mean.category, searchTerm, `${mean.id}-cat`)}
                </span>
              </td>
              <td className='name-cell'>
                <strong>{highlightText(mean.name, searchTerm, `${mean.id}-name`)}</strong>
              </td>
              <td className='object-cell'>
                {mean.objectName ? (
                  <div>
                    <div className='object-name'>{mean.objectName}</div>
                    {mean.objectAddress && (
                      <div className='object-address'>{mean.objectAddress}</div>
                    )}
                  </div>
                ) : (
                  <span className='na'>На складі</span>
                )}
              </td>
              <td className='department-cell'>
                {getDepartmentLabel(mean.departmentType)}
              </td>
              <td className='serial-cell'>
                {mean.serialNumber
                  ? highlightText(mean.serialNumber, searchTerm, `${mean.id}-serial`)
                  : '—'}
              </td>
              <td className='status-cell'>{getStatusBadge(mean.status)}</td>
              <td className='action-cell'>
                <button
                  className='btn-view'
                  onClick={() => onViewDetails(mean)}
                  title='Переглянути деталі'
                >
                  👁️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProtectionMeansTable;
