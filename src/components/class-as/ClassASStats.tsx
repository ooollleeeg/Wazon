import './styles/ClassASStats.css';

interface ClassASData {
  id: number;
  address: string;
  premisesNumber: string;
  subdivisionName: string;
  subdivisionType: string;
  serviceName: string;
  systemClass: string;
  systemName: string;
  objectType: string;
  [key: string]: any;
}

interface ClassASStatsProps {
  systems: ClassASData[];
}

interface StatsData {
  // АС Статистика
  totalSystems: number;
  byClass: { [key: string]: number };
  bySubdivisionType: { [key: string]: number };
  byObjectType: { [key: string]: number };
}

export default function ClassASStats({ systems }: ClassASStatsProps) {
  const calculateStats = (): StatsData => {
    const stats: StatsData = {
      totalSystems: systems.length,
      byClass: {},
      bySubdivisionType: {},
      byObjectType: {},
    };

    systems.forEach((system) => {
      // АС Статистика
      // По класах
      stats.byClass[system.systemClass] =
        (stats.byClass[system.systemClass] || 0) + 1;

      // По типам підрозділів
      stats.bySubdivisionType[system.subdivisionType] =
        (stats.bySubdivisionType[system.subdivisionType] || 0) + 1;

      // По типам об'єктів
      stats.byObjectType[system.objectType] =
        (stats.byObjectType[system.objectType] || 0) + 1;
    });

    return stats;
  };

  const stats = calculateStats();

  // Якщо немає даних для показу
  if (systems.length === 0) {
    return (
      <div className='class-as-stats-section'>
        <h2>📊 Статистика</h2>
        <div className='stats-empty-message'>
          <p>📭 Жодних даних для відображення</p>
          <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
            Виберіть інші фільтри або додайте нові автоматизовані системи
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='class-as-stats-section'>
      <h2>📊 Статистика</h2>

      {/* СТАТИСТИКА АС */}
      <div className='stats-container'>
        <div className='stats-group'>
          <h3>🖥️ Автоматизовані системи (АС)</h3>

          {/* Загальна кількість */}
          <div className='stats-row'>
            <div className='stat-card stat-total'>
              <div className='stat-value'>{stats.totalSystems}</div>
              <div className='stat-label'>Всього АС</div>
            </div>
          </div>

          {/* По класах */}
          <div className='stats-subsection'>
            <h4>По класах АС</h4>
            <div className='stats-row'>
              {['АС класу 1', 'АС класу 2', 'АС класу 3'].map((className) => (
                <div key={className} className='stat-card stat-class'>
                  <div className='stat-value'>
                    {stats.byClass[className] || 0}
                  </div>
                  <div className='stat-label'>{className}</div>
                </div>
              ))}
            </div>
          </div>

          {/* По типам підрозділів */}
          <div className='stats-subsection'>
            <h4>По типам підрозділів</h4>
            <div className='stats-row'>
              {Object.entries(stats.bySubdivisionType).map(
                ([subdivisionType, count]) => (
                  <div
                    key={subdivisionType}
                    className='stat-card stat-subdivision'
                  >
                    <div className='stat-value'>{count}</div>
                    <div className='stat-label'>{subdivisionType}</div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* По типам об'єктів */}
          <div className='stats-subsection'>
            <h4>По типам об'єктів</h4>
            <div className='stats-row'>
              {Object.entries(stats.byObjectType).map(([objectType, count]) => (
                <div key={objectType} className='stat-card stat-objecttype'>
                  <div className='stat-value'>{count}</div>
                  <div className='stat-label'>{objectType}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
