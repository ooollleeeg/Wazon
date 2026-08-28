import { AntivirusStats } from '../../types/antivirus';
import './styles/AntivirusFilters.css';

interface AntivirusFiltersProps {
  filters: {
    search: string;
    systemClass: string;
    subdivisionType: string;
  };
  onFilterChange: (filters: {
    search: string;
    systemClass: string;
    subdivisionType: string;
  }) => void;
  stats: AntivirusStats | null;
}

const AntivirusFilters = ({
  filters,
  onFilterChange,
  stats,
}: AntivirusFiltersProps) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, systemClass: e.target.value });
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, subdivisionType: e.target.value });
  };

  const handleReset = () => {
    onFilterChange({ search: '', systemClass: '', subdivisionType: '' });
  };

  return (
    <div className='antivirus-filters'>
      <div className='filter-group'>
        <input
          type='text'
          placeholder='🔍 Пошук по назві антивіруса, системи, підрозділу...'
          value={filters.search}
          onChange={handleSearchChange}
          className='filter-input'
        />
      </div>

      <div className='filters-row'>
        <div className='filter-group'>
          <label>Клас системи</label>
          <select
            value={filters.systemClass}
            onChange={handleClassChange}
            className='filter-select'
          >
            <option value=''>Всі класи</option>
            <option value='АС класу 1'>АС класу 1</option>
            <option value='АС класу 2'>АС класу 2</option>
            <option value='АС класу 3'>АС класу 3</option>
            <option value='ІКС класу 1'>ІКС класу 1</option>
            <option value='ІКС класу 2'>ІКС класу 2</option>
            <option value='ІКС класу 3'>ІКС класу 3</option>
          </select>
        </div>

        <div className='filter-group'>
          <label>Тип підрозділу</label>
          <select
            value={filters.subdivisionType}
            onChange={handleDepartmentChange}
            className='filter-select'
          >
            <option value=''>Всі типи</option>
            <option value='підрозділ апарату'>Підрозділи апарату</option>
            <option value='територіальний підрозділ'>
              Територіальні підрозділи
            </option>
          </select>
        </div>

        <button onClick={handleReset} className='filter-reset-btn'>
          ↻ Скинути фільтри
        </button>
      </div>
    </div>
  );
};

export default AntivirusFilters;
