import { useState, useEffect } from 'react';
import ClassASCard from './ClassASCard';
import ClassASCardCompact from './ClassASCardCompact';
import './styles/ClassASList.css';

interface ClassASData {
  id: number;
  address: string;
  subdivisionName: string;
  subdivisionType: string;
  serviceName: string;
  systemClass: string;
  systemName: string;
  categorizationActDate: string;
  categorizationActNumber: string;
  kzzName: string;
  kzzSerial: string;
  antivirus: string;
  antivirusOpinionNumber: string;
  ttCreateDate: string;
  ttCreateNumber: string;
  formulaDate: string;
  formulaNumber: string;
  passportDate: string;
  passportNumber: string;
  protocolDate: string;
  protocolNumber: string;
  protocolValidUntil: string;
  kspActDate: string;
  kspActNumber: string;
  attestationRegDate: string;
  attestationRegNumber: string;
  attestationDsszziDate: string;
  attestationDsszziNumber: string;
  attestationValidUntil: string;
  documents: any[];
  protectionMeans: any[];
  software: any[];
  orders: any[];
}

interface ClassASListProps {
  searchTerm?: string;
  onEdit: (system: ClassASData) => void;
  onDelete: (id: number) => void;
  systems: ClassASData[];
  isLoading?: boolean;
}

export default function ClassASList({
  searchTerm = '',
  onEdit,
  onDelete,
  systems,
  isLoading,
}: ClassASListProps) {
  const [filteredSystems, setFilteredSystems] = useState<ClassASData[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredSystems(systems);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = systems.filter(
      (s) =>
        s.address.toLowerCase().includes(term) ||
        s.subdivisionName.toLowerCase().includes(term) ||
        s.systemName.toLowerCase().includes(term) ||
        s.serviceName.toLowerCase().includes(term) ||
        s.systemClass.toLowerCase().includes(term),
    );
    setFilteredSystems(filtered);
  }, [searchTerm, systems]);

  if (isLoading) {
    return <div className='loading'>Завантаження...</div>;
  }

  if (systems.length === 0) {
    return (
      <div className='empty-state'>
        <p>Немає даних. Додайте першу АС.</p>
      </div>
    );
  }

  const useCompactMode = filteredSystems.length > 2;
  const showCloseButton = filteredSystems.length > 2;

  return (
    <div className='class-as-list'>
      <div className='list-header'>
        <span className='count'>
          Всього: {filteredSystems.length} з {systems.length}
        </span>
      </div>

      {useCompactMode ? (
        // КОМПАКТНИЙ ВИД - Плашки
        <div className='cards-container compact-mode'>
          {filteredSystems.length > 0 ? (
            <>
              {/* Розгорнута карточка */}
              {expandedId && (
                <div className='expanded-card-wrapper'>
                  {filteredSystems
                    .filter((s) => s.id === expandedId)
                    .map((s) => (
                      <ClassASCard
                        key={s.id}
                        {...s}
                        onEdit={() => onEdit(s)}
                        onDelete={() => {
                          onDelete(s.id);
                          setExpandedId(null);
                        }}
                        showCloseButton={showCloseButton} // ✅ ПЕРЕДАЄМО ФЛАГ
                        onClose={() => setExpandedId(null)}
                      />
                    ))}
                </div>
              )}

              {/* Плашки - лише ті, що не розгорнуті */}
              <div className='compact-cards-grid'>
                {filteredSystems
                  .filter((s) => s.id !== expandedId)
                  .map((s) => (
                    <ClassASCardCompact
                      key={s.id}
                      {...s}
                      onClick={() => setExpandedId(s.id)}
                    />
                  ))}
              </div>
            </>
          ) : (
            <div className='no-results'>
              <p>Результатів не знайдено за запитом "{searchTerm}"</p>
            </div>
          )}
        </div>
      ) : (
        // ПОВНИЙ ВИД - Повні карточки
        <div className='cards-container full-mode'>
          {filteredSystems.length > 0 ? (
            filteredSystems.map((s) => (
              <ClassASCard
                key={s.id}
                {...s}
                onEdit={() => onEdit(s)}
                onDelete={() => onDelete(s.id)}
              />
            ))
          ) : (
            <div className='no-results'>
              <p>Результатів не знайдено за запитом "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
