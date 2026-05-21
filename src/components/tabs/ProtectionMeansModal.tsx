import React from 'react';

const ProtectionMeansModal = ({ mean, onClose, onNavigate }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}.${month}.${year}`;
    }
    return dateStr;
  };

  const getDepartmentLabel = (dept) => {
    const map = {
      apparatus: 'Апарат',
      territorial: 'Територіальні',
      in_warehouse: 'Склад',
    };
    return map[dept] || dept;
  };

  const getObjectTypeLabel = (type) => {
    const map = {
      AS: 'АС класу 1,2,3',
      SP: 'Службові приміщення',
      KRT: 'КРТ',
      IKS: 'ІКС',
      INVENTORY: 'Запас (склад)',
    };
    return map[type] || type;
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>{mean.name}</h2>
          <button className='modal-close' onClick={onClose}>
            ✕
          </button>
        </div>

        <div className='modal-body'>
          {/* Основна інформація про засіб */}
          <section className='modal-section'>
            <h3>📋 Інформація про засіб</h3>
            <div className='info-grid'>
              <div className='info-item'>
                <label>Категорія:</label>
                <strong>{mean.category}</strong>
              </div>
              <div className='info-item'>
                <label>Статус:</label>
                <strong>
                  {mean.status === 'installed'
                    ? '✅ Встановлено'
                    : '🔄 На складі'}
                </strong>
              </div>
              {mean.serialNumber && (
                <div className='info-item'>
                  <label>Серійний номер:</label>
                  <strong>{mean.serialNumber}</strong>
                </div>
              )}
              {mean.invertarNumber && (
                <div className='info-item'>
                  <label>Інвентарний номер:</label>
                  <strong>{mean.invertarNumber}</strong>
                </div>
              )}
              {mean.releaseYear && (
                <div className='info-item'>
                  <label>Дата виготовлення:</label>
                  <strong>{formatDate(mean.releaseYear)}</strong>
                </div>
              )}
              {mean.manufacturerExploitationTerm && (
                <div className='info-item'>
                  <label>Термін експлуатації:</label>
                  <strong>
                    {formatDate(mean.manufacturerExploitationTerm)}
                  </strong>
                </div>
              )}
              {mean.certificateInfo && (
                <div className='info-item'>
                  <label>Інформація про сертифікат:</label>
                  <strong>{mean.certificateInfo}</strong>
                </div>
              )}
              {mean.status === 'in_stock' && mean.inStockDate && (
                <div className='info-item'>
                  <label>Дата надходження:</label>
                  <strong>{formatDate(mean.inStockDate)}</strong>
                </div>
              )}
              {mean.status === 'in_stock' && mean.notes && (
                <div className='info-item full-width'>
                  <label>Примітки:</label>
                  <p>{mean.notes}</p>
                </div>
              )}
            </div>
          </section>

          {/* Інформація про установку (якщо встановлено) */}
          {mean.status === 'installed' && mean.objectName && (
            <section className='modal-section'>
              <h3>🏢 Встановлено на об'єкті</h3>
              <div className='info-grid'>
                <div className='info-item'>
                  <label>Тип об'єкту:</label>
                  <strong>{getObjectTypeLabel(mean.objectType)}</strong>
                </div>
                <div className='info-item'>
                  <label>Назва об'єкту:</label>
                  <strong>{mean.objectName}</strong>
                </div>
                {mean.objectAddress && (
                  <div className='info-item'>
                    <label>Адреса:</label>
                    <strong>{mean.objectAddress}</strong>
                  </div>
                )}
                {mean.departmentType && (
                  <div className='info-item'>
                    <label>Тип підрозділу:</label>
                    <strong>{getDepartmentLabel(mean.departmentType)}</strong>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div className='modal-footer'>
          {mean.status === 'installed' && mean.objectType !== 'INVENTORY' && (
            <button className='btn-primary' onClick={() => onNavigate(mean)}>
              → Перейти до {getObjectTypeLabel(mean.objectType)}
            </button>
          )}
          <button className='btn-secondary' onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectionMeansModal;
