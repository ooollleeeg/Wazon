import { useState } from 'react';
import './styles/ServicePremisesFilters.css';

interface ServicePremisesFilterValues {
  categorizationRank: string[];
  subdivisionType: string[];
}

interface ServicePremisesFiltersProps {
  onFiltersChange: (filters: ServicePremisesFilterValues) => void;
  uniqueValues: {
    categorizationRanks: string[];
    subdivisionTypes: string[];
  };
}

export default function ServicePremisesFilters({
  onFiltersChange,
  uniqueValues,
}: ServicePremisesFiltersProps) {
  const [filters, setFilters] = useState<ServicePremisesFilterValues>({
    categorizationRank: [],
    subdivisionType: [],
  });

  const handleCheckboxChange = (
    filterType: keyof ServicePremisesFilterValues,
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
    const emptyFilters: ServicePremisesFilterValues = {
      categorizationRank: [],
      subdivisionType: [],
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <div className='service-premises-filters-section'>
      <div className='filters-header'>
        <h2>🔍 Фільтри</h2>
        {activeFiltersCount > 0 && (
          <button className='reset-button' onClick={handleResetFilters}>
            Очистити ({activeFiltersCount})
          </button>
        )}
      </div>

      <div className='filters-container'>
        {/* Фільтр по категоріям */}
        <div className='filter-group'>
          <h3>Категорія ОІД</h3>
          <div className='filter-options'>
            {uniqueValues.categorizationRanks.map((rank) => (
              <label key={rank} className='filter-checkbox'>
                <input
                  type='checkbox'
                  checked={filters.categorizationRank.includes(rank)}
                  onChange={() =>
                    handleCheckboxChange('categorizationRank', rank)
                  }
                />
                <span>{rank}</span>
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
      </div>
    </div>
  );
}
