import './styles/ServicePremisesStats.css';

interface ServicePremisesData {
  id: number;
  address: string;
  premisesNumber: string;
  subdivisionName: string;
  subdivisionType: string;
  serviceName: string;
  [key: string]: any;
}

interface ServicePremisesStatsProps {
  items: ServicePremisesData[];
}

interface StatsData {
  totalCount: number;
  bySubdivisionType: { [key: string]: number };
}

export default function ServicePremisesStats({
  items,
}: ServicePremisesStatsProps) {
  const calculateStats = (): StatsData => {
    const stats: StatsData = {
      totalCount: items.length,
      bySubdivisionType: {},
    };

    items.forEach((item) => {
      stats.bySubdivisionType[item.subdivisionType] =
        (stats.bySubdivisionType[item.subdivisionType] || 0) + 1;
    });

    return stats;
  };

  const stats = calculateStats();

  // Якщо немає даних для показу
  if (items.length === 0) {
    return (
      <div className='service-premises-stats-section'>
        <h2>📊 Статистика</h2>
        <div className='stats-empty-message'>
          <p>📭 Жодних даних для відображення</p>
          <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
            Виберіть інші фільтри або додайте нові записи про службові
            приміщення
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='service-premises-stats-section'>
      <h2>📊 Статистика</h2>

      <div className='stats-container'>
        <div className='stats-group'>
          <h3>🏢 Службові приміщення</h3>

          {/* Загальна кількість */}
          <div className='stats-row'>
            <div className='stat-card stat-total'>
              <div className='stat-value'>{stats.totalCount}</div>
              <div className='stat-label'>Всього приміщень</div>
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
        </div>
      </div>
    </div>
  );
}
