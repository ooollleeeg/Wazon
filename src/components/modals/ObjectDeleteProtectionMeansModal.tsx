import { useState } from 'react';
import './styles/ObjectDeleteProtectionMeansModal.css';

interface ProtectionMean {
  toolType?: string;
  name?: string;
  serialNumber?: string;
  invertarNumber?: string;
  isSharedKtzi?: number;
  assignmentCount?: number;
}

interface ObjectDeleteProtectionMeansModalProps {
  objectName: string;
  means: ProtectionMean[];
  isLoading: boolean;
  onConfirm: (
    action: 'return' | 'remove',
    removeSharedAssignments: boolean,
  ) => void;
  onCancel: () => void;
}

const ObjectDeleteProtectionMeansModal = ({
  objectName,
  means,
  isLoading,
  onConfirm,
  onCancel,
}: ObjectDeleteProtectionMeansModalProps) => {
  const [action, setAction] = useState<'return' | 'remove'>('return');
  const [removeSharedAssignments, setRemoveSharedAssignments] =
    useState(false);
  const hasSharedMeans = means.some(
    (mean) => mean.isSharedKtzi && Number(mean.assignmentCount) > 1,
  );

  return (
    <div className='modal-overlay' onClick={onCancel}>
      <div className='modal-content' onClick={(event) => event.stopPropagation()}>
        <div className='modal-header'>
          <h3>Видалення об’єкта та засобів ТЗІ</h3>
          <button className='modal-close' onClick={onCancel} disabled={isLoading}>
            ✕
          </button>
        </div>
        <div className='modal-body'>
          <p>
            Об’єкт <strong>{objectName}</strong> містить засоби ТЗІ. Оберіть,
            що з ними зробити:
          </p>
          <ul>
            {means.map((mean, index) => (
              <li key={`${mean.name}-${mean.serialNumber}-${index}`}>
                {mean.toolType || 'Засіб ТЗІ'} — {mean.name || 'без назви'}
                {mean.serialNumber ? ` (S/N: ${mean.serialNumber})` : ''}
                {mean.isSharedKtzi && Number(mean.assignmentCount) > 1
                  ? ` — спільний для ${mean.assignmentCount} об’єктів`
                  : ''}
              </li>
            ))}
          </ul>
          <label className='object-delete-option'>
            <input
              type='radio'
              name='protectionMeansAction'
              checked={action === 'return'}
              onChange={() => setAction('return')}
            />
            Повернути засоби на склад і відв’язати їх від усіх об’єктів
          </label>
          <label className='object-delete-option'>
            <input
              type='radio'
              name='protectionMeansAction'
              checked={action === 'remove'}
              onChange={() => setAction('remove')}
            />
            Видалити засоби разом з об’єктом
          </label>
          {hasSharedMeans && action === 'remove' && (
            <label className='object-delete-option object-delete-shared-option'>
              <input
                type='checkbox'
                checked={removeSharedAssignments}
                onChange={(event) =>
                  setRemoveSharedAssignments(event.target.checked)
                }
              />
              Також видалити спільні засоби з інших об’єктів КТЗІ
            </label>
          )}
        </div>
        <div className='modal-actions'>
          <button
            className='btn-cancel'
            onClick={onCancel}
            disabled={isLoading}
          >
            Скасувати
          </button>
          <button
            className='btn-delete'
            onClick={() => onConfirm(action, removeSharedAssignments)}
            disabled={isLoading}
          >
            {isLoading ? 'Видалення...' : 'Підтвердити видалення'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObjectDeleteProtectionMeansModal;
