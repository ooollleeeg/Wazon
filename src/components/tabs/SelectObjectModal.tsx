import React, { useEffect, useState } from 'react';
import { ProtectionMean } from './ProtectionMeansTable';

interface ObjectItem {
  id: string;
  name: string;
  address?: string;
  departmentType?: string;
  objectName?: string;
  objectAddress?: string;
}

interface SelectObjectModalProps {
  mean: ProtectionMean;
  onClose: () => void;
  onInstall: (mean: ProtectionMean, objectId: string, objectType: string) => Promise<void>;
}

type ObjectType = 'AS' | 'SP' | 'KRT' | 'IKS';

const SelectObjectModal = ({ mean, onClose, onInstall }: SelectObjectModalProps) => {
  const [selectedType, setSelectedType] = useState<ObjectType>('SP');
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [selectedObject, setSelectedObject] = useState<ObjectItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  // Карта типів об'єктів
  const objectTypeMap: Record<ObjectType, { label: string; endpoint: string }> = {
    AS: { label: 'АС класу 1,2,3', endpoint: '/api/class-as-systems' },
    SP: { label: 'Службові приміщення', endpoint: '/api/service-premises' },
    KRT: { label: 'КРТ', endpoint: '/api/krt' },
    IKS: { label: 'ІКС', endpoint: '/api/iks' },
  };

  // Завантажуємо об'єкти при зміні типу
  useEffect(() => {
    const fetchObjects = async () => {
      setLoading(true);
      setError(null);
      setSelectedObject(null);
      try {
        const endpoint = objectTypeMap[selectedType].endpoint;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Помилка при завантаженні об\'єктів');

        const data = await response.json();
        // Нормалізуємо дані залежно від формату, що приходить з сервера
        const normalized = Array.isArray(data)
          ? data
          : data.items || data.objects || [];

        setObjects(normalized);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Помилка завантаження';
        setError(message);
        console.error('Error fetching objects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, [selectedType]);

  const handleInstall = async () => {
    if (!selectedObject) {
      setError("Виберіть об'єкт");
      return;
    }

    setInstalling(true);
    try {
      await onInstall(mean, selectedObject.id, selectedType);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Помилка встановлення';
      setError(message);
      console.error('Error installing:', err);
    } finally {
      setInstalling(false);
    }
  };

  const getObjectDisplay = (obj: ObjectItem): string => {
    if (selectedType === 'SP') {
      return `${obj.name} (${obj.address || 'без адреси'})`;
    }
    return obj.name || `ID: ${obj.id}`;
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>⚙️ Встановити засіб</h2>
          <button className='modal-close' onClick={onClose}>
            ✕
          </button>
        </div>

        <div className='modal-body'>
          {/* Інформація про засіб */}
          <section className='modal-section'>
            <h3>📦 Засіб для встановлення</h3>
            <div className='install-info'>
              <div className='info-item'>
                <label>Категорія:</label>
                <span>{mean.category}</span>
              </div>
              <div className='info-item'>
                <label>Назва:</label>
                <span>{mean.name}</span>
              </div>
              {mean.serialNumber && (
                <div className='info-item'>
                  <label>Серійний номер:</label>
                  <span>{mean.serialNumber}</span>
                </div>
              )}
            </div>
          </section>

          {/* Вибір типу об'єкту */}
          <section className='modal-section'>
            <h3>🏢 Виберіть тип об'єкту</h3>
            <div className='object-type-selector'>
              {(Object.keys(objectTypeMap) as ObjectType[]).map((type) => (
                <label key={type} className='radio-option'>
                  <input
                    type='radio'
                    name='objectType'
                    value={type}
                    checked={selectedType === type}
                    onChange={(e) => setSelectedType(e.target.value as ObjectType)}
                  />
                  <span>{objectTypeMap[type].label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Список об'єктів */}
          <section className='modal-section'>
            <h3>📍 Виберіть об'єкт для встановлення</h3>
            {loading && <p className='loading'>⏳ Завантаження об'єктів...</p>}
            {error && <p className='error'>❌ {error}</p>}
            {!loading && objects.length === 0 && (
              <p className='empty-state'>Немає доступних об'єктів цього типу</p>
            )}
            {!loading && objects.length > 0 && (
              <div className='object-list'>
                {objects.map((obj) => (
                  <label key={obj.id} className='object-item'>
                    <input
                      type='radio'
                      name='object'
                      checked={selectedObject?.id === obj.id}
                      onChange={() => setSelectedObject(obj)}
                    />
                    <span className='object-label'>{getObjectDisplay(obj)}</span>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Кнопки дій */}
          <div className='modal-footer'>
            <button
              className='btn btn-primary'
              onClick={handleInstall}
              disabled={!selectedObject || installing}
            >
              {installing ? '⏳ Встановлення...' : '✓ Встановити засіб'}
            </button>
            <button className='btn btn-secondary' onClick={onClose} disabled={installing}>
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectObjectModal;
