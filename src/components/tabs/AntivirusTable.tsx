import { useMemo } from 'react';
import { AntivirusItem, AntivirusGroup } from '../../types/antivirus';
import './styles/AntivirusTable.css';

interface AntivirusTableProps {
  items: AntivirusItem[];
  onEditAntivirus: (antivirusName: string) => void;
}

const AntivirusTable = ({ items, onEditAntivirus }: AntivirusTableProps) => {
  // Агрегувати дані по унікальним антивірусам
  const groupedByAntivirus = useMemo(() => {
    const groups: Map<string, AntivirusGroup> = new Map();

    items.forEach((item) => {
      if (!groups.has(item.antivirus)) {
        groups.set(item.antivirus, {
          name: item.antivirus,
          count: 0,
          items: [],
          opinionNumber: item.antivirusOpinionNumber,
          opinionDate: item.antivirusOpinionDate,
        });
      }

      const group = groups.get(item.antivirus)!;
      group.count++;
      group.items.push(item);
      // Оновити дату останнього оновлення
      if (
        item.antivirusOpinionDate &&
        (!group.opinionDate ||
          new Date(item.antivirusOpinionDate) > new Date(group.opinionDate))
      ) {
        group.opinionDate = item.antivirusOpinionDate;
      }
      if (item.antivirusOpinionNumber && !group.opinionNumber) {
        group.opinionNumber = item.antivirusOpinionNumber;
      }
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'uk-UA'),
    );
  }, [items]);

  if (groupedByAntivirus.length === 0) {
    return (
      <div className='antivirus-table-empty'>
        <p>📭 Немає записів про встановлені антивіруси</p>
      </div>
    );
  }

  return (
    <div className='antivirus-table-wrapper'>
      <h2>📋 Встановлені антивіруси</h2>
      <table className='antivirus-table'>
        <thead>
          <tr>
            <th>Антивірусне ПЗ</th>
            <th>Кількість об'єктів</th>
            <th>Номер експертного висновку</th>
            <th>Дата експертного висновку</th>
            <th>Дія</th>
          </tr>
        </thead>
        <tbody>
          {groupedByAntivirus.map((group) => (
            <tr key={group.name} className='antivirus-row'>
              <td className='antivirus-name'>
                <div className='name-badge'>🦠 {group.name}</div>
              </td>
              <td className='count-cell'>
                <span className='count-badge'>{group.count}</span>
              </td>
              <td className='opinion-number'>{group.opinionNumber || '—'}</td>
              <td className='opinion-date'>
                {group.opinionDate
                  ? new Date(group.opinionDate).toLocaleDateString('uk-UA')
                  : '—'}
              </td>
              <td className='action-cell'>
                <button
                  className='btn-edit'
                  onClick={() => onEditAntivirus(group.name)}
                  title="Редагувати експертний висновок для всіх об'єктів"
                >
                  ✏️ Редагувати
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Детальна таблиця по об'єктам */}
      <div className='antivirus-details-section'>
        <h2>📍 Розташування антивірусів по об'єктам</h2>
        {groupedByAntivirus.map((group) => (
          <div key={`details-${group.name}`} className='antivirus-detail-card'>
            <h3>🦠 {group.name}</h3>
            <div className='object-list'>
              <table className='object-table'>
                <thead>
                  <tr>
                    <th>Тип системи</th>
                    <th>Назва системи</th>
                    <th>Клас</th>
                    <th>Підрозділ</th>
                    <th>Тип підрозділу</th>
                    <th>Адреса</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, idx) => (
                    <tr key={`${group.name}-${idx}`} className='object-row'>
                      <td className='source'>
                        {item.sourceTable === 'class_a_systems'
                          ? '🖥️ АС'
                          : '🌐 ІКС'}
                      </td>
                      <td className='system-name'>{item.systemName}</td>
                      <td className='system-class'>{item.systemClass}</td>
                      <td className='subdivision-name'>
                        {item.subdivisionName}
                      </td>
                      <td className='subdivision-type'>
                        <span className='type-badge'>
                          {item.subdivisionType === 'підрозділ апарату'
                            ? '🏛️ Апарат'
                            : '🗺️ Територіальний'}
                        </span>
                      </td>
                      <td className='address'>{item.address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AntivirusTable;
