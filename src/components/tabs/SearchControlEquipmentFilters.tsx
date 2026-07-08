import './styles/SearchControlEquipmentFilters.css';

interface SearchControlEquipmentFiltersProps {
  filters: {
    search: string;
    category: string;
    technicalCondition: string;
  };
  onFilterChange: (filters: {
    search: string;
    category: string;
    technicalCondition: string;
  }) => void;
}

const SearchControlEquipmentFilters = ({
  filters,
  onFilterChange,
}: SearchControlEquipmentFiltersProps) => {
  const categories = [
    'Спеціальна пошукова техніка',
    'Контрольно-вимірювальна техніка',
  ];

  const conditions = [
    { value: 'справна', label: 'Справна' },
    { value: 'несправна', label: 'Несправна' },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (category: string) => {
    const newCategory = filters.category === category ? '' : category;
    onFilterChange({ ...filters, category: newCategory });
  };

  const handleConditionChange = (condition: string) => {
    const newCondition =
      filters.technicalCondition === condition ? '' : condition;
    onFilterChange({ ...filters, technicalCondition: newCondition });
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      category: '',
      technicalCondition: '',
    });
  };

  return (
    <div className='search-control-filters'>
      <div className='filters-header'>
        <h3>🔍 Фільтри</h3>
        {(filters.category || filters.technicalCondition || filters.search) && (
          <button className='btn-clear-filters' onClick={handleClearFilters}>
            ↻ Очистити фільтри
          </button>
        )}
      </div>

      <div className='search-box'>
        <input
          type='text'
          placeholder='Пошук по всіх полях (назва, серійний номер, рік, примітки)...'
          value={filters.search}
          onChange={handleSearchChange}
          className='search-input'
        />
      </div>

      <div className='filters-row'>
        {/* Категорія */}
        <div className='filter-group'>
          <label className='filter-label'>Категорія:</label>
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

        {/* Технічний стан */}
        <div className='filter-group'>
          <label className='filter-label'>Технічний стан:</label>
          <div className='filter-options'>
            {conditions.map((cond) => (
              <label key={cond.value} className='filter-checkbox'>
                <input
                  type='checkbox'
                  checked={filters.technicalCondition === cond.value}
                  onChange={() => handleConditionChange(cond.value)}
                />
                <span>{cond.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchControlEquipmentFilters;
