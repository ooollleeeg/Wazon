import React, { useState } from 'react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';

const ProtectionMeansModal = ({
  mean,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/protection-means/inventory/${mean.id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Помилка при видаленні засобу');
      }

      onDelete?.();
      onClose();
    } catch (err) {
      console.error('❌ Error deleting protection mean:', err);
      alert('Помилка при видаленні засобу');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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

  const isIksType = (type) => type === 'IKS' || type === 'ІКС';

  const getObjectTypeLabel = (mean) => {
    if (mean.objectType === 'AS') {
      if (mean.systemClass?.includes('АС класу')) {
        return mean.systemClass;
      }
      return `АС класу ${mean.systemClass || '1,2,3'}`;
    }

    const map = {
      SP: 'Службові приміщення',
      KRT: 'КРТ',
      IKS: 'ІКС',
      ІКС: 'ІКС',
      INVENTORY: 'Запас (склад)',
    };
    return map[mean.objectType] || mean.objectType || '—';
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
                <strong>{mean.category || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Назва:</label>
                <strong>{mean.name || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Статус:</label>
                <strong>
                  {mean.status === 'installed'
                    ? '✅ Встановлено'
                    : '🔄 На складі'}
                </strong>
              </div>
              <div className='info-item'>
                <label>Серійний номер:</label>
                <strong>{mean.serialNumber || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Інвентарний номер:</label>
                <strong>{mean.invertarNumber || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Дата виготовлення:</label>
                <strong>
                  {mean.releaseYear ? formatDate(mean.releaseYear) : '—'}
                </strong>
              </div>
              <div className='info-item'>
                <label>Термін експлуатації виробника:</label>
                <strong>
                  {mean.manufacturerExploitationTerm
                    ? formatDate(mean.manufacturerExploitationTerm)
                    : '—'}
                </strong>
              </div>
              <div className='info-item'>
                <label>Інформація про сертифікат:</label>
                <strong>{mean.certificateInfo || '—'}</strong>
              </div>
              {mean.status === 'in_stock' && (
                <div className='info-item'>
                  <label>Дата надходження на склад:</label>
                  <strong>
                    {mean.inStockDate ? formatDate(mean.inStockDate) : '—'}
                  </strong>
                </div>
              )}
              {mean.status === 'in_stock' && mean.notes && (
                <div className='info-item full-width'>
                  <label>Примітки:</label>
                  <p>{mean.notes || '—'}</p>
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
                  <strong>{getObjectTypeLabel(mean)}</strong>
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
                {mean.departmentType && !isIksType(mean.objectType) && (
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
              → Перейти до {getObjectTypeLabel(mean)}
            </button>
          )}

          {/* Кнопки для засобів на складі */}
          {mean.status === 'in_stock' && (
            <>
              <button
                className='btn-edit'
                onClick={() => onEdit?.(mean)}
                title='Редагувати засіб'
              >
                ✏️ Редагувати
              </button>
              <button
                className='btn-delete'
                onClick={handleDeleteClick}
                title='Видалити засіб зі складу'
              >
                🗑️ Видалити
              </button>
            </>
          )}
        </div>

        {/* Модаль підтвердження видалення */}
        {showDeleteConfirm && (
          <DeleteConfirmModal
            fullName={`${mean.name} (S/N: ${mean.serialNumber || '—'})`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isLoading={deleting}
          />
        )}
      </div>
    </div>
  );
};

export default ProtectionMeansModal;
