import React from 'react';
import { highlightText } from '../../utils/searchUtils';

const ProtectionMeansTable = ({ means, onViewDetails, searchTerm = '' }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'installed':
        return <span className='badge badge-installed'>✅ Встановлено</span>;
      case 'in_stock':
        return <span className='badge badge-in-stock'>🔄 На складі</span>;
      default:
        return <span className='badge badge-unknown'>⚠️ Невідомо</span>;
    }
  };

  const getDepartmentLabel = (dept) => {
    const map = {
      apparatus: 'Апарат',
      territorial: 'Територіальні',
      in_warehouse: 'Склад',
    };
    return map[dept] || dept;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    // Якщо це YYYY-MM-DD формат
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}.${month}.${year}`;
    }
    return dateStr;
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
          {means.map((mean, idx) => (
            <tr key={mean.id || idx} className={`mean-row mean-${mean.status}`}>
              <td className='category-cell'>
                <span className='category-badge'>
                  {highlightText(mean.category, searchTerm)}
                </span>
              </td>
              <td className='name-cell'>
                <strong>{highlightText(mean.name, searchTerm)}</strong>
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
                  ? highlightText(mean.serialNumber, searchTerm)
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
