import React, { useEffect, useState } from 'react';
import GenericList from '../common/GenericList';
import GenericForm from '../common/GenericForm';
import ProtectionMeansFilters from './ProtectionMeansFilters';
import ProtectionMeansTable from './ProtectionMeansTable';
import ProtectionMeansModal from './ProtectionMeansModal';
import '../../styles/ProtectionMeansTab.css';

const ProtectionMeansTab = () => {
  const [allMeans, setAllMeans] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    departmentType: '',
    search: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMean, setSelectedMean] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
      setError(err.message);
      console.error('❌ Error fetching protection means:', err);
    } finally {
      setLoading(false);
    }
  };

  // Завантаж при монтуванні або зміні фільтрів
  useEffect(() => {
    fetchData();
  }, [filters]);

  // Обробник зміни фільтрів
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Обробник перегляду деталей
  const handleViewDetails = (mean) => {
    setSelectedMean(mean);
    setShowModal(true);
  };

  // Обробник закриття модалі
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMean(null);
  };

  // Обробник отримання переходу до об'єкта
  const handleNavigateToObject = (mean) => {
    if (mean.objectType === 'AS') {
      window.location.hash = '#class-as-systems';
    } else if (mean.objectType === 'SP') {
      window.location.hash = '#service-premises';
    } else if (mean.objectType === 'KRT') {
      window.location.hash = '#krt';
    } else if (mean.objectType === 'IKS') {
      window.location.hash = '#iks';
    }

    // Зберегти objectId для прокрутки у локальному сховищі
    if (mean.objectId) {
      sessionStorage.setItem('scrollToObjectId', mean.objectId);
      sessionStorage.setItem('scrollToSectionId', 'protectionMeans');
    }

    handleCloseModal();
  };

  // Обробник додавання нового засобу на складі
  const handleAddNewMean = async (formData) => {
    try {
      const response = await fetch('/api/protection-means/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Помилка при додаванні засобу');

      console.log('✅ New inventory item created');
      setShowAddForm(false);
      fetchData(); // Перезавантажуємо дані
    } catch (err) {
      setError(err.message);
      console.error('❌ Error creating inventory item:', err);
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
        + Додати засіб на складі
      </button>

      {/* Форма додавання нового засобу */}
      {showAddForm && (
        <div className='add-form-container'>
          <h3>Додавання нового засобу на складі</h3>
          <ProtectionMeansForm
            onSubmit={handleAddNewMean}
            onCancel={() => setShowAddForm(false)}
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
          searchTerm={filters.search}
        />
      )}

      {/* Модаль перегляду деталей */}
      {showModal && selectedMean && (
        <ProtectionMeansModal
          mean={selectedMean}
          onClose={handleCloseModal}
          onNavigate={handleNavigateToObject}
        />
      )}
    </div>
  );
};

/**
 * Компонент форми для додавання засобу на складі
 */
const ProtectionMeansForm = ({ onSubmit, onCancel }) => {
  const categories = [
    'Генератор радіочастотного зашумлення',
    'Фільтр електроживлення',
    'Мережевий трансформатор',
    'Генератор акустичного зашумлення',
    'Віброперетворювач',
    'Акустичний випромінювач',
    'Виріб типу "SRC-300"',
    'КЗЗ від НСД',
    'Інші вироби',
  ];

  const [formData, setFormData] = useState({
    category: '',
    name: '',
    serialNumber: '',
    invertarNumber: '',
    releaseYear: '',
    manufacturerExploitationTerm: '',
    certificateInfo: '',
    inStockDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
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
            placeholder='Наприклад: РЧЗ-100'
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
          rows='3'
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
