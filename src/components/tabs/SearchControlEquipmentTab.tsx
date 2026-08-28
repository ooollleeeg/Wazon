import { useEffect, useState } from 'react';
import SearchControlEquipmentFilters from './SearchControlEquipmentFilters';
import SearchControlEquipmentTable from './SearchControlEquipmentTable';
import SearchControlEquipmentInfoModal from './SearchControlEquipmentInfoModal';
import SearchControlEquipmentModal from './SearchControlEquipmentModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import SuccessModal from '../modals/SuccessModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { getEquipmentVerificationStatus } from '../../utils/verificationStatusUtils';
import { EquipmentItem, EquipmentStats } from '../../types/equipment';
import '../../styles/SearchControlEquipmentTab.css';

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

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] =
    useState<EquipmentItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // ✅ Додано для спінера під час збереження

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

      // ✅ Calculate verification statistics based on LATEST verifications only
      const verificationsWarning = (data.items || []).filter(
        (item: EquipmentItem) => {
          const status = getEquipmentVerificationStatus(item.verifications);
          return status.status === 'warning';
        },
      ).length;

      const verificationsCritical = (data.items || []).filter(
        (item: EquipmentItem) => {
          const status = getEquipmentVerificationStatus(item.verifications);
          return status.status === 'critical' || status.status === 'expired';
        },
      ).length;

      setStats({
        ...data.stats,
        verificationsWarning,
        verificationsCritical,
      });
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

  const handleViewDetails = async (item: EquipmentItem) => {
    try {
      const response = await fetch(`/api/search-control-equipment/${item.id}`);
      if (!response.ok) throw new Error('Помилка при завантаженні деталей');
      const detailedItem = await response.json();
      setSelectedEquipment(detailedItem);
      setShowModal(true);
    } catch (err) {
      console.error('❌ Error fetching details:', err);
      setError('Помилка при завантаженні деталей');
    }
  };

  const handleSaveEquipment = async (data: Partial<EquipmentItem>) => {
    try {
      setIsSaving(true); // ✅ Показати спінер

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

      setSuccessMessage(
        selectedEquipment
          ? `Обладнання "${data.name}" успішно оновлено`
          : `Обладнання "${data.name}" успішно створено`,
      );
      setShowSuccessModal(true);
      setShowEditModal(false);
      setShowModal(false);
      setSelectedEquipment(null);
      await fetchEquipment();
    } catch (err) {
      console.error('❌ Error saving equipment:', err);
      setError('Помилка при збереженні');
    } finally {
      setIsSaving(false); // ✅ Приховати спінер
    }
  };

  const handleDeleteClick = (item: EquipmentItem) => {
    setEquipmentToDelete(item);
    setShowDeleteModal(true);
  };

  const handleEditFromInfo = () => {
    setShowModal(false);
    setShowEditModal(true);
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

      setSuccessMessage('Обладнання успішно видалено');
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      setShowModal(false);
      setEquipmentToDelete(null);
      await fetchEquipment();
    } catch (err) {
      console.error('❌ Error deleting equipment:', err);
      setError('Помилка при видаленні');
    }
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
          {stats.verificationsCritical !== undefined &&
            stats.verificationsCritical > 0 && (
              <div className='stat-card stat-critical'>
                <div className='stat-icon'>🔴</div>
                <div className='stat-value'>{stats.verificationsCritical}</div>
                <div className='stat-label'>Критично (до 7 днів)</div>
              </div>
            )}
          {stats.verificationsWarning !== undefined &&
            stats.verificationsWarning > 0 && (
              <div className='stat-card stat-warning'>
                <div className='stat-icon'>🟡</div>
                <div className='stat-value'>{stats.verificationsWarning}</div>
                <div className='stat-label'>Скоро (до 30 днів)</div>
              </div>
            )}
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
          setShowEditModal(true);
        }}
      >
        + Додати одиницю техніки
      </button>

      {/* Основний вміст з таблицею */}
      <div className='equipment-content'>
        {loading && (
          <LoadingSpinner fullScreen label='Завантаження техніки...' />
        )}
        {error && <p className='error-message'>❌ {error}</p>}

        {!loading && equipment.length === 0 && (
          <p className='empty-message'>Обладнання не знайдено</p>
        )}

        {!loading && equipment.length > 0 && (
          <SearchControlEquipmentTable
            equipment={equipment}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>

      {/* Модальне вікно інформації про обладнання */}
      {showModal && selectedEquipment && (
        <SearchControlEquipmentInfoModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowModal(false);
            setSelectedEquipment(null);
          }}
          onEdit={handleEditFromInfo}
          onDelete={() => {
            handleDeleteClick(selectedEquipment);
          }}
        />
      )}

      {/* Модальне вікно редагування */}
      {showEditModal && (
        <SearchControlEquipmentModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEquipment(null);
          }}
          onSave={handleSaveEquipment}
          isSaving={isSaving} // ✅ Передати стан спінера
        />
      )}

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

      {/* Модальне вікно успішної операції */}
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

export default SearchControlEquipmentTab;
