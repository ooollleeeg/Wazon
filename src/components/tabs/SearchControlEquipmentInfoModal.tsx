import React from 'react';
import './styles/SearchControlEquipmentInfoModal.css';

interface Verification {
  id: number;
  certificateRegNumber: string;
  verificationDate: string;
  validUntil: string;
  verificationCost: number;
}

interface EquipmentItem {
  id: number;
  category: string;
  name: string;
  serialNumber: string;
  invertarNumber: string;
  releaseYear: number;
  technicalCondition: string;
  pricePerUnit: number;
  notes: string;
  verifications?: Verification[];
}

interface SearchControlEquipmentInfoModalProps {
  equipment: EquipmentItem | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SearchControlEquipmentInfoModal: React.FC<
  SearchControlEquipmentInfoModalProps
> = ({ equipment, onClose, onEdit, onDelete }) => {
  if (!equipment) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA');
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-content search-control-info-modal'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>{equipment.name}</h2>
          <button className='modal-close' onClick={onClose} aria-label='Close'>
            ✕
          </button>
        </div>

        <div className='modal-body'>
          {/* Основна інформація */}
          <section className='info-section'>
            <h3>📋 Основна інформація</h3>
            <div className='info-grid'>
              <div className='info-item'>
                <label>Категорія:</label>
                <strong>{equipment.category || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Назва обладнання:</label>
                <strong>{equipment.name || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Серійний номер:</label>
                <strong>{equipment.serialNumber || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Інвентарний номер:</label>
                <strong>{equipment.invertarNumber || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Рік випуску:</label>
                <strong>{equipment.releaseYear || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Технічний стан:</label>
                <strong>
                  {equipment.technicalCondition === 'справна'
                    ? '✅ Справна'
                    : '❌ Несправна'}
                </strong>
              </div>
              <div className='info-item'>
                <label>Ціна за одиницю:</label>
                <strong>
                  {equipment.pricePerUnit
                    ? `${equipment.pricePerUnit.toLocaleString('uk-UA')} грн`
                    : '—'}
                </strong>
              </div>
              {equipment.notes && (
                <div className='info-item full-width'>
                  <label>Примітки:</label>
                  <p>{equipment.notes}</p>
                </div>
              )}
            </div>
          </section>

          {/* Метрологічна повірка */}
          {equipment.category === 'Контрольно-вимірювальна техніка' &&
            equipment.verifications &&
            equipment.verifications.length > 0 && (
              <section className='info-section'>
                <h3>📊 Метрологічна повірка</h3>
                <div className='verifications-list'>
                  {equipment.verifications.map((v) => (
                    <div key={v.id} className='verification-record'>
                      <div className='verification-info'>
                        <div>
                          <label>Реєстраційний номер:</label>
                          <strong>{v.certificateRegNumber || '—'}</strong>
                        </div>
                        <div>
                          <label>Дата проведення:</label>
                          <strong>{formatDate(v.verificationDate)}</strong>
                        </div>
                        <div>
                          <label>Дійсне до:</label>
                          <strong>{formatDate(v.validUntil)}</strong>
                        </div>
                        {v.verificationCost && (
                          <div>
                            <label>Вартість:</label>
                            <strong>
                              {v.verificationCost.toLocaleString('uk-UA')} грн
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>

        <div className='modal-footer'>
          <button className='btn-edit' onClick={onEdit}>
            ✏️ Редагувати
          </button>
          <button className='btn-delete' onClick={onDelete}>
            🗑️ Видалити
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchControlEquipmentInfoModal;
