import { useEffect, useState } from 'react';
import SearchControlEquipmentFilters from './SearchControlEquipmentFilters';
import SearchControlEquipmentTable from './SearchControlEquipmentTable';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import '../../styles/SearchControlEquipmentTab.css';

interface EquipmentStats {
  total: number;
  specialSearch: number;
  measurementControl: number;
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
  verifications?: Array<{
    id: number;
    certificateRegNumber: string;
    verificationDate: string;
    validUntil: string;
    verificationCost: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

const SearchControlEquipmentTab = () => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    technicalCondition: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] =
    useState<EquipmentItem | null>(null);

  // Завантажити дані
  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.technicalCondition)
        queryParams.append('technicalCondition', filters.technicalCondition);

      const response = await fetch(
        `/api/search-control-equipment?${queryParams}`,
      );
      if (!response.ok) throw new Error('Помилка при завантаженні даних');

      const data = await response.json();
      setEquipment(data.items || []);
      setStats(data.stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('❌ Error fetching equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleSaveEquipment = async (data: Partial<EquipmentItem>) => {
    try {
      const url = selectedEquipment
        ? `/api/search-control-equipment/${selectedEquipment.id}`
        : '/api/search-control-equipment';

      const method = selectedEquipment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Помилка при збереженні');

      setShowForm(false);
      setSelectedEquipment(null);
      await fetchEquipment();
    } catch (err) {
      console.error('❌ Error saving equipment:', err);
      setError('Помилка при збереженні');
    }
  };

  const handleEdit = (item: EquipmentItem) => {
    setSelectedEquipment(item);
    setShowForm(true);
  };

  const handleDeleteClick = (item: EquipmentItem) => {
    setEquipmentToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!equipmentToDelete) return;

    try {
      const response = await fetch(
        `/api/search-control-equipment/${equipmentToDelete.id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) throw new Error('Помилка при видаленні');

      setShowDeleteModal(false);
      setEquipmentToDelete(null);
      await fetchEquipment();
    } catch (err) {
      console.error('❌ Error deleting equipment:', err);
      setError('Помилка при видаленні');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedEquipment(null);
  };

  return (
    <div className='search-control-equipment-tab'>
      {/* Статистика */}
      {stats && (
        <div className='equipment-stats'>
          <div className='stat-card'>
            <div className='stat-value'>{stats.total}</div>
            <div className='stat-label'>Всього засобів</div>
          </div>
          <div className='stat-card'>
            <div className='stat-value'>{stats.specialSearch}</div>
            <div className='stat-label'>Спеціальна пошукова техніка</div>
          </div>
          <div className='stat-card'>
            <div className='stat-value'>{stats.measurementControl}</div>
            <div className='stat-label'>Контрольно-вимірювальна техніка</div>
          </div>
        </div>
      )}

      {/* Панель фільтрів */}
      <SearchControlEquipmentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Кнопка додавання */}
      <button
        className='btn-add-equipment'
        onClick={() => {
          setSelectedEquipment(null);
          setShowForm(true);
        }}
      >
        + Додати одиницю техніки
      </button>

      {/* Форма додавання/редагування */}
      {showForm && (
        <div className='add-form-container'>
          <h3>
            {selectedEquipment
              ? `✏️ Редагування техніки "${selectedEquipment.name}"`
              : '➕ Додавання нової одиниці техніки'}
          </h3>
          <EquipmentForm
            equipment={selectedEquipment}
            onSubmit={handleSaveEquipment}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Основний вміст з таблицею */}
      <div className='equipment-content'>
        {loading && <p className='loading-message'>⏳ Завантаження...</p>}
        {error && <p className='error-message'>❌ {error}</p>}

        {!loading && equipment.length === 0 && (
          <p className='empty-message'>Обладнання не знайдено</p>
        )}

        {!loading && equipment.length > 0 && (
          <SearchControlEquipmentTable
            equipment={equipment}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {/* Модальне вікно підтвердження видалення */}
      {showDeleteModal && equipmentToDelete && (
        <DeleteConfirmModal
          fullName={equipmentToDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setEquipmentToDelete(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Компонент форми для додавання/редагування техніки
 */
interface EquipmentFormProps {
  equipment: EquipmentItem | null;
  onSubmit: (data: Partial<EquipmentItem>) => Promise<void>;
  onCancel: () => void;
}

const EquipmentForm = ({
  equipment,
  onSubmit,
  onCancel,
}: EquipmentFormProps) => {
  const [formData, setFormData] = useState<Partial<EquipmentItem>>({
    category: equipment?.category || '',
    name: equipment?.name || '',
    serialNumber: equipment?.serialNumber || '',
    invertarNumber: equipment?.invertarNumber || '',
    releaseYear: equipment?.releaseYear || new Date().getFullYear(),
    technicalCondition: equipment?.technicalCondition || 'справна',
    pricePerUnit: equipment?.pricePerUnit || 0,
    notes: equipment?.notes || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'releaseYear' || name === 'pricePerUnit'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.category?.trim()) {
      alert("Заповніть обов'язкові поля: Категорія");
      return;
    }
    if (!formData.name?.trim()) {
      alert("Заповніть обов'язкові поля: Назва техніки");
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
    <form className='equipment-form' onSubmit={handleSubmit}>
      <div className='form-row'>
        <div className='form-group'>
          <label>
            Категорія<span className='required'>*</span>
          </label>
          <select
            name='category'
            value={formData.category || ''}
            onChange={handleChange}
            required
          >
            <option value=''>Виберіть категорію</option>
            <option value='спеціальна пошукова техніка'>
              Спеціальна пошукова техніка
            </option>
            <option value='контрольно-вимірювальна техніка'>
              Контрольно-вимірювальна техніка
            </option>
          </select>
        </div>

        <div className='form-group'>
          <label>
            Назва техніки<span className='required'>*</span>
          </label>
          <input
            type='text'
            name='name'
            value={formData.name || ''}
            onChange={handleChange}
            placeholder='Наприклад: Метр сигналів'
            required
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Серійний номер</label>
          <input
            type='text'
            name='serialNumber'
            value={formData.serialNumber || ''}
            onChange={handleChange}
            placeholder='SN-12345'
          />
        </div>

        <div className='form-group'>
          <label>Інвентарний номер</label>
          <input
            type='text'
            name='invertarNumber'
            value={formData.invertarNumber || ''}
            onChange={handleChange}
            placeholder='INV-67890'
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Рік випуску</label>
          <input
            type='number'
            name='releaseYear'
            value={formData.releaseYear || new Date().getFullYear()}
            onChange={handleChange}
            min='1900'
            max={new Date().getFullYear()}
          />
        </div>

        <div className='form-group'>
          <label>Технічний стан</label>
          <select
            name='technicalCondition'
            value={formData.technicalCondition || 'справна'}
            onChange={handleChange}
          >
            <option value='справна'>Справна</option>
            <option value='потребує обслуговування'>
              Потребує обслуговування
            </option>
            <option value='непридатна'>Непридатна</option>
          </select>
        </div>
      </div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Вартість за одиницю (грн)</label>
          <input
            type='number'
            name='pricePerUnit'
            value={formData.pricePerUnit || 0}
            onChange={handleChange}
            step='0.01'
            min='0'
          />
        </div>
      </div>

      <div className='form-group'>
        <label>Примітки</label>
        <textarea
          name='notes'
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder='Додаткова інформація...'
          rows={3}
        />
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

export default SearchControlEquipmentTab;
