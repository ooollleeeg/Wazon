import { useEffect, useState, useRef } from 'react';
import ProtectionMeansFilters from './ProtectionMeansFilters';
import ProtectionMeansTable, { ProtectionMean } from './ProtectionMeansTable';
import ProtectionMeansModal from './ProtectionMeansModal';
import SelectObjectModal from './SelectObjectModal';
import DuplicateErrorModal from '../modals/DuplicateErrorModal';
import SuccessModal from '../modals/SuccessModal';
import { validateBeforeSave } from '../../utils/protectionMeansValidation';
import { PROTECTION_MEANS_CATEGORIES } from '../../constants/protectionMeansCategories';
import '../../styles/ProtectionMeansTab.css';

interface Stats {
  total: number;
  installed: number;
  inStock: number;
}

const ProtectionMeansTab = () => {
  const formContainerRef = useRef<HTMLDivElement>(null);

  const [allMeans, setAllMeans] = useState<ProtectionMean[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    departmentType: '',
    search: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMean, setSelectedMean] = useState<ProtectionMean | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [meanToInstall, setMeanToInstall] = useState<ProtectionMean | null>(
    null,
  );
  const [showDuplicateError, setShowDuplicateError] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{
    category: string;
    name: string;
    serialNumber?: string;
    location: {
      source: string;
      objectName: string;
      objectId: number;
    };
  } | null>(null);

  // Загрузка даних з backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.departmentType)
        queryParams.append('departmentType', filters.departmentType);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/protection-means/all?${queryParams}`);
      if (!response.ok) throw new Error('Помилка при завантаженні даних');

      const data = await response.json();
      setAllMeans(data.items || []);
      setStats(data.stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('❌ Error fetching protection means:', err);
    } finally {
      setLoading(false);
    }
  };

  // Завантаж при монтуванні або зміні фільтрів
  useEffect(() => {
    fetchData();
  }, [filters]);

  // Прокручування до форми редагування коли вона відкривається
  useEffect(() => {
    if (showAddForm && selectedMean && formContainerRef.current) {
      setTimeout(() => {
        formContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [showAddForm, selectedMean]);

  // Обробник зміни фільтрів
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Обробник перегляду деталей
  const handleViewDetails = (mean: ProtectionMean) => {
    setSelectedMean(mean);
    setShowModal(true);
  };

  // Обробник редагування засобу зі складу
  const handleEditInventoryItem = (mean: ProtectionMean) => {
    setSelectedMean(mean);
    setShowModal(false);
    setShowAddForm(true);
  };

  // Обробник успішного видалення
  const handleDeleteSuccess = () => {
    setSuccessMessage('Засіб ТЗІ успішно видалено');
    setShowSuccessModal(true);
    fetchData();
  };

  // Обробник закриття модалі
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMean(null);
  };

  const normalizeObjectType = (type?: string) => {
    if (!type) return '';
    if (type === 'AS' || type === 'ІКС' || type === 'IKS') return type;
    if (type.includes('АС класу')) return 'AS';
    if (type === 'SP' || type === 'KRT' || type === 'INVENTORY') return type;
    return type;
  };

  // Обробник отримання переходу до об'єкта
  const handleNavigateToObject = (mean: ProtectionMean) => {
    if (!mean.objectId) {
      console.warn('No objectId found in mean:', mean);
      handleCloseModal();
      return;
    }

    const objectType = normalizeObjectType(mean.objectType);

    if (objectType === 'AS') {
      window.location.hash = `#class-a:${mean.objectId}`;
    } else if (objectType === 'SP') {
      window.location.hash = `#service-premises:${mean.objectId}`;
    } else if (objectType === 'KRT') {
      window.location.hash = `#krt:${mean.objectId}`;
    } else if (objectType === 'IKS' || objectType === 'ІКС') {
      window.location.hash = `#iks:${mean.objectId}`;
    }

    handleCloseModal();
  };

  // Обробник відкриття модалі встановлення
  const handleOpenInstallModal = (mean: ProtectionMean) => {
    setMeanToInstall(mean);
    setShowInstallModal(true);
  };

  // Обробник закриття модалі встановлення
  const handleCloseInstallModal = () => {
    setShowInstallModal(false);
    setMeanToInstall(null);
  };

  // Обробник встановлення засобу на об'єкт
  const handleInstallMean = async (
    mean: ProtectionMean,
    objectId: string,
    objectType: string,
  ) => {
    try {
      // Перевіримо дублювання перед встановленням
      const validationResult = await validateBeforeSave(
        mean.category,
        mean.serialNumber,
      );

      if (!validationResult.isValid && validationResult.duplicateAt) {
        // Показуємо помилку дублювання
        setDuplicateError({
          category: mean.category,
          name: mean.name,
          serialNumber: mean.serialNumber || '',
          location: validationResult.duplicateAt,
        });
        setShowDuplicateError(true);
        handleCloseInstallModal();
        return;
      }

      // Готуємо дані для встановлення
      const installData = {
        meanId: mean.id,
        objectId,
        objectType,
        category: mean.category, // Передаємо категорію для правильного обрання поля
      };

      // Відправляємо запит на встановлення
      const response = await fetch('/api/protection-means/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(installData),
      });

      if (!response.ok) throw new Error('Помилка при встановленні засобу');

      console.log('✅ Засіб успішно встановлено');
      handleCloseInstallModal();

      // Перезавантажуємо дані та переходимо на об'єкт
      await fetchData();

      // Навігуємо на об'єкт
      if (objectType === 'AS') {
        window.location.hash = `#class-a:${objectId}`;
      } else if (objectType === 'SP') {
        window.location.hash = `#service-premises:${objectId}`;
      } else if (objectType === 'KRT') {
        window.location.hash = `#krt:${objectId}`;
      } else if (objectType === 'IKS') {
        window.location.hash = `#iks:${objectId}`;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('❌ Error installing protection means:', err);
      throw err;
    }
  };

  // Обробник додавання або редагування засобу на складі
  const handleAddNewMean = async (formData: Record<string, any>) => {
    try {
      // Check for duplicates before submitting (тільки якщо це не редагування)
      if (!selectedMean) {
        const validationResult = await validateBeforeSave(
          formData.category,
          formData.serialNumber,
        );

        if (!validationResult.isValid && validationResult.duplicateAt) {
          // Show duplicate error modal
          setDuplicateError({
            category: formData.category,
            name: formData.name,
            serialNumber: formData.serialNumber,
            location: validationResult.duplicateAt,
          });
          setShowDuplicateError(true);
          return;
        }
      }

      // Якщо редагується существуючий запис
      if (selectedMean) {
        // Додаємо статус і ID до formData при редагуванні
        const updateData = {
          ...formData,
          id: selectedMean.id, // Передаємо ID щоб бекенд виключив цей запис з перевірки на дублювання
          status: selectedMean.status || 'in_stock', // Зберігаємо оригінальний статус
        };

        const response = await fetch(
          `/api/protection-means/inventory/${selectedMean.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          },
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Помилка при оновленні засобу');
        }

        console.log('✅ Inventory item updated');
        setSuccessMessage(`Засіб ТЗІ "${formData.name}" успішно редаговано`);
        setShowSuccessModal(true);
        setShowAddForm(false);
        setSelectedMean(null);
        fetchData();
        return;
      }

      // Якщо додається новий запис
      const response = await fetch('/api/protection-means/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Помилка при додаванні засобу');
      }

      console.log('✅ New inventory item created');
      setShowAddForm(false);
      fetchData(); // Перезавантажуємо дані
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('❌ Error with inventory item:', err);
    }
  };

  return (
    <div className='protection-means-tab'>
      <h2>🛡️ Засоби ТЗІ</h2>

      {/* Блок статистики */}
      {stats && (
        <div className='stats-card'>
          <h3>📊 Статистика</h3>
          <div className='stats-content'>
            <div className='stat-item'>
              <span className='stat-label'>Всього засобів:</span>
              <span className='stat-value'>{stats.total}</span>
            </div>
            <div className='stat-item'>
              <span className='stat-label'>Встановлено:</span>
              <span className='stat-value'>{stats.installed}</span>
            </div>
            <div className='stat-item'>
              <span className='stat-label'>На складі:</span>
              <span className='stat-value'>{stats.inStock}</span>
            </div>
          </div>
        </div>
      )}

      {/* Панель фільтрів */}
      <ProtectionMeansFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Кнопка додавання нового засобу */}
      <button className='btn-add-new' onClick={() => setShowAddForm(true)}>
        + Додати засіб на склад
      </button>

      {/* Форма додавання нового засобу */}
      {showAddForm && (
        <div className='add-form-container' ref={formContainerRef}>
          <h3>
            {selectedMean
              ? `✏️ Редагування засобу "${selectedMean.name}"`
              : '➕ Додавання нового засобу на склад'}
          </h3>
          <ProtectionMeansForm
            onSubmit={handleAddNewMean}
            onCancel={() => {
              setShowAddForm(false);
              setSelectedMean(null);
            }}
            editingMean={selectedMean}
          />
        </div>
      )}

      {/* Таблиця засобів */}
      {loading ? (
        <p>Завантаження...</p>
      ) : error ? (
        <p className='error'>{error}</p>
      ) : (
        <ProtectionMeansTable
          means={allMeans}
          onViewDetails={handleViewDetails}
          onInstall={handleOpenInstallModal}
          searchTerm={filters.search}
        />
      )}

      {/* Модаль перегляду деталей */}
      {showModal && selectedMean && (
        <ProtectionMeansModal
          mean={selectedMean}
          onClose={handleCloseModal}
          onNavigate={handleNavigateToObject}
          onEdit={handleEditInventoryItem}
          onDelete={handleDeleteSuccess}
        />
      )}

      {/* Модаль встановлення засобу */}
      {showInstallModal && meanToInstall && (
        <SelectObjectModal
          mean={meanToInstall}
          onClose={handleCloseInstallModal}
          onInstall={handleInstallMean}
        />
      )}

      {/* Модаль помилки дублювання */}
      {duplicateError && (
        <DuplicateErrorModal
          isOpen={showDuplicateError}
          category={duplicateError.category}
          name={duplicateError.name}
          serialNumber={duplicateError.serialNumber}
          duplicateLocation={duplicateError.location}
          onClose={() => {
            setShowDuplicateError(false);
            setDuplicateError(null);
          }}
        />
      )}

      {/* Модаль успішної операції */}
      <SuccessModal
        isOpen={showSuccessModal}
        message={successMessage || ''}
        onClose={() => {
          setShowSuccessModal(false);
          setSuccessMessage(null);
        }}
      />
    </div>
  );
};

/**
 * Компонент форми для додавання засобу на складі
 */
interface ProtectionMeansFormProps {
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  editingMean?: ProtectionMean | null;
}

const ProtectionMeansForm = ({
  onSubmit,
  onCancel,
  editingMean,
}: ProtectionMeansFormProps) => {
  const categories = PROTECTION_MEANS_CATEGORIES.map((cat) => cat.name);

  const [formData, setFormData] = useState({
    category: editingMean?.category || '',
    name: editingMean?.name || '',
    serialNumber: editingMean?.serialNumber || '',
    invertarNumber: editingMean?.invertarNumber || '',
    releaseYear: editingMean?.releaseYear || '',
    manufacturerExploitationTerm:
      editingMean?.manufacturerExploitationTerm || '',
    certificateInfo: editingMean?.certificateInfo || '',
    inStockDate:
      editingMean?.inStockDate || new Date().toISOString().split('T')[0],
    notes: editingMean?.notes || '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category || !formData.name) {
      alert("Заповніть обов'язкові поля: Категорія та Назва");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form className='protection-means-form' onSubmit={handleSubmit}>
      <div className='form-row'>
        <div className='form-group'>
          <label>
            Категорія<span className='required'>*</span>
          </label>
          <select
            name='category'
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value=''>Виберіть категорію</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className='form-group'>
          <label>
            Назва засобу<span className='required'>*</span>
          </label>
          <input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleChange}
            placeholder='Наприклад: ІЗ-2000'
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
            value={formData.serialNumber}
            onChange={handleChange}
            placeholder='SN-12345'
          />
        </div>

        <div className='form-group'>
          <label>Інвентарний номер</label>
          <input
            type='text'
            name='invertarNumber'
            value={formData.invertarNumber}
            onChange={handleChange}
            placeholder='INV-67890'
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Дата виготовлення</label>
          <input
            type='date'
            name='releaseYear'
            value={formData.releaseYear}
            onChange={handleChange}
          />
        </div>

        <div className='form-group'>
          <label>Термін експлуатації</label>
          <input
            type='date'
            name='manufacturerExploitationTerm'
            value={formData.manufacturerExploitationTerm}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='form-group'>
          <label>Дата надходження на склад</label>
          <input
            type='date'
            name='inStockDate'
            value={formData.inStockDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-group'>
        <label>Інформація про сертифікат</label>
        <input
          type='text'
          name='certificateInfo'
          value={formData.certificateInfo}
          onChange={handleChange}
          placeholder='АО-2024-001'
        />
      </div>

      <div className='form-group'>
        <label>Примітки</label>
        <textarea
          name='notes'
          value={formData.notes}
          onChange={handleChange}
          placeholder='Додаткова інформація...'
          rows={3}
        />
      </div>

      <div className='form-actions'>
        <button type='submit' className='btn-primary'>
          💾 Зберегти
        </button>
        <button type='button' className='btn-secondary' onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </form>
  );
};

export default ProtectionMeansTab;
