import { useEffect, useState } from 'react';
import SearchControlEquipmentFilters from './SearchControlEquipmentFilters';
import SearchControlEquipmentTable from './SearchControlEquipmentTable';
import SearchControlEquipmentModal from './SearchControlEquipmentModal';
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

  const [showModal, setShowModal] = useState(false);
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

      setShowModal(false);
      setSelectedEquipment(null);
      await fetchEquipment();
    } catch (err) {
      console.error('❌ Error saving equipment:', err);
      setError('Помилка при збереженні');
    }
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

  return (
    <div className='search-control-equipment-tab'>
      <div className='equipment-header'>
        <h2>🔍 Вимірювальна та пошукова техніка</h2>

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
      </div>

      <div className='equipment-content'>
        {/* Бокова панель з фільтрами */}
        <aside className='equipment-sidebar'>
          <SearchControlEquipmentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          <button
            className='btn-add-equipment'
            onClick={() => {
              setSelectedEquipment(null);
              setShowModal(true);
            }}
          >
            + Додати одиницю техніки
          </button>
        </aside>

        {/* Основний вміст */}
        <main className='equipment-main'>
          {loading && <p className='loading-message'>⏳ Завантаження...</p>}
          {error && <p className='error-message'>❌ {error}</p>}

          {!loading && equipment.length === 0 && (
            <p className='empty-message'>Обладнання не знайдено</p>
          )}

          {!loading && equipment.length > 0 && (
            <SearchControlEquipmentTable
              equipment={equipment}
              onViewDetails={handleViewDetails}
              onDelete={handleDeleteClick}
            />
          )}
        </main>
      </div>

      {/* Модальне вікно деталей */}
      {showModal && (
        <SearchControlEquipmentModal
          equipment={selectedEquipment}
          onClose={() => setShowModal(false)}
          onSave={handleSaveEquipment}
          onDelete={() => {
            if (selectedEquipment) {
              handleDeleteClick(selectedEquipment);
              setShowModal(false);
            }
          }}
        />
      )}

      {/* Модальне вікно підтвердження видалення */}
      {showDeleteModal && equipmentToDelete && (
        <DeleteConfirmModal
          itemName={equipmentToDelete.name}
          itemDetails={`${equipmentToDelete.category} | ${equipmentToDelete.serialNumber || 'Без серійного номера'}`}
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

export default SearchControlEquipmentTab;
