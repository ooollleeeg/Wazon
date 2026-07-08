import { useState, useEffect } from 'react';
import './styles/SearchControlEquipmentModal.css';

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

interface SearchControlEquipmentModalProps {
  equipment: EquipmentItem | null;
  onClose: () => void;
  onSave: (data: Partial<EquipmentItem>) => void;
  onDelete: () => void;
}

const SearchControlEquipmentModal = ({
  equipment,
  onClose,
  onSave,
  onDelete,
}: SearchControlEquipmentModalProps) => {
  const [formData, setFormData] = useState<Partial<EquipmentItem>>({
    category: '',
    name: '',
    serialNumber: '',
    invertarNumber: '',
    releaseYear: new Date().getFullYear(),
    technicalCondition: 'справна',
    pricePerUnit: 0,
    notes: '',
  });

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [newVerification, setNewVerification] = useState<Partial<Verification>>(
    {
      certificateRegNumber: '',
      verificationDate: '',
      validUntil: '',
      verificationCost: 0,
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
      setVerifications(equipment.verifications || []);
    }
  }, [equipment]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === 'releaseYear' || name === 'pricePerUnit'
          ? parseFloat(value)
          : value,
    });
    // Очистити помилку при зміні поля
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleVerificationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const { value } = e.target;
    setNewVerification({
      ...newVerification,
      [field]: field === 'verificationCost' ? parseFloat(value) : value,
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category?.trim()) {
      newErrors.category = "Категорія обов'язкова";
    }
    if (!formData.name?.trim()) {
      newErrors.name = "Назва обов'язкова";
    }
    if (!formData.technicalCondition) {
      newErrors.technicalCondition = "Технічний стан обов'язковий";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVerification = async () => {
    if (!newVerification.verificationDate || !newVerification.validUntil) {
      setErrors({
        verification: "Обов'язкові поля: дата повірки та дата дійсності",
      });
      return;
    }

    if (!equipment?.id) {
      console.error('Equipment ID is missing');
      return;
    }

    try {
      const response = await fetch(
        `/api/search-control-equipment/${equipment.id}/verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newVerification),
        },
      );

      if (!response.ok) throw new Error('Помилка при додаванні повірки');

      const result = await response.json();
      setVerifications([
        ...verifications,
        { ...newVerification, id: result.id } as Verification,
      ]);
      setNewVerification({
        certificateRegNumber: '',
        verificationDate: '',
        validUntil: '',
        verificationCost: 0,
      });
      setErrors({});
    } catch (err) {
      console.error('❌ Error adding verification:', err);
      setErrors({ verification: 'Помилка при додаванні повірки' });
    }
  };

  const handleDeleteVerification = async (verificationId: number) => {
    if (!equipment?.id) return;

    try {
      const response = await fetch(
        `/api/search-control-equipment/${equipment.id}/verification/${verificationId}`,
        { method: 'DELETE' },
      );

      if (!response.ok) throw new Error('Помилка при видаленні повірки');

      setVerifications(verifications.filter((v) => v.id !== verificationId));
    } catch (err) {
      console.error('❌ Error deleting verification:', err);
      setErrors({ verification: 'Помилка при видаленні повірки' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSave(formData);
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-content search-control-modal'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>
            {equipment?.id ? '✏️ Редагувати обладнання' : '➕ Нове обладнання'}
          </h2>
          <button className='modal-close' onClick={onClose} aria-label='Close'>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className='equipment-form'>
          {/* Основна інформація */}
          <section className='form-section'>
            <h3>📋 Основна інформація</h3>

            <div className='form-group'>
              <label htmlFor='category'>Категорія *</label>
              <select
                id='category'
                name='category'
                value={formData.category || ''}
                onChange={handleInputChange}
                className={`form-control ${errors.category ? 'error' : ''}`}
              >
                <option value=''>Виберіть категорію</option>
                <option value='Спеціальна пошукова техніка'>
                  Спеціальна пошукова техніка
                </option>
                <option value='Контрольно-вимірювальна техніка'>
                  Контрольно-вимірювальна техніка
                </option>
              </select>
              {errors.category && (
                <span className='error-text'>{errors.category}</span>
              )}
            </div>

            <div className='form-group'>
              <label htmlFor='name'>Назва обладнання *</label>
              <input
                id='name'
                type='text'
                name='name'
                value={formData.name || ''}
                onChange={handleInputChange}
                placeholder='Вкажіть назву обладнання'
                className={`form-control ${errors.name ? 'error' : ''}`}
              />
              {errors.name && <span className='error-text'>{errors.name}</span>}
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='serialNumber'>Серійний номер</label>
                <input
                  id='serialNumber'
                  type='text'
                  name='serialNumber'
                  value={formData.serialNumber || ''}
                  onChange={handleInputChange}
                  placeholder='S/N'
                  className='form-control'
                />
              </div>

              <div className='form-group'>
                <label htmlFor='invertarNumber'>Інвентарний номер</label>
                <input
                  id='invertarNumber'
                  type='text'
                  name='invertarNumber'
                  value={formData.invertarNumber || ''}
                  onChange={handleInputChange}
                  placeholder='Інв. номер'
                  className='form-control'
                />
              </div>
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='releaseYear'>Рік випуску</label>
                <input
                  id='releaseYear'
                  type='number'
                  name='releaseYear'
                  value={formData.releaseYear || new Date().getFullYear()}
                  onChange={handleInputChange}
                  className='form-control'
                />
              </div>

              <div className='form-group'>
                <label htmlFor='technicalCondition'>Технічний стан *</label>
                <select
                  id='technicalCondition'
                  name='technicalCondition'
                  value={formData.technicalCondition || 'справна'}
                  onChange={handleInputChange}
                  className={`form-control ${errors.technicalCondition ? 'error' : ''}`}
                >
                  <option value='справна'>Справна</option>
                  <option value='несправна'>Несправна</option>
                </select>
                {errors.technicalCondition && (
                  <span className='error-text'>
                    {errors.technicalCondition}
                  </span>
                )}
              </div>
            </div>

            <div className='form-group'>
              <label htmlFor='pricePerUnit'>Ціна за одиницю (грн)</label>
              <input
                id='pricePerUnit'
                type='number'
                name='pricePerUnit'
                value={formData.pricePerUnit || ''}
                onChange={handleInputChange}
                placeholder='0.00'
                step='0.01'
                className='form-control'
              />
            </div>

            <div className='form-group'>
              <label htmlFor='notes'>Примітки</label>
              <textarea
                id='notes'
                name='notes'
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder='Додаткова інформація...'
                rows={3}
                className='form-control'
              />
            </div>
          </section>

          {/* Метрологічна повірка (тільки для контрольно-вимірювальної техніки) */}
          {formData.category === 'Контрольно-вимірювальна техніка' && (
            <section className='form-section'>
              <h3>📊 Метрологічна повірка</h3>

              {errors.verification && (
                <div className='error-message'>{errors.verification}</div>
              )}

              {/* Список повірок */}
              {verifications.length > 0 && (
                <div className='verifications-list'>
                  <h4>Записи про повірку:</h4>
                  {verifications.map((v) => (
                    <div key={v.id} className='verification-record'>
                      <div className='verification-info'>
                        <div>
                          <strong>Реєстраційний номер:</strong>{' '}
                          {v.certificateRegNumber || '—'}
                        </div>
                        <div>
                          <strong>Дата проведення:</strong> {v.verificationDate}
                        </div>
                        <div>
                          <strong>Дійсне до:</strong> {v.validUntil}
                        </div>
                        {v.verificationCost && (
                          <div>
                            <strong>Вартість:</strong>{' '}
                            {v.verificationCost.toLocaleString('uk-UA')} грн
                          </div>
                        )}
                      </div>
                      <button
                        type='button'
                        className='btn-delete-small'
                        onClick={() => handleDeleteVerification(v.id)}
                        aria-label='Видалити повірку'
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Форма додавання нової повірки */}
              <div className='new-verification-form'>
                <h4>Додати нову повірку</h4>
                <div className='form-group'>
                  <label htmlFor='certRegNumber'>
                    Реєстраційний номер свідоцтва
                  </label>
                  <input
                    id='certRegNumber'
                    type='text'
                    value={newVerification.certificateRegNumber || ''}
                    onChange={(e) =>
                      handleVerificationChange(e, 'certificateRegNumber')
                    }
                    placeholder='№ свідоцтва'
                    className='form-control'
                  />
                </div>

                <div className='form-row'>
                  <div className='form-group'>
                    <label htmlFor='verDate'>Дата проведення повірки *</label>
                    <input
                      id='verDate'
                      type='date'
                      value={newVerification.verificationDate || ''}
                      onChange={(e) =>
                        handleVerificationChange(e, 'verificationDate')
                      }
                      className='form-control'
                    />
                  </div>

                  <div className='form-group'>
                    <label htmlFor='validUntil'>Дійсне до *</label>
                    <input
                      id='validUntil'
                      type='date'
                      value={newVerification.validUntil || ''}
                      onChange={(e) =>
                        handleVerificationChange(e, 'validUntil')
                      }
                      className='form-control'
                    />
                  </div>
                </div>

                <div className='form-group'>
                  <label htmlFor='verCost'>Вартість повірки (грн)</label>
                  <input
                    id='verCost'
                    type='number'
                    value={newVerification.verificationCost || ''}
                    onChange={(e) =>
                      handleVerificationChange(e, 'verificationCost')
                    }
                    placeholder='0.00'
                    step='0.01'
                    className='form-control'
                  />
                </div>

                <button
                  type='button'
                  className='btn-add-verification'
                  onClick={handleAddVerification}
                >
                  + Додати повірку
                </button>
              </div>
            </section>
          )}

          {/* Кнопки дій */}
          <div className='modal-actions'>
            <button type='submit' className='btn-primary'>
              ✓ Зберегти
            </button>
            {equipment?.id && (
              <button type='button' className='btn-danger' onClick={onDelete}>
                🗑️ Видалити
              </button>
            )}
            <button type='button' className='btn-secondary' onClick={onClose}>
              ✕ Скасувати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchControlEquipmentModal;
