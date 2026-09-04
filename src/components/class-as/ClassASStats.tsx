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
  // КТЗІ Статистика
  totalKtzi: number;
  ktziBySubdivisionType: { [key: string]: number };
  ktziByObjectType: { [key: string]: number };
}

export default function ClassASStats({ systems }: ClassASStatsProps) {
  const calculateStats = (): StatsData => {
    const stats: StatsData = {
      totalSystems: systems.length,
      byClass: {},
      bySubdivisionType: {},
      byObjectType: {},
      totalKtzi: 0,
      ktziBySubdivisionType: {},
      ktziByObjectType: {},
    };

    // Трекуємо унікальні КТЗІ по (premisesNumber + subdivisionName)
    const ktziMap = new Map<string, ClassASData>();

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

      // КТЗІ Статистика
      // Групуємо по (premisesNumber + subdivisionName)
      const ktziKey = `${system.premisesNumber || 'unknown'}|${system.subdivisionName}`;
      if (!ktziMap.has(ktziKey)) {
        ktziMap.set(ktziKey, system);

        // По типам підрозділів
        stats.ktziBySubdivisionType[system.subdivisionType] =
          (stats.ktziBySubdivisionType[system.subdivisionType] || 0) + 1;

        // По типам об'єктів
        stats.ktziByObjectType[system.objectType] =
          (stats.ktziByObjectType[system.objectType] || 0) + 1;
      }
    });

    stats.totalKtzi = ktziMap.size;

    return stats;
  };

  const stats = calculateStats();

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

        {/* СТАТИСТИКА КТЗІ */}
        <div className='stats-group'>
          <h3>🛡️ Комплекси технічного захисту інформації (КТЗІ)</h3>

          {/* Загальна кількість КТЗІ */}
          <div className='stats-row'>
            <div className='stat-card stat-total'>
              <div className='stat-value'>{stats.totalKtzi}</div>
              <div className='stat-label'>Всього КТЗІ</div>
            </div>
          </div>

          {/* По типам підрозділів */}
          <div className='stats-subsection'>
            <h4>По типам підрозділів</h4>
            <div className='stats-row'>
              {Object.entries(stats.ktziBySubdivisionType).map(
                ([subdivisionType, count]) => (
                  <div
                    key={`ktzi-${subdivisionType}`}
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
              {Object.entries(stats.ktziByObjectType).map(
                ([objectType, count]) => (
                  <div
                    key={`ktzi-${objectType}`}
                    className='stat-card stat-objecttype'
                  >
                    <div className='stat-value'>{count}</div>
                    <div className='stat-label'>{objectType}</div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
