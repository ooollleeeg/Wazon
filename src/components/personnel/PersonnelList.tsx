import { useState, useEffect } from 'react';
import PersonnelCard from './PersonnelCard';
import PersonnelCardCompact from './PersonnelCardCompact';
import '../styles/PersonnelList.css';

interface PersonnelData {
  id: number;
  position: string;
  officialRank: string;
  actualRank: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  mobilePhone: string;
  education: any[];
  certificates: any[];
}

interface PersonnelListProps {
  searchTerm?: string;
  onEdit: (personnel: PersonnelData) => void;
  onDelete: (id: number) => void;
  personnel: PersonnelData[];
  isLoading?: boolean;
}

export default function PersonnelList({
  searchTerm = '',
  onEdit,
  onDelete,
  personnel,
  isLoading,
}: PersonnelListProps) {
  const [filteredPersonnel, setFilteredPersonnel] = useState<PersonnelData[]>(
    [],
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredPersonnel(personnel);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = personnel.filter(
      (p) =>
        p.fullName.toLowerCase().includes(term) ||
        p.position.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term),
    );
    setFilteredPersonnel(filtered);
  }, [searchTerm, personnel]);

  if (isLoading) {
    return <div className='loading'>Завантаження...</div>;
  }

  if (personnel.length === 0) {
    return (
      <div className='empty-state'>
        <p>Немає даних. Додайте першого працівника.</p>
      </div>
    );
  }

  // Якщо більше 2 карточок - показуємо компактний вид
  const useCompactMode = filteredPersonnel.length > 2;

  return (
    <div className='personnel-list'>
      <div className='list-header'>
        <span className='count'>
          Всього: {filteredPersonnel.length} з {personnel.length}
        </span>
      </div>

      {useCompactMode ? (
        // КОМПАКТНИЙ ВИД - Плашки
        <div className='cards-container compact-mode'>
          {filteredPersonnel.length > 0 ? (
            <>
              {/* Розгорнута карточка */}
              {expandedId && (
                <div className='expanded-card-wrapper'>
                  {filteredPersonnel
                    .filter((p) => p.id === expandedId)
                    .map((p) => (
                      <PersonnelCard
                        key={p.id}
                        {...p}
                        onEdit={() => onEdit(p)}
                        onDelete={() => {
                          onDelete(p.id);
                          setExpandedId(null);
                        }}
                        onClose={() => setExpandedId(null)}
                      />
                    ))}
                </div>
              )}

              {/* Плашки - лише ті, що не розгорнуті */}
              <div className='compact-cards-grid'>
                {filteredPersonnel
                  .filter((p) => p.id !== expandedId)
                  .map((p) => (
                    <PersonnelCardCompact
                      key={p.id}
                      {...p}
                      onClick={() => setExpandedId(p.id)}
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
          {filteredPersonnel.length > 0 ? (
            filteredPersonnel.map((p) => (
              <PersonnelCard
                key={p.id}
                {...p}
                onEdit={() => onEdit(p)}
                onDelete={() => onDelete(p.id)}
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
