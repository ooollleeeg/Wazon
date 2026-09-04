import './styles/KRTStats.css';

interface KRTData {
  id: number;
  address: string;
  premisesNumber: string;
  subdivisionName: string;
  subdivisionType: string;
  systemName: string;
  [key: string]: any;
}

interface KRTStatsProps {
  items: KRTData[];
}

interface StatsData {
  // КРТ Статистика
  totalKrt: number;
  bySubdivisionType: { [key: string]: number };
  // КТЗІ Статистика
  totalKtzi: number;
  ktziBySubdivisionType: { [key: string]: number };
}

export default function KRTStats({ items }: KRTStatsProps) {
  // Перевіряє, чи КРТ має валідну категоріювання (I, II, III)
  // КРТ без категоріювання або з категорією IV не рахуються в КТЗІ
  const hasValidCategorization = (item: KRTData): boolean => {
    // Якщо немає категоріювання взагалі
    if (!item.categorization || !Array.isArray(item.categorization)) {
      return false;
    }

    // Беремо останній (поточний) акт категоріювання
    const currentCategorization =
      item.categorization[item.categorization.length - 1];

    if (!currentCategorization) {
      return false;
    }

    const rank = currentCategorization.categorizationRank;

    // Рахуємо тільки об'єкти з категоріями I, II, III
    // Категорія IV або відсутня - не рахуємо
    return rank && (rank === 'I' || rank === 'II' || rank === 'III');
  };

  const calculateStats = (): StatsData => {
    const stats: StatsData = {
      totalKrt: items.length,
      bySubdivisionType: {},
      totalKtzi: 0,
      ktziBySubdivisionType: {},
    };

    // Трекуємо унікальні КТЗІ по (premisesNumber + subdivisionName)
    const ktziMap = new Map<string, KRTData>();

    items.forEach((item) => {
      // КРТ Статистика
      // По типам підрозділів
      stats.bySubdivisionType[item.subdivisionType] =
        (stats.bySubdivisionType[item.subdivisionType] || 0) + 1;

      // КТЗІ Статистика
      // Групуємо по (premisesNumber + subdivisionName)
      // Рахуємо тільки об'єкти з категоріями I, II, III
      if (hasValidCategorization(item)) {
        const ktziKey = `${item.premisesNumber || 'unknown'}|${item.subdivisionName}`;
        if (!ktziMap.has(ktziKey)) {
          ktziMap.set(ktziKey, item);

          // По типам підрозділів
          stats.ktziBySubdivisionType[item.subdivisionType] =
            (stats.ktziBySubdivisionType[item.subdivisionType] || 0) + 1;
        }
      }
    });

    stats.totalKtzi = ktziMap.size;

    return stats;
  };

  const stats = calculateStats();

  // Якщо немає даних для показу
  if (items.length === 0) {
    return (
      <div className='krt-stats-section'>
        <h2>📊 Статистика</h2>
        <div className='stats-empty-message'>
          <p>📭 Жодних даних для відображення</p>
          <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
            Виберіть інші фільтри або додайте нові записи про КРТ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='krt-stats-section'>
      <h2>📊 Статистика</h2>

      {/* СТАТИСТИКА КРТ */}
      <div className='stats-container'>
        <div className='stats-group'>
          <h3>📠 Копіювально-розмножувальна техніка (КРТ)</h3>

          {/* Загальна кількість */}
          <div className='stats-row'>
            <div className='stat-card stat-total'>
              <div className='stat-value'>{stats.totalKrt}</div>
              <div className='stat-label'>Всього КРТ</div>
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
        </div>
      </div>
    </div>
  );
}
