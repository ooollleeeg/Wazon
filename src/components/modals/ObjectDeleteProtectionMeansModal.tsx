interface ProtectionMean {
  toolType?: string;
  name?: string;
  serialNumber?: string;
}

interface ObjectDeleteProtectionMeansModalProps {
  objectName: string;
  means: ProtectionMean[];
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ObjectDeleteProtectionMeansModal = ({
  objectName,
  means,
  isLoading,
  onConfirm,
  onCancel,
}: ObjectDeleteProtectionMeansModalProps) => {
  return (
    <div className='modal-overlay' onClick={onCancel}>
      <div className='modal-content' onClick={(event) => event.stopPropagation()}>
        <div className='modal-header'>
          <h3>Підтвердження видалення об’єкта</h3>
          <button className='modal-close' onClick={onCancel} disabled={isLoading}>
            ✕
          </button>
        </div>
        <div className='modal-body'>
          <p>
            Об’єкт <strong>{objectName}</strong> пов’язаний із КТЗІ, що містить
            ці засоби ТЗІ. Після видалення об’єкта засоби залишаться прив’язаними
            до КТЗІ.
          </p>
          <ul>
            {means.map((mean, index) => (
              <li key={`${mean.name}-${mean.serialNumber}-${index}`}>
                {mean.toolType || 'Засіб ТЗІ'} — {mean.name || 'без назви'}
                {mean.serialNumber ? ` (S/N: ${mean.serialNumber})` : ''}
              </li>
            ))}
          </ul>
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
            onClick={onConfirm}
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
