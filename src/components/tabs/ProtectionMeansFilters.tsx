interface FiltersState {
  category: string;
  status: string;
  departmentType: string;
  search: string;
}

interface ProtectionMeansFiltersProps {
  filters: FiltersState;
  onFilterChange: (filters: FiltersState) => void;
}

const ProtectionMeansFilters = ({ filters, onFilterChange }: ProtectionMeansFiltersProps) => {
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

  const departmentTypes = [
    { value: 'apparatus', label: 'Апарат' },
    { value: 'territorial', label: 'Територіальні підрозділи' },
    { value: 'in_warehouse', label: 'На складі' },
  ];

  const statuses = [
    { value: 'installed', label: 'Встановлено' },
    { value: 'in_stock', label: 'На складі' },
  ];

  const handleCategoryChange = (category: string) => {
    const newCategory = filters.category === category ? '' : category;
    onFilterChange({ ...filters, category: newCategory });
  };

  const handleStatusChange = (status: string) => {
    const newStatus = filters.status === status ? '' : status;
    onFilterChange({ ...filters, status: newStatus });
  };

  const handleDepartmentTypeChange = (dept: string) => {
    const newDept = filters.departmentType === dept ? '' : dept;
    onFilterChange({ ...filters, departmentType: newDept });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleClearFilters = () => {
    onFilterChange({
      category: '',
      status: '',
      departmentType: '',
      search: '',
    });
  };

  return (
    <div className='protection-means-filters'>
      <div className='filters-header'>
        <h3>🔍 Фільтри</h3>
        {(filters.category ||
          filters.status ||
          filters.departmentType ||
          filters.search) && (
          <button className='btn-clear-filters' onClick={handleClearFilters}>
            ↻ Очистити фільтри
          </button>
        )}
      </div>

      <div className='search-box'>
        <input
          type='text'
          placeholder='Пошук по всіх полях (назва, серійний номер, інвентарний номер, сертифікат, дати, примітки)...'
          value={filters.search}
          onChange={handleSearchChange}
          className='search-input'
        />
      </div>

      <div className='filters-row'>
        {/* Фільтр по категоріях */}
        <div className='filter-group'>
          <label className='filter-label'>Категорія засобу:</label>
          <div className='filter-options'>
            {categories.map((cat) => (
              <label key={cat} className='filter-checkbox'>
                <input
                  type='checkbox'
                  checked={filters.category === cat}
                  onChange={() => handleCategoryChange(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Фільтр по статусу */}
        <div className='filter-group'>
          <label className='filter-label'>Статус:</label>
          <div className='filter-options'>
            {statuses.map((status) => (
              <label key={status.value} className='filter-checkbox'>
                <input
                  type='checkbox'
                  checked={filters.status === status.value}
                  onChange={() => handleStatusChange(status.value)}
                />
                <span>{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Фільтр по типу підрозділу */}
        <div className='filter-group'>
          <label className='filter-label'>Тип підрозділу:</label>
          <div className='filter-options'>
            {departmentTypes.map((dept) => (
              <label key={dept.value} className='filter-checkbox'>
                <input
                  type='checkbox'
                  checked={filters.departmentType === dept.value}
                  onChange={() => handleDepartmentTypeChange(dept.value)}
                />
                <span>{dept.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectionMeansFilters;
