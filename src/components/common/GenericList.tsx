import { useState, useEffect } from 'react';
import './GenericList.css';

export interface ListConfig {
  searchFields: string[]; // ['fullName', 'position', 'email']
  compactThreshold: number; // After how many items to switch to compact mode (default: 2)
  sortFunction?: (items: any[]) => any[]; // Optional custom sort function
  CardComponent: React.ComponentType<any>;
  CompactCardComponent: React.ComponentType<any>;
  emptyMessage: string; // 'Немає даних'
  noResultsMessage: string; // 'Результатів не знайдено'
}

interface GenericListProps {
  config: ListConfig;
  items: any[];
  searchTerm: string;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

export default function GenericList({
  config,
  items,
  searchTerm,
  onEdit,
  onDelete,
  isLoading,
}: GenericListProps) {
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    console.log(`Filtering ${items.length} items with term: "${searchTerm}"`);

    if (!searchTerm) {
      // Применяем сортировку если есть
      const sorted = config.sortFunction ? config.sortFunction(items) : items;
      setFilteredItems(sorted);
      return;
    }

    // Фільтруємо за пошуковим терміном
    const term = searchTerm.toLowerCase();
    const filtered = items.filter((item) =>
      config.searchFields.some((field) =>
        item[field]?.toString().toLowerCase().includes(term),
      ),
    );

    // Применяем сортировку если есть
    const sorted = config.sortFunction
      ? config.sortFunction(filtered)
      : filtered;
    setFilteredItems(sorted);
  }, [searchTerm, items, config]);

  if (isLoading) {
    return <div className='loading'>Завантаження...</div>;
  }

  if (items.length === 0) {
    return (
      <div className='empty-state'>
        <p>{config.emptyMessage}</p>
      </div>
    );
  }

  // Визначаємо, використовувати компактний режим
  const useCompactMode = filteredItems.length > config.compactThreshold;
  const showCloseButton = filteredItems.length > config.compactThreshold;

  return (
    <div className='generic-list'>
      <div className='list-header'>
        <span className='count'>
          Всього: {filteredItems.length} з {items.length}
        </span>
      </div>

      {useCompactMode ? (
        // КОМПАКТНИЙ ВИД - Плашки
        <div className='cards-container compact-mode'>
          {filteredItems.length > 0 ? (
            <>
              {/* Розгорнута карточка */}
              {expandedId && (
                <div className='expanded-card-wrapper'>
                  {filteredItems
                    .filter((item) => item.id === expandedId)
                    .map((item) => (
                      <config.CardComponent
                        key={item.id}
                        {...item}
                        onEdit={() => onEdit(item)}
                        onDelete={() => {
                          onDelete(item.id);
                          setExpandedId(null);
                        }}
                        onClose={() => setExpandedId(null)}
                        showCloseButton={showCloseButton}
                      />
                    ))}
                </div>
              )}

              {/* Плашки - лише ті, що не розгорнуті */}
              <div className='compact-cards-grid'>
                {filteredItems
                  .filter((item) => item.id !== expandedId)
                  .map((item) => (
                    <config.CompactCardComponent
                      key={item.id}
                      {...item}
                      onClick={() => setExpandedId(item.id)}
                    />
                  ))}
              </div>
            </>
          ) : (
            <div className='no-results'>
              <p>{config.noResultsMessage}</p>
            </div>
          )}
        </div>
      ) : (
        // ПОВНИЙ ВИД - Повні картки
        <div className='cards-container full-mode'>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <config.CardComponent
                key={item.id}
                {...item}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item.id)}
                showCloseButton={showCloseButton}
              />
            ))
          ) : (
            <div className='no-results'>
              <p>{config.noResultsMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
