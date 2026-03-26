import { useState, useEffect } from 'react';
import './GenericList.css';
import LoadingSpinner from './LoadingSpinner';
import { searchInObject } from '../../utils/searchUtils';

export interface ListConfig {
  searchFields: string[]; // ['fullName', 'position', 'email']
  sortFunction?: (items: any[]) => any[]; // Optional custom sort function
  CompactCardComponent: React.ComponentType<any>;
  CardComponent: React.ComponentType<any>;
  emptyMessage: string; // 'Немає даних'
  noResultsMessage: string; // 'Результатів не знайдено'
  compactThreshold?: number; // Show compact view when items >= this number (default: 1)
}

interface GenericListProps {
  config: ListConfig;
  items: any[];
  searchTerm: string;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
  isSaving?: boolean;
}

export default function GenericList({
  config,
  items,
  searchTerm,
  onEdit,
  onDelete,
  isLoading,
  isSaving = false,
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

    // ✅ Глибокий пошук по всім полям об'єкта
    const filtered = items.filter((item) => searchInObject(item, searchTerm));

    // Применяем сортировку если есть
    const sorted = config.sortFunction
      ? config.sortFunction(filtered)
      : filtered;
    setFilteredItems(sorted);
  }, [searchTerm, items, config]);

  if (isLoading || isSaving) {
    return (
      <div className='loading'>
        <LoadingSpinner
          fullScreen
          label={isSaving ? 'Збереження запису...' : 'Завантаження записів...'}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className='empty-state'>
        <p>{config.emptyMessage}</p>
      </div>
    );
  }

  // Логіка відображення:
  // - Якщо менше за compactThreshold записів: повний вид без кнопки закриття
  // - Якщо compactThreshold або більше: компактний вид з можливістю розгортання
  const compactThreshold = config.compactThreshold ?? 1;
  const isSingleCard = filteredItems.length < compactThreshold;
  const useCompactMode = filteredItems.length >= compactThreshold;

  return (
    <div className='generic-list'>
      <div className='list-header'>
        <span className='count'>
          Всього: {filteredItems.length} з {items.length}
        </span>
      </div>

      {isSingleCard ? (
        // ОДНА КАРТОЧКА - Повний вид без кнопки закриття
        <div className='cards-container single-card-mode'>
          {filteredItems.map((item) => (
            <config.CardComponent
              key={item.id}
              {...item}
              searchTerm={searchTerm}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
              showCloseButton={false}
            />
          ))}
        </div>
      ) : useCompactMode ? (
        // 2+ КАРТОЧКИ - Компактний вид з розгортанням
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
                        searchTerm={searchTerm}
                        onEdit={() => onEdit(item)}
                        onDelete={() => {
                          onDelete(item.id);
                          setExpandedId(null);
                        }}
                        onClose={() => setExpandedId(null)}
                        showCloseButton={true}
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
                      searchTerm={searchTerm}
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
        // НЕ МАЄ КАРТОЧОК
        <div className='no-results'>
          <p>{config.noResultsMessage}</p>
        </div>
      )}
    </div>
  );
}
