import { useEffect, useState } from 'react';
import { ProtectionMean } from './ProtectionMeansTable';

interface ObjectItem {
  id: string;
  name: string;
  premisesNumber?: string;
  departmentType?: string;
  subdivisionName?: string;
  objectType?: string;
  hasKzz?: boolean;
}

interface RawObject {
  id?: string | number;
  ID?: string | number;
  systemName?: string;
  serviceName?: string;
  name?: string;
  objectName?: string;
  subdivisionName?: string;
  address?: string;
  objectAddress?: string;
  premisesNumber?: string | number;
  departmentType?: string;
  subdivisionType?: string;
  kzzName?: string | null;
}

interface SelectObjectModalProps {
  mean: ProtectionMean;
  onClose: () => void;
  onInstall: (
    mean: ProtectionMean,
    objectId: string,
    objectType: string,
  ) => Promise<void>;
}

type ObjectType = 'AS' | 'SP' | 'KRT' | 'IKS';

const SelectObjectModal = ({
  mean,
  onClose,
  onInstall,
}: SelectObjectModalProps) => {
  const objectTypeMap: Record<
    ObjectType,
    { label: string; endpoint: string }
  > = {
    AS: { label: 'АС', endpoint: '/api/objects/class_a_systems' },
    SP: {
      label: 'Службові приміщення',
      endpoint: '/api/objects/service_premises',
    },
    KRT: { label: 'КРТ', endpoint: '/api/objects/krt' },
    IKS: { label: 'ІКС', endpoint: '/api/objects/iks' },
  };

  const [selectedType, setSelectedType] = useState<ObjectType>('AS');
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [selectedObject, setSelectedObject] = useState<ObjectItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  useEffect(() => {
    const fetchObjects = async () => {
      setLoading(true);
      setError(null);
      setSelectedObject(null);
      try {
        const response = await fetch(objectTypeMap[selectedType].endpoint);
        if (!response.ok) {
          throw new Error("Помилка при завантаженні об'єктів");
        }
        const data = await response.json();
        const normalize = (
          data: unknown,
          type: ObjectType,
        ): ObjectItem[] => {
          const payload = data as { items?: unknown; objects?: unknown };
          const rawObjects = Array.isArray(data)
            ? data
            : Array.isArray(payload.items)
              ? payload.items
              : Array.isArray(payload.objects)
                ? payload.objects
                : [];
          return rawObjects.map((value) => {
            const obj = value as RawObject;
            const hasKzz =
              mean.category === 'КЗЗ від НСД' &&
              Boolean(String(obj.kzzName || '').trim());
            return {
              id: String(obj.id ?? obj.ID ?? ''),
              name: String(
                obj.systemName ||
                obj.serviceName ||
                obj.name ||
                obj.objectName ||
                obj.subdivisionName ||
                `Об'єкт ${obj.id ?? obj.ID ?? ''}`,
              ),
              premisesNumber: String(obj.premisesNumber || ''),
              departmentType: obj.departmentType || obj.subdivisionType || '',
              subdivisionName: obj.subdivisionName || '',
              objectType: type,
              hasKzz,
            };
          });
        };
        const normalized = normalize(data, selectedType);
        const sortedObjects = (items: ObjectItem[]) =>
          [...items].sort((a, b) => {
            const departmentOrder = (type?: string) =>
              type?.toLowerCase().includes('apparatus') ||
              type?.toLowerCase().includes('апарат')
                ? 0
                : 1;
            const departmentComparison =
              departmentOrder(a.departmentType) -
              departmentOrder(b.departmentType);
            if (departmentComparison !== 0) return departmentComparison;
            const primaryComparison =
              selectedType === 'IKS'
                ? a.name.localeCompare(b.name, 'uk')
                : (a.subdivisionName || '').localeCompare(
                    b.subdivisionName || '',
                    'uk',
                  );
            return (
              primaryComparison ||
              a.name.localeCompare(b.name, 'uk')
            );
          });
        setObjects(sortedObjects(normalized));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Помилка завантаження';
        setError(message);
        console.error('Error fetching objects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, [selectedType, mean.category]);

  // Отримуємо доступні типи об'єктів залежно від категорії засобу
  const getAvailableObjectTypes = (): ObjectType[] => {
    if (mean.category === 'КЗЗ від НСД') {
      return ['AS', 'IKS'];
    }
    return ['AS', 'SP', 'KRT', 'IKS'];
  };

  const availableTypes = getAvailableObjectTypes();
  const isCurrentTypeAvailable = availableTypes.includes(selectedType);

  useEffect(() => {
    if (!isCurrentTypeAvailable) {
      setSelectedType(availableTypes[0]);
    }
  }, [mean.category]);

  const handleInstall = async () => {
    if (!selectedObject) {
      setError("Виберіть об'єкт");
      return;
    }

    setInstalling(true);
    try {
      await onInstall(mean, selectedObject.id, selectedType);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Помилка встановлення';
      setError(message);
      console.error('Error installing:', err);
    } finally {
      setInstalling(false);
    }
  };

  const getObjectDisplay = (obj: ObjectItem): string => {
    if (obj.objectType === 'AS' || obj.objectType === 'KRT') {
      return `${obj.subdivisionName || 'Без підрозділу'}, каб. ${
        obj.premisesNumber || '—'
      } — ${obj.name}`;
    }
    if (obj.objectType === 'SP') {
      return `${obj.subdivisionName || 'Без підрозділу'}, каб. ${
        obj.premisesNumber || '—'
      }`;
    }
    return obj.name;
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
              {availableTypes.map((type) => (
                <label key={type} className='radio-option'>
                  <input
                    type='radio'
                    name='objectType'
                    value={type}
                    checked={selectedType === type}
                    onChange={(e) =>
                      setSelectedType(e.target.value as ObjectType)
                    }
                  />
                  <span>{objectTypeMap[type].label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Список об'єктів */}
          <section className='modal-section'>
            <h3>
              📍 Виберіть об’єкт для встановлення
            </h3>
            {loading && <p className='loading'>⏳ Завантаження об'єктів...</p>}
            {error && <p className='error'>❌ {error}</p>}
            {!loading && objects.length === 0 && (
              <p className='empty-state'>Немає доступних об'єктів цього типу</p>
            )}
            {!loading && objects.length > 0 && (
              <div className='object-list'>
                {objects.map((obj) => (
                  <div key={obj.id}>
                    <label
                      className={`object-item ${obj.hasKzz ? 'disabled' : ''}`}
                    >
                      <input
                        type='radio'
                        name='object'
                        checked={selectedObject?.id === obj.id}
                        onChange={() => setSelectedObject(obj)}
                        disabled={obj.hasKzz}
                      />
                      <span className='object-label'>
                        {getObjectDisplay(obj)}
                        {obj.hasKzz && (
                          <span className='kzz-warning'>
                            ⚠️ КЗЗ від НСД вже встановлено
                          </span>
                        )}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Кнопки дій */}
          <div className='modal-footer'>
            <button
              className='btn btn-primary'
              onClick={handleInstall}
              disabled={!selectedObject || installing || loading}
            >
              {installing ? '⏳ Встановлення...' : '✓ Встановити засіб'}
            </button>
            <button
              className='btn btn-secondary'
              onClick={onClose}
              disabled={installing}
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectObjectModal;
