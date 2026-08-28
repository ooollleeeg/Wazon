import { useEffect, useState } from 'react';
import AntivirusStats from './AntivirusStats';
import AntivirusFilters from './AntivirusFilters';
import AntivirusTable from './AntivirusTable';
import AntivirusEditModal from './AntivirusEditModal';
import LoadingSpinner from '../common/LoadingSpinner';
import SuccessModal from '../modals/SuccessModal';
import {
  AntivirusItem,
  AntivirusStats as AntivirusStatsType,
} from '../../types/antivirus';
import '../../styles/AntivirusTab.css';

const AntivirusTab = () => {
  const [items, setItems] = useState<AntivirusItem[]>([]);
  const [stats, setStats] = useState<AntivirusStatsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    systemClass: '',
    subdivisionType: '',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAntivirus, setSelectedAntivirus] = useState<string | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Завантажити дані
  const fetchAntivirusData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/antivirus');
      if (!response.ok) throw new Error('Помилка при завантаженні даних');

      const data = await response.json();
      setItems(data.items || []);
      setStats(data.stats || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('❌ Error fetching antivirus data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAntivirusData();
  }, []);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleEditAntivirus = (antivirusName: string) => {
    setSelectedAntivirus(antivirusName);
    setShowEditModal(true);
  };

  const handleSaveAntivirus = async (data: {
    opinionNumber: string;
    opinionDate: string;
  }) => {
    if (!selectedAntivirus) return;

    try {
      setIsSaving(true);

      const response = await fetch('/api/antivirus/update-opinion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          antivirusName: selectedAntivirus,
          opinionNumber: data.opinionNumber || null,
          opinionDate: data.opinionDate || null,
        }),
      });

      if (!response.ok) throw new Error('Помилка при збереженні');

      const result = await response.json();
      setSuccessMessage(
        `Експертний висновок для "${selectedAntivirus}" успішно оновлено (${result.updated.total} об'єктів)`,
      );
      setShowSuccessModal(true);
      setShowEditModal(false);
      setSelectedAntivirus(null);
      await fetchAntivirusData();
    } catch (err) {
      console.error('❌ Error saving antivirus:', err);
      setError('Помилка при збереженні');
    } finally {
      setIsSaving(false);
    }
  };

  // Фільтрувати дані
  const filteredItems = items.filter((item) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !item.antivirus.toLowerCase().includes(searchLower) &&
        !item.systemName.toLowerCase().includes(searchLower) &&
        !item.subdivisionName.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (filters.systemClass && item.systemClass !== filters.systemClass) {
      return false;
    }
    if (
      filters.subdivisionType &&
      item.subdivisionType !== filters.subdivisionType
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className='antivirus-tab'>
      {error && <div className='error-banner'>❌ {error}</div>}

      {/* Статистика */}
      {stats && !loading && <AntivirusStats stats={stats} />}

      {/* Спінер при завантаженні */}
      {loading && <LoadingSpinner />}

      {/* Фільтри */}
      {!loading && (
        <AntivirusFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          stats={stats}
        />
      )}

      {/* Таблиця */}
      {!loading && (
        <AntivirusTable
          items={filteredItems}
          onEditAntivirus={handleEditAntivirus}
        />
      )}

      {/* Модальне вікно редагування */}
      {showEditModal && selectedAntivirus && (
        <AntivirusEditModal
          antivirusName={selectedAntivirus}
          items={items.filter((item) => item.antivirus === selectedAntivirus)}
          onSave={handleSaveAntivirus}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAntivirus(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Модальне вікно успіху */}
      {showSuccessModal && successMessage && (
        <SuccessModal
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

export default AntivirusTab;
