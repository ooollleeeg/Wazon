import { useState, useEffect } from 'react';
import './styles/SearchControlEquipmentModal.css';
import LoadingSpinner from '../common/LoadingSpinner'; // ✅ Імпортувати спінер

interface Verification {
  id: number;
  deviceName: string;
  serialNumber: string;
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
  pricePerUnit: string; // ✅ Змінено на string для точності
  notes: string;
  verifications?: Verification[];
}

interface SearchControlEquipmentModalProps {
  equipment: EquipmentItem | null;
  onClose: () => void;
  onSave: (data: Partial<EquipmentItem>) => void;
  isSaving?: boolean; // ✅ Додано для спінера
}

const SearchControlEquipmentModal = ({
  equipment,
  onClose,
  onSave,
  isSaving = false, // ✅ Значення за замовчуванням
}: SearchControlEquipmentModalProps) => {
  const [formData, setFormData] = useState<Partial<EquipmentItem>>({
    category: '',
    name: '',
    serialNumber: '',
    invertarNumber: '',
    releaseYear: new Date().getFullYear(),
    technicalCondition: 'справна',
    pricePerUnit: '', // ✅ Змінено на пустий рядок
    notes: '',
  });

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [newVerification, setNewVerification] = useState<Partial<Verification>>(
    {
      deviceName: '',
      serialNumber: '',
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
        name === 'releaseYear'
          ? parseInt(value) || 0
          : name === 'pricePerUnit'
            ? value // ✅ Зберегти як рядок для точності
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
    let fieldValue: string | number = value;

    // Правильно обробити числові поля
    if (field === 'verificationCost') {
      fieldValue = value ? parseFloat(value) : 0;
    }

    const updatedVerification = {
      ...newVerification,
      [field]: fieldValue,
    };

    // Автоматично заповнювати "дійсне до" коли встановлюється дата реєстрації
    if (field === 'verificationDate' && value) {
      const registrationDate = new Date(value);
      const expiryDate = new Date(
        registrationDate.getFullYear() + 1,
        registrationDate.getMonth(),
        registrationDate.getDate(),
      );
      // Форматування дати у формат YYYY-MM-DD для input type="date"
      const year = expiryDate.getFullYear();
      const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
      const day = String(expiryDate.getDate()).padStart(2, '0');
      updatedVerification.validUntil = `${year}-${month}-${day}`;
    }

    setNewVerification(updatedVerification);
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
    if (
      !newVerification.deviceName ||
      !newVerification.serialNumber ||
      !newVerification.verificationDate ||
      !newVerification.validUntil
    ) {
      setErrors({
        verification:
          "Обов'язкові поля: назва засобу, серійний номер, дата реєстрації свідоцтва та дата дійсності",
      });
      return;
    }

    if (!equipment?.id) {
      console.error('Equipment ID is missing');
      setErrors({ verification: 'ID обладнання не знайдено' });
      return;
    }

    try {
      // Переконатися, що verificationCost є числом
      const verificationData = {
        ...newVerification,
        verificationCost:
          typeof newVerification.verificationCost === 'number'
            ? newVerification.verificationCost
            : parseFloat(String(newVerification.verificationCost)) || 0,
      };

      console.log('📤 Відправка повірки:', verificationData);

      const response = await fetch(
        `/api/search-control-equipment/${equipment.id}/verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verificationData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка при додаванні повірки');
      }

      const result = await response.json();
      console.log('✅ Повірка успішно додана:', result);

      setVerifications([
        ...verifications,
        { ...verificationData, id: result.id } as Verification,
      ]);
      setNewVerification({
        deviceName: '',
        serialNumber: '',
        certificateRegNumber: '',
        verificationDate: '',
        validUntil: '',
        verificationCost: 0,
      });
      setErrors({});
    } catch (err) {
      console.error('❌ Error adding verification:', err);
      setErrors({
        verification:
          err instanceof Error ? err.message : 'Помилка при додаванні повірки',
      });
    }
  };

  const handleDeleteVerification = async (verificationId: number) => {
    if (!equipment?.id) {
      console.error('Equipment ID is missing');
      return;
    }

    try {
      console.log(
        `🗑️ Видалення повірки ${verificationId} з обладнання ${equipment.id}`,
      );

      const response = await fetch(
        `/api/search-control-equipment/${equipment.id}/verification/${verificationId}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Помилка при видаленні повірки');
      }

      console.log('✅ Повірка успішно видалена');
      setVerifications(verifications.filter((v) => v.id !== verificationId));
    } catch (err) {
      console.error('❌ Error deleting verification:', err);
      setErrors({
        verification:
          err instanceof Error ? err.message : 'Помилка при видаленні повірки',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Перевірити, чи є незбережена повірка в формі
    let finalVerifications = [...verifications];
    if (
      newVerification.deviceName ||
      newVerification.serialNumber ||
      newVerification.verificationDate ||
      newVerification.validUntil
    ) {
      // Перевалідувати незбережену повірку перед збереженням
      if (
        !newVerification.deviceName ||
        !newVerification.serialNumber ||
        !newVerification.verificationDate ||
        !newVerification.validUntil
      ) {
        setErrors({
          verification:
            "Обов'язкові поля: назва засобу, серійний номер, дата реєстрації свідоцтва та дата дійсності",
        });
        return;
      }
      // Додати незбережену повірку до масиву
      finalVerifications.push({
        ...newVerification,
        id: 0, // ID = 0 означає нова повірка (сервер розпізнає це)
      } as Verification);
    }

    onSave({
      ...formData,
      verifications: finalVerifications,
    });
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
          {/* ✅ Діабл форму під час збереження */}
          <fieldset disabled={isSaving}>
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
                {errors.name && (
                  <span className='error-text'>{errors.name}</span>
                )}
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
                            <strong>Назва та умовне позначення засобу:</strong>{' '}
                            {v.deviceName || '—'}
                          </div>
                          <div>
                            <strong>Серійний номер:</strong>{' '}
                            {v.serialNumber || '—'}
                          </div>
                          <div>
                            <strong>Реєстраційний номер:</strong>{' '}
                            {v.certificateRegNumber || '—'}
                          </div>
                          <div>
                            <strong>Дата реєстрації свідоцтва:</strong>{' '}
                            {v.verificationDate}
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
                    <label htmlFor='deviceName'>
                      Назва та умовне позначення засобу *
                    </label>
                    <input
                      id='deviceName'
                      type='text'
                      value={newVerification.deviceName || ''}
                      onChange={(e) =>
                        handleVerificationChange(e, 'deviceName')
                      }
                      placeholder='Вкажіть назву та позначення засобу'
                      className='form-control'
                    />
                  </div>

                  <div className='form-group'>
                    <label htmlFor='serialNumber'>Серійний номер *</label>
                    <input
                      id='serialNumber'
                      type='text'
                      value={newVerification.serialNumber || ''}
                      onChange={(e) =>
                        handleVerificationChange(e, 'serialNumber')
                      }
                      placeholder='S/N'
                      className='form-control'
                    />
                  </div>

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
                      <label htmlFor='verDate'>
                        Дата реєстрації свідоцтва *
                      </label>
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
                        readOnly
                        title='Автоматично заповнюється на основі дати реєстрації свідоцтва'
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
          </fieldset>{' '}
          {/* ✅ Закрити fieldset */}
          {/* Кнопки дій */}
          <div className='modal-actions'>
            {isSaving ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                }}
              >
                <LoadingSpinner /> {/* ✅ Показати спінер під час збереження */}
                <span>Збереження...</span>
              </div>
            ) : (
              <>
                <button type='submit' className='btn-primary'>
                  💾 Зберегти
                </button>
                <button
                  type='button'
                  className='btn-secondary'
                  onClick={onClose}
                >
                  ✕ Скасувати
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchControlEquipmentModal;
