import { useState } from 'react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import { ProtectionMean } from './ProtectionMeansTable';

interface ProtectionMeansModalProps {
  mean: ProtectionMean;
  onClose: () => void;
  onNavigate: (mean: ProtectionMean) => void;
  onEdit?: (mean: ProtectionMean) => void;
  onDelete?: () => void;
  onReturnToInventory?: () => void;
}

const ProtectionMeansModal = ({
  mean,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onReturnToInventory,
}: ProtectionMeansModalProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [returningToInventory, setReturningToInventory] = useState(false);
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

  const formatDate = (dateStr?: string | number | null) => {
    if (!dateStr) return '—';
    const value = String(dateStr);
    if (value.includes('-')) {
      const [year, month, day] = value.split('-');
      return `${day}.${month}.${year}`;
    }
    return value;
  };

  const getDepartmentLabel = (dept?: string) => {
    const map: Record<string, string> = {
      apparatus: 'Підрозділ апарату',
      territorial: 'Територіальний підрозділ',
      in_warehouse: 'Склад',
    };
    return (dept && map[dept]) || dept || '—';
  };

  const getObjectTypeLabel = (object: { objectType?: string }) => {
    const map: Record<string, string> = {
      AS: 'АС',
      SP: 'Службове приміщення',
      KRT: 'КРТ',
      IKS: 'ІКС',
      ІКС: 'ІКС',
      INVENTORY: 'Запас (склад)',
    };
    return (
      (object.objectType && map[object.objectType]) ||
      object.objectType ||
      '—'
    );
  };

  const handleReturnToInventory = async () => {
    setReturningToInventory(true);
    try {
      const response = await fetch(
        `/api/protection-means/${mean.id}/return-to-inventory`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectType: mean.objectType,
            objectId: mean.objectId,
            name: mean.name,
            serialNumber: mean.serialNumber,
            invertarNumber: mean.invertarNumber,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Помилка при поверненні засобу на склад');
      }

      onReturnToInventory?.();
      onClose();
    } catch (err) {
      console.error('❌ Error returning protection mean to inventory:', err);
      alert(
        err instanceof Error
          ? err.message
          : 'Помилка при поверненні засобу на склад',
      );
    } finally {
      setReturningToInventory(false);
    }
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
              {(mean.inStockDate || mean.status === 'in_stock') && (
                <div className='info-item'>
                  <label>Дата надходження на склад:</label>
                  <strong>
                    {formatDate(mean.inStockDate)}
                  </strong>
                </div>
              )}
              <div className='info-item full-width'>
                <label>Примітки:</label>
                <p>{mean.notes || '—'}</p>
              </div>
            </div>
          </section>

          {/* Інформація про установку (якщо встановлено) */}
          {mean.status === 'installed' &&
            mean.objectType &&
            mean.objectId && (
              <section className='modal-section'>
                <h3>🏢 Встановлено на об'єкті</h3>
                <div className='info-grid'>
                  <div className='info-item'>
                    <label>Тип об'єкту:</label>
                    <strong>{getObjectTypeLabel(mean)}</strong>
                  </div>
                  <div className='info-item'>
                    <label>Назва об'єкту:</label>
                    <strong>
                      {mean.objectType === 'SP' ? '—' : mean.objectName || '—'}
                    </strong>
                  </div>
                  <div className='info-item'>
                    <label>Номер приміщення:</label>
                    <strong>{mean.premisesNumber || '—'}</strong>
                  </div>
                  <div className='info-item'>
                    <label>Назва підрозділу:</label>
                    <strong>{mean.subdivisionName || '—'}</strong>
                  </div>
                  <div className='info-item'>
                    <label>Тип підрозділу:</label>
                    <strong>{getDepartmentLabel(mean.departmentType)}</strong>
                  </div>
                  {mean.objectAddress && (
                    <div className='info-item'>
                      <label>Адреса:</label>
                      <strong>{mean.objectAddress}</strong>
                    </div>
                  )}
                  <div className='info-item full-width object-actions'>
                    <button
                      className='btn-primary'
                      onClick={() => onNavigate(mean)}
                    >
                      → Перейти до{' '}
                      {mean.objectType === 'SP'
                        ? `каб. ${mean.premisesNumber || '—'}, ${
                            mean.subdivisionName || 'підрозділу'
                          }`
                        : mean.objectName || 'об’єкта'}
                    </button>
                    {mean.category !== 'КЗЗ від НСД' && (
                      <button
                        className='btn-return-to-inventory'
                        onClick={handleReturnToInventory}
                        disabled={returningToInventory}
                      >
                        {returningToInventory
                          ? 'Повернення...'
                          : 'Повернути на склад'}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}
        </div>

        <div className='modal-footer'>
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
