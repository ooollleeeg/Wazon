import { useState, useEffect } from 'react';
import PersonnelCard from './PersonnelCard';
import PersonnelCardCompact from './PersonnelCardCompact';
import './styles/PersonnelList.css';

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

/**
 * Функция для вычисления приоритета по названию посади
 * Высший приоритет = 0, низший = большое число
 */
const calculatePriority = (position: string): number => {
  const positionLower = position.toLowerCase();

  // Приоритет 1: "начальник"
  if (positionLower.includes('начальник ')) {
    return 0;
  }

  // Приоритет 2: "заступник"
  if (positionLower.includes('заступник')) {
    return 1;
  }

  // Приоритет 3+: по длине названия (чем длиннее - тем выше приоритет)
  // Используем отрицательную длину, чтобы длинные названия шли в начало
  return 2 + (1000 - position.length) / 100;
};

/**
 * Сортируем персонал по приоритету
 */
const sortPersonnelByPriority = (
  personnel: PersonnelData[],
): PersonnelData[] => {
  return [...personnel].sort((a, b) => {
    const priorityA = calculatePriority(a.position);
    const priorityB = calculatePriority(b.position);
    return priorityA - priorityB;
  });
};

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
      // Сортируем по приоритету, если нет поиска
      const sorted = sortPersonnelByPriority(personnel);
      setFilteredPersonnel(sorted);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = personnel.filter(
      (p) =>
        p.fullName.toLowerCase().includes(term) ||
        p.position.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term),
    );

    // Сортируем отфильтрованные результаты тоже
    const sorted = sortPersonnelByPriority(filtered);
    setFilteredPersonnel(sorted);
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
  //  ВИЗНАЧАЄМО, ПОТРІБНО ЛИ ПОКАЗУВАТИ КНОПКУ ЗАКРИТТЯ
  const showCloseButton = filteredPersonnel.length > 2;

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
                        showCloseButton={showCloseButton} // ✅ ПЕРЕДАЄМО ФЛАГ
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
