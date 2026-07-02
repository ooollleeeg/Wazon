import React from 'react';
import './styles/DuplicateErrorModal.css';

interface DuplicateErrorModalProps {
  isOpen: boolean;
  category: string;
  name: string;
  serialNumber?: string;
  duplicateLocation: {
    source: string;
    objectName: string;
    objectId: number;
  };
  onClose: () => void;
}

const DuplicateErrorModal: React.FC<DuplicateErrorModalProps> = ({
  isOpen,
  category,
  name,
  serialNumber,
  duplicateLocation,
  onClose,
}) => {
  if (!isOpen) return null;

  // Mapping source codes to display names
  const sourceNames: Record<string, string> = {
    AS: 'Ас класу',
    SP: 'Службове приміщення',
    KRT: 'КРТ',
    IKS: 'ІКС',
  };

  const sourceDisplay =
    sourceNames[duplicateLocation.source] || duplicateLocation.source;

  return (
    <div className='duplicate-error-modal-overlay' onClick={onClose}>
      <div
        className='duplicate-error-modal'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='duplicate-error-modal-header'>
          <h3>⚠️ Неможливо зберегти засіб ТЗІ</h3>
          <button className='duplicate-error-modal-close' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='duplicate-error-modal-body'>
          <p className='duplicate-error-message'>
            <strong>{category}</strong> "{name}"
            {serialNumber && <> (S/N: {serialNumber})</>}
          </p>

          <p className='duplicate-error-location'>вже встановлений на:</p>

          <div className='duplicate-error-details'>
            <div className='detail-row'>
              <span className='detail-label'>Тип об'єкту:</span>
              <span className='detail-value'>{sourceDisplay}</span>
            </div>
            <div className='detail-row'>
              <span className='detail-label'>Назва об'єкту:</span>
              <span className='detail-value'>
                {duplicateLocation.objectName}
              </span>
            </div>
            <div className='detail-row'>
              <span className='detail-label'>ID об'єкту:</span>
              <span className='detail-value'>
                #{duplicateLocation.objectId}
              </span>
            </div>
          </div>

          <p className='duplicate-error-note'>
            Для додавання цього засобу спочатку видаліть його з іншого об'єкту.
          </p>
        </div>

        <div className='duplicate-error-modal-footer'>
          <button className='duplicate-error-modal-button' onClick={onClose}>
            Розумію
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateErrorModal;
