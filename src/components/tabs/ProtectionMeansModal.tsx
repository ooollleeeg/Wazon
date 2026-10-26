import { useState } from 'react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import {
  AssignedProtectionObject,
  ProtectionMean,
} from './ProtectionMeansTable';

interface ProtectionMeansModalProps {
  mean: ProtectionMean;
  onClose: () => void;
  onNavigate: (
    mean: ProtectionMean,
    object?: AssignedProtectionObject,
  ) => void;
  onEdit?: (mean: ProtectionMean) => void;
  onDelete?: () => void;
  onAssignmentChange?: () => void;
}

const ProtectionMeansModal = ({
  mean,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onAssignmentChange,
}: ProtectionMeansModalProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingAssignment, setRemovingAssignment] = useState<string | null>(
    null,
  );
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
      KTZI: 'КТЗІ',
      INVENTORY: 'Запас (склад)',
    };
    return (
      (object.objectType && map[object.objectType]) ||
      object.objectType ||
      '—'
    );
  };

  const getKtziLabel = (mean: ProtectionMean) => {
    if (!mean.ktziId) return null;

    return `КТЗІ: ${mean.ktziAddress || 'Без адреси'}, каб. ${
      mean.ktziPremisesNumber || '—'
    } — ${mean.ktziSubdivisionName || 'Без підрозділу'}`;
  };

  const handleRemoveAssignment = async (object: AssignedProtectionObject) => {
    const assignmentKey = `${object.objectType}-${object.objectId}`;
    setRemovingAssignment(assignmentKey);
    try {
      const response = await fetch(
        `/api/protection-means/${mean.id}/assignments`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectType: object.objectType,
            objectId: object.objectId,
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

      onAssignmentChange?.();
      onClose();
    } catch (err) {
      console.error('❌ Error returning protection mean to inventory:', err);
      alert(
        err instanceof Error
          ? err.message
          : 'Помилка при поверненні засобу на склад',
      );
    } finally {
      setRemovingAssignment(null);
    }
  };

  const assignedObjects: AssignedProtectionObject[] = mean.assignedObjects?.length
    ? mean.assignedObjects
    : [
        {
          objectId: mean.objectId,
          objectName: mean.objectName,
          objectType: mean.objectType,
          objectAddress: mean.objectAddress,
          premisesNumber: mean.premisesNumber,
          subdivisionName: mean.subdivisionName,
          departmentType: mean.departmentType,
          systemClass: mean.systemClass,
        },
      ];
  const uniqueStrings = (values: Array<string | undefined>) => [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];

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
            (mean.objectName || (mean.assignedObjects?.length ?? 0) > 0) && (
              <section className='modal-section'>
                <h3>🏢 Встановлено на об'єкті</h3>
                <div className='info-grid'>
                  {getKtziLabel(mean) && (
                    <div className='info-item full-width'>
                      <label>КТЗІ:</label>
                      <strong>{getKtziLabel(mean)}</strong>
                    </div>
                  )}
                  <div className='info-item'>
                    <label>Тип об'єкту:</label>
                    <strong>
                      {uniqueStrings(
                        assignedObjects.map(
                          (object) => object.objectType || mean.objectType,
                        ),
                      )
                        .map((type) =>
                          getObjectTypeLabel({ objectType: type }),
                        )
                        .join(', ') || '—'}
                    </strong>
                  </div>
                  <div className='info-item'>
                    <label>Назва об'єкту:</label>
                    <strong>
                      {uniqueStrings(
                        assignedObjects
                          .filter((object) => object.objectType !== 'SP')
                          .map((object) => object.objectName),
                      ).join(', ') || '—'}
                    </strong>
                  </div>
                  <div className='info-item'>
                    <label>Номер приміщення:</label>
                    <strong>
                      {uniqueStrings(
                        assignedObjects.map((object) => object.premisesNumber),
                      ).join(', ') ||
                        mean.ktziPremisesNumber ||
                        '—'}
                    </strong>
                  </div>
                  <div className='info-item'>
                    <label>Назва підрозділу:</label>
                    <strong>
                      {uniqueStrings(
                        assignedObjects.map((object) => object.subdivisionName),
                      ).join(', ') ||
                        mean.ktziSubdivisionName ||
                        '—'}
                    </strong>
                  </div>
                  <div className='info-item'>
                    <label>Тип підрозділу:</label>
                    <strong>
                      {uniqueStrings(
                        assignedObjects.map((object) => object.departmentType),
                      )
                        .map(getDepartmentLabel)
                        .join(', ') ||
                        getDepartmentLabel(mean.departmentType) ||
                        '—'}
                    </strong>
                  </div>
                  <div className='info-item full-width'>
                    <label>Об’єкти ({assignedObjects.length}):</label>
                    <div className='assigned-objects-list'>
                      {assignedObjects.map((object, index) => (
                        <div
                          className='assigned-object-item'
                          key={`${object.objectType}-${object.objectId}-${index}`}
                        >
                          <div>
                            <strong>
                              {object.objectType === 'SP'
                                ? `Приміщення ${object.premisesNumber || '—'}`
                                : object.objectName || 'Без назви'} (
                              {getObjectTypeLabel(object)})
                            </strong>
                            {object.subdivisionName && (
                              <span>, {object.subdivisionName}</span>
                            )}
                            {object.objectAddress && (
                              <span>, {object.objectAddress}</span>
                            )}
                          </div>
                          {object.objectId && object.objectType !== 'KTZI' && (
                            <button
                              className='btn-primary'
                              onClick={() => onNavigate(mean, object)}
                            >
                              → Перейти до{' '}
                              {object.objectType === 'SP'
                                ? `каб. ${object.premisesNumber || '—'}, ${
                                    object.subdivisionName || 'підрозділу'
                                  }`
                                : object.objectName || 'об’єкта'}
                            </button>
                          )}
                          {mean.ktziId && object.objectType !== 'KTZI' && (
                            <button
                              className='btn-remove-assignment'
                              onClick={() => handleRemoveAssignment(object)}
                              disabled={
                                removingAssignment ===
                                `${object.objectType}-${object.objectId}`
                              }
                            >
                              {removingAssignment ===
                              `${object.objectType}-${object.objectId}`
                                ? 'Повернення...'
                                : 'Відв’язати і повернути на склад'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
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
