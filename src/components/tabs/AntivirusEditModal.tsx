import { useState } from 'react';
import { AntivirusItem } from '../../types/antivirus';
import './styles/AntivirusEditModal.css';

interface AntivirusEditModalProps {
  antivirusName: string;
  items: AntivirusItem[];
  onSave: (data: { opinionNumber: string; opinionDate: string }) => void;
  onClose: () => void;
  isSaving: boolean;
}

const AntivirusEditModal = ({
  antivirusName,
  items,
  onSave,
  onClose,
  isSaving,
}: AntivirusEditModalProps) => {
  const [formData, setFormData] = useState({
    opinionNumber: items[0]?.antivirusOpinionNumber || '',
    opinionDate: items[0]?.antivirusOpinionDate || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const affectedCount = {
    classA: items.filter((i) => i.sourceTable === 'class_a_systems').length,
    iks: items.filter((i) => i.sourceTable === 'iks').length,
  };

  return (
    <div className='antivirus-modal-overlay' onClick={onClose}>
      <div
        className='antivirus-modal-content'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='antivirus-modal-header'>
          <h2>✏️ Редагування експертного висновку</h2>
          <button className='modal-close-btn' onClick={onClose}>
            ✕
          </button>
        </div>

        <div className='antivirus-modal-body'>
          {/* Інформація про антивірус */}
          <div className='antivirus-info-box'>
            <h3>🦠 {antivirusName}</h3>
            <p>
              Це оновлення буде застосовано до <strong>{items.length}</strong>{' '}
              об'єктів:
            </p>
            <ul className='affected-list'>
              <li>🖥️ АС класу: {affectedCount.classA} об'єктів</li>
              <li>🌐 ІКС: {affectedCount.iks} об'єктів</li>
            </ul>
          </div>

          {/* Форма редагування */}
          <form onSubmit={handleSubmit} className='antivirus-edit-form'>
            <div className='form-group'>
              <label htmlFor='opinionNumber'>
                📋 Номер експертного висновку
              </label>
              <input
                id='opinionNumber'
                type='text'
                name='opinionNumber'
                value={formData.opinionNumber}
                onChange={handleInputChange}
                placeholder='Наприклад: 12345'
                className='form-input'
              />
            </div>

            <div className='form-group'>
              <label htmlFor='opinionDate'>📅 Дата експертного висновку</label>
              <input
                id='opinionDate'
                type='date'
                name='opinionDate'
                value={formData.opinionDate}
                onChange={handleInputChange}
                className='form-input'
              />
            </div>

            {/* Список об'єктів */}
            <div className='form-group objects-list-group'>
              <label>🏢 Об'єкти, які будуть оновлені:</label>
              <div className='objects-list-container'>
                <table className='objects-list-table'>
                  <thead>
                    <tr>
                      <th>Тип</th>
                      <th>Назва системи</th>
                      <th>Клас</th>
                      <th>Підрозділ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={`obj-${idx}`} className='object-row'>
                        <td className='type-cell'>
                          {item.sourceTable === 'class_a_systems'
                            ? '🖥️ АС'
                            : '🌐 ІКС'}
                        </td>
                        <td className='name-cell'>{item.systemName}</td>
                        <td className='class-cell'>{item.systemClass}</td>
                        <td className='subdivision-cell'>
                          {item.subdivisionName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className='antivirus-modal-footer'>
              <button
                type='button'
                className='btn-cancel'
                onClick={onClose}
                disabled={isSaving}
              >
                ❌ Скасувати
              </button>
              <button type='submit' className='btn-save' disabled={isSaving}>
                {isSaving ? '⏳ Збереження...' : "✅ Оновити на всіх об'єктах"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AntivirusEditModal;
