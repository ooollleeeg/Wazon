import React from 'react';
import './styles/DuplicateErrorModal.css';

interface DuplicateErrorModalProps {
  isOpen: boolean;
  category: string;
  name: string;
  serialNumber?: string;
  duplicateLocations: Array<{
    source: string;
    objectName: string;
    objectId?: number;
    objectType?: string;
    subdivisionName?: string;
    premisesNumber?: string | number | null;
    address?: string | null;
  }>;
  onClose: () => void;
}

const DuplicateErrorModal: React.FC<DuplicateErrorModalProps> = ({
  isOpen,
  category,
  name,
  serialNumber,
  duplicateLocations,
  onClose,
}) => {
  if (!isOpen) return null;

  // Mapping source codes to display names
  const sourceNames: Record<string, string> = {
    AS: 'АС',
    SP: 'Службове приміщення',
    KRT: 'КРТ',
    IKS: 'ІКС',
    Inventory: 'На складі',
  };

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

          <p className='duplicate-error-location'>
            {duplicateLocations.some((location) => location.source === 'Inventory')
              ? 'вже перебуває на складі або встановлений на:'
              : 'вже встановлений на:'}
          </p>

          <div className='duplicate-error-details'>
            {duplicateLocations.map((location, index) => {
              const locationName = [
                location.subdivisionName,
                location.premisesNumber
                  ? `каб. ${location.premisesNumber}`
                  : '',
                location.objectName,
              ]
                .filter(Boolean)
                .join(' — ');
              return (
                <div className='detail-row' key={`${location.source}-${location.objectId ?? 'stock'}-${index}`}>
                  <span className='detail-label'>
                    {sourceNames[location.source] || location.source}:
                  </span>
                  <span className='detail-value'>
                    {location.source === 'Inventory'
                      ? 'На складі'
                      : locationName || location.objectName}
                  </span>
                </div>
              );
            })}
          </div>

          <p className='duplicate-error-note'>
            Для коректного встановлення скористайтеся функцією «Встановити на
            об’єкт» у вкладці «Засоби ТЗІ».
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
