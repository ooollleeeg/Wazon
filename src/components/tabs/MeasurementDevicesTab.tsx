import { useState, useEffect } from 'react';
import '../../styles/MeasurementDevicesTab.css';

interface MeasurementDevice {
  id?: number;
  deviceName: string;
  deviceType: string;
  serialNumber: string;
  inventoryNumber: string;
  manufacturer: string;
  yearOfManufacture: string;
  certificationNumber: string;
  certificationDate: string;
  certificationValidUntil: string;
  permissionNumber: string;
  permissionDate: string;
  permissionOrganization: string;
}

export default function MeasurementDevicesTab({
  expandedItemId,
}: {
  expandedItemId?: number | null;
}) {
  const [items, setItems] = useState<MeasurementDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDevice, setEditingDevice] = useState<MeasurementDevice | null>(
    null,
  );

  // Загрузка даних з backend
  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/objects/measurement-devices');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Помилка завантаження: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Обробник збереження (додавання або редагування)
  const handleSubmit = async (formData: MeasurementDevice) => {
    try {
      setError('');

      const url = editingId
        ? `/api/objects/measurement-devices/${editingId}`
        : '/api/objects/measurement-devices';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      await fetchItems();
      setShowForm(false);
      setEditingId(null);
      setEditingDevice(null);
    } catch (err) {
      console.error('Submit error:', err);
      setError(`Помилка збереження: ${(err as Error).message}`);
    }
  };

  // Обробник видалення
  const handleDelete = async (id: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей запис?')) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/objects/measurement-devices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Помилка видалення');
      }

      await fetchItems();
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Помилка видалення: ${(err as Error).message}`);
    }
  };

  // Обробник редагування
  const handleEdit = (item: MeasurementDevice) => {
    setEditingId(item.id || null);
    setEditingDevice(item);
    setShowForm(true);
  };

  // Обробник скасування форми
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingDevice(null);
  };

  return (
    <div className='measurement-devices-tab'>
      <h2>📏 Приймально-контрольні і вимірювальні прилади</h2>

      {/* Кнопка додавання нового приладу */}
      <button
        className='btn-add-new'
        onClick={() => {
          setEditingDevice(null);
          setEditingId(null);
          setShowForm(true);
        }}
      >
        + Додати прилад
      </button>

      {/* Форма додавання/редагування */}
      {showForm && (
        <div className='add-form-container'>
          <h3>
            {editingDevice
              ? `✏️ Редагування приладу "${editingDevice.deviceName}"`
              : '➕ Додавання нового приладу'}
          </h3>
          <MeasurementDeviceForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            editingDevice={editingDevice}
          />
        </div>
      )}

      {/* Вивід помилки */}
      {error && <div className='error-message'>{error}</div>}

      {/* Список приладів */}
      {isLoading ? (
        <p>Завантаження...</p>
      ) : items.length === 0 ? (
        <p className='empty-message'>
          Немає записів про приймально-контрольні прилади. Додайте перший
          прилад.
        </p>
      ) : (
        <div className='devices-list'>
          {items.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Компонент карточки приладу
 */
interface DeviceCardProps {
  device: MeasurementDevice;
  onEdit: (device: MeasurementDevice) => void;
  onDelete: (id: number) => void;
}

const DeviceCard = ({ device, onEdit, onDelete }: DeviceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className='device-card'>
      <div
        className='device-card-header'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='device-card-title'>
          <strong>{device.deviceName}</strong>
          <span className='device-card-subtitle'>{device.deviceType}</span>
        </div>
        <span className={`device-card-arrow ${isExpanded ? 'expanded' : ''}`}>
          ▶
        </span>
      </div>

      {isExpanded && (
        <div className='device-card-content'>
          <div className='card-section'>
            <h4>📏 Основна інформація</h4>
            <div className='card-fields'>
              <div className='card-field'>
                <span className='field-label'>Назва:</span>
                <span>{device.deviceName}</span>
              </div>
              <div className='card-field'>
                <span className='field-label'>Тип:</span>
                <span>{device.deviceType}</span>
              </div>
              <div className='card-field'>
                <span className='field-label'>Серійний номер:</span>
                <span>{device.serialNumber || '—'}</span>
              </div>
              <div className='card-field'>
                <span className='field-label'>Інвентарний номер:</span>
                <span>{device.inventoryNumber || '—'}</span>
              </div>
              <div className='card-field'>
                <span className='field-label'>Виробник:</span>
                <span>{device.manufacturer || '—'}</span>
              </div>
              <div className='card-field'>
                <span className='field-label'>Рік виготовлення:</span>
                <span>{device.yearOfManufacture || '—'}</span>
              </div>
            </div>
          </div>

          <div className='card-section'>
            <h4>📋 Сертифікація</h4>
            <div className='card-fields'>
              <div className='card-field'>
                <span className='field-label'>Номер сертифіката:</span>
                <span>{device.certificationNumber || '—'}</span>
              </div>
              <div className='card-field'>
                <span className='field-label'>Дата видачі:</span>
                <span>{device.certificationDate || '—'}</span>
              </div>
              <div className='card-field'>
                <span className='field-label'>Дійсний до:</span>
                <span>{device.certificationValidUntil || '—'}</span>
              </div>
            </div>
          </div>

          <div className='card-section'>
            <h4>📝 Допуск</h4>
            <div className='card-fields'>
              <div className='card-field'>
                <span className='field-label'>Номер допуску:</span>
                <span>{device.permissionNumber || '—'}</span>
              </div>
              <div className='card-field'>
                <span className='field-label'>Дата видачі:</span>
                <span>{device.permissionDate || '—'}</span>
              </div>
              <div className='card-field'>
                <span className='field-label'>Організація:</span>
                <span>{device.permissionOrganization || '—'}</span>
              </div>
            </div>
          </div>

          <div className='card-actions'>
            <button
              className='btn-edit'
              onClick={() => onEdit(device)}
              title='Редагувати'
            >
              ✏️ Редагувати
            </button>
            <button
              className='btn-delete'
              onClick={() => device.id && onDelete(device.id)}
              title='Видалити'
            >
              🗑️ Видалити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Компонент форми для додавання/редагування приладу
 */
interface MeasurementDeviceFormProps {
  onSubmit: (formData: MeasurementDevice) => Promise<void>;
  onCancel: () => void;
  editingDevice?: MeasurementDevice | null;
}

const MeasurementDeviceForm = ({
  onSubmit,
  onCancel,
  editingDevice,
}: MeasurementDeviceFormProps) => {
  const [formData, setFormData] = useState<MeasurementDevice>({
    deviceName: editingDevice?.deviceName || '',
    deviceType: editingDevice?.deviceType || '',
    serialNumber: editingDevice?.serialNumber || '',
    inventoryNumber: editingDevice?.inventoryNumber || '',
    manufacturer: editingDevice?.manufacturer || '',
    yearOfManufacture: editingDevice?.yearOfManufacture || '',
    certificationNumber: editingDevice?.certificationNumber || '',
    certificationDate: editingDevice?.certificationDate || '',
    certificationValidUntil: editingDevice?.certificationValidUntil || '',
    permissionNumber: editingDevice?.permissionNumber || '',
    permissionDate: editingDevice?.permissionDate || '',
    permissionOrganization: editingDevice?.permissionOrganization || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.deviceName) {
      alert("Заповніть обов'язкові поля: Назва приладу");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className='measurement-device-form' onSubmit={handleSubmit}>
      <div className='form-row'>
        <div className='form-group'>
          <label>
            Назва приладу<span className='required'>*</span>
          </label>
          <input
            type='text'
            name='deviceName'
            value={formData.deviceName}
            onChange={handleChange}
            placeholder='Наприклад: Генератор сигналів'
            required
          />
        </div>

        <div className='form-group'>
          <label>Тип приладу</label>
          <input
            type='text'
            name='deviceType'
            value={formData.deviceType}
            onChange={handleChange}
            placeholder='Наприклад: Електровимірювальний'
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Серійний номер</label>
          <input
            type='text'
            name='serialNumber'
            value={formData.serialNumber}
            onChange={handleChange}
            placeholder='Наприклад: SN-2024-001'
          />
        </div>

        <div className='form-group'>
          <label>Інвентарний номер</label>
          <input
            type='text'
            name='inventoryNumber'
            value={formData.inventoryNumber}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Виробник</label>
          <input
            type='text'
            name='manufacturer'
            value={formData.manufacturer}
            onChange={handleChange}
            placeholder='Наприклад: Rohde & Schwarz'
          />
        </div>

        <div className='form-group'>
          <label>Рік виготовлення</label>
          <input
            type='text'
            name='yearOfManufacture'
            value={formData.yearOfManufacture}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-section-title'>📋 Сертифікація</div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Номер сертифіката</label>
          <input
            type='text'
            name='certificationNumber'
            value={formData.certificationNumber}
            onChange={handleChange}
            placeholder='Наприклад: УКР.С.00185694'
          />
        </div>

        <div className='form-group'>
          <label>Дата видачі сертифіката</label>
          <input
            type='date'
            name='certificationDate'
            value={formData.certificationDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Сертифікат дійсний до</label>
          <input
            type='date'
            name='certificationValidUntil'
            value={formData.certificationValidUntil}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-section-title'>📝 Допуск</div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Номер допуску</label>
          <input
            type='text'
            name='permissionNumber'
            value={formData.permissionNumber}
            onChange={handleChange}
            placeholder='Наприклад: Д-14/123'
          />
        </div>

        <div className='form-group'>
          <label>Дата видачі допуску</label>
          <input
            type='date'
            name='permissionDate'
            value={formData.permissionDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Організація, що видала допуск</label>
          <input
            type='text'
            name='permissionOrganization'
            value={formData.permissionOrganization}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-actions'>
        <button type='submit' className='btn-primary' disabled={isSubmitting}>
          💾 Зберегти
        </button>
        <button
          type='button'
          className='btn-secondary'
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Скасувати
        </button>
      </div>
    </form>
  );
};
