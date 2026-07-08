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
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, category: e.target.value });
  };

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, technicalCondition: e.target.value });
  };

  return (
    <div className='search-control-filters'>
      <div className='filters-section'>
        <h3>🔍 Фільтри</h3>

        {/* Пошук */}
        <div className='filter-group'>
          <label htmlFor='search'>Пошук</label>
          <input
            id='search'
            type='text'
            placeholder='Назва, серійний номер, рік...'
            value={filters.search}
            onChange={handleSearchChange}
            className='filter-input'
          />
          <small>Пошук по всіх полях</small>
        </div>

        {/* Категорія */}
        <div className='filter-group'>
          <label htmlFor='category'>Категорія</label>
          <select
            id='category'
            value={filters.category}
            onChange={handleCategoryChange}
            className='filter-select'
          >
            <option value=''>Усі категорії</option>
            <option value='Спеціальна пошукова техніка'>
              Спеціальна пошукова техніка
            </option>
            <option value='Контрольно-вимірювальна техніка'>
              Контрольно-вимірювальна техніка
            </option>
          </select>
        </div>

        {/* Технічний стан */}
        <div className='filter-group'>
          <label htmlFor='condition'>Технічний стан</label>
          <select
            id='condition'
            value={filters.technicalCondition}
            onChange={handleConditionChange}
            className='filter-select'
          >
            <option value=''>Всі</option>
            <option value='справна'>Справна</option>
            <option value='несправна'>Несправна</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchControlEquipmentFilters;
