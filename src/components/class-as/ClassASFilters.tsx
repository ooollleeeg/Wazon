import { useState } from 'react';
import './styles/ClassASFilters.css';

interface ClassASFilterValues {
  systemClass: string[];
  subdivisionType: string[];
  objectType: string[];
}

interface ClassASFiltersProps {
  onFiltersChange: (filters: ClassASFilterValues) => void;
  uniqueValues: {
    systemClasses: string[];
    subdivisionTypes: string[];
    objectTypes: string[];
  };
}

export default function ClassASFilters({
  onFiltersChange,
  uniqueValues,
}: ClassASFiltersProps) {
  const [filters, setFilters] = useState<ClassASFilterValues>({
    systemClass: [],
    subdivisionType: [],
    objectType: [],
  });

  const handleCheckboxChange = (
    filterType: keyof ClassASFilterValues,
    value: string,
  ) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [filterType]: prev[filterType].includes(value)
          ? prev[filterType].filter((v) => v !== value)
          : [...prev[filterType], value],
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const handleResetFilters = () => {
    const emptyFilters: ClassASFilterValues = {
      systemClass: [],
      subdivisionType: [],
      objectType: [],
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <div className='class-as-filters-section'>
      <div className='filters-header'>
        <h2>🔍 Фільтри</h2>
        {activeFiltersCount > 0 && (
          <button className='reset-button' onClick={handleResetFilters}>
            Очистити ({activeFiltersCount})
          </button>
        )}
      </div>

      <div className='filters-container'>
        {/* Фільтр по класам АС */}
        <div className='filter-group'>
          <h3>Клас системи</h3>
          <div className='filter-options'>
            {uniqueValues.systemClasses.map((systemClass) => (
              <label key={systemClass} className='filter-checkbox'>
                <input
                  type='checkbox'
                  checked={filters.systemClass.includes(systemClass)}
                  onChange={() =>
                    handleCheckboxChange('systemClass', systemClass)
                  }
                />
                <span>{systemClass}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Фільтр по типам підрозділів */}
        <div className='filter-group'>
          <h3>Тип підрозділу</h3>
          <div className='filter-options'>
            {uniqueValues.subdivisionTypes.map((subdivisionType) => (
              <label key={subdivisionType} className='filter-checkbox'>
                <input
                  type='checkbox'
                  checked={filters.subdivisionType.includes(subdivisionType)}
                  onChange={() =>
                    handleCheckboxChange('subdivisionType', subdivisionType)
                  }
                />
                <span>{subdivisionType}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Фільтр по типам об'єктів */}
        <div className='filter-group'>
          <h3>Тип об'єкта</h3>
          <div className='filter-options'>
            {uniqueValues.objectTypes.map((objectType) => (
              <label key={objectType} className='filter-checkbox'>
                <input
                  type='checkbox'
                  checked={filters.objectType.includes(objectType)}
                  onChange={() =>
                    handleCheckboxChange('objectType', objectType)
                  }
                />
                <span>{objectType}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
