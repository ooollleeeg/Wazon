import { useEffect, useState } from 'react';
import { ProtectionMean } from './ProtectionMeansTable';

interface ObjectItem {
  id: string;
  label: string;
  hasKzz?: boolean;
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

type TargetType = 'KTZI' | 'AS' | 'IKS';

const endpoints: Record<TargetType, string> = {
  KTZI: '/api/ktzi',
  AS: '/api/objects/class_a_systems',
  IKS: '/api/objects/iks',
};

const typeLabels: Record<TargetType, string> = {
  KTZI: 'КТЗІ',
  AS: 'АС',
  IKS: 'ІКС',
};

const extractList = (data: unknown): Record<string, unknown>[] => {
  const payload = data as { items?: unknown; objects?: unknown };
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.objects)) return payload.objects;
  return [];
};

const SelectObjectModal = ({
  mean,
  onClose,
  onInstall,
}: SelectObjectModalProps) => {
  const isKzz = mean.category === 'КЗЗ від НСД';
  const availableTypes: TargetType[] = isKzz ? ['AS', 'IKS'] : ['KTZI'];

  const [selectedType, setSelectedType] = useState<TargetType>(
    availableTypes[0],
  );
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setSelectedId('');
      try {
        const response = await fetch(endpoints[selectedType]);
        if (!response.ok) throw new Error("Помилка при завантаженні об'єктів");
        const list = extractList(await response.json());
        const items = list.map((obj) => {
          const id = String(obj.id ?? '');
          if (selectedType === 'KTZI') {
            const parts = [
              obj.subdivisionName,
              obj.premisesNumber ? `каб. ${obj.premisesNumber}` : '',
              obj.address,
              obj.serviceName,
            ].filter(Boolean);
            return { id, label: parts.join(', ') || `КТЗІ ${id}` };
          }
          const name = String(
            obj.systemName || obj.name || obj.serviceName || `Об'єкт ${id}`,
          );
          return {
            id,
            label: selectedType === 'AS'
              ? `${obj.subdivisionName || 'Без підрозділу'}, каб. ${
                  obj.premisesNumber || '—'
                } — ${name}`
              : name,
            hasKzz: Boolean(String(obj.kzzName || '').trim()),
          };
        });
        items.sort((a, b) => a.label.localeCompare(b.label, 'uk'));
        setObjects(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedType]);

  const handleInstall = async () => {
    if (!selectedId) {
      setError("Виберіть об'єкт");
      return;
    }
    setInstalling(true);
    try {
      await onInstall(mean, selectedId, selectedType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка встановлення');
    } finally {
      setInstalling(false);
    }
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

          {availableTypes.length > 1 && (
            <section className='modal-section'>
              <h3>🏢 Виберіть тип об'єкту</h3>
              <div className='object-type-selector'>
                {availableTypes.map((type) => (
                  <label key={type} className='radio-option'>
                    <input
                      type='radio'
                      name='objectType'
                      checked={selectedType === type}
                      onChange={() => setSelectedType(type)}
                    />
                    <span>{typeLabels[type]}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className='modal-section'>
            <h3>
              📍 {selectedType === 'KTZI'
                ? 'Виберіть КТЗІ (засоби ТЗІ встановлюються на рівні КТЗІ)'
                : "Виберіть об'єкт для встановлення"}
            </h3>
            {loading && <p className='loading'>⏳ Завантаження...</p>}
            {error && <p className='error'>❌ {error}</p>}
            {!loading && objects.length === 0 && (
              <p className='empty-state'>Немає доступних об'єктів</p>
            )}
            {!loading && objects.length > 0 && (
              <div className='object-list'>
                {objects.map((obj) => (
                  <label
                    key={obj.id}
                    className={`object-item ${obj.hasKzz ? 'disabled' : ''}`}
                  >
                    <input
                      type='radio'
                      name='object'
                      checked={selectedId === obj.id}
                      onChange={() => setSelectedId(obj.id)}
                      disabled={obj.hasKzz}
                    />
                    <span className='object-label'>
                      {obj.label}
                      {obj.hasKzz && (
                        <span className='kzz-warning'>
                          ⚠️ КЗЗ від НСД вже встановлено
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <div className='modal-footer'>
            <button
              className='btn btn-primary'
              onClick={handleInstall}
              disabled={!selectedId || installing || loading}
            >
              {installing ? '⏳ Встановлення...' : '✓ Встановити засіб'}
            </button>
            <button className='btn btn-secondary' onClick={onClose}>
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectObjectModal;
