import { AntivirusStats as AntivirusStatsType } from '../../types/antivirus';
import './styles/AntivirusStats.css';

interface AntivirusStatsProps {
  stats: AntivirusStatsType;
}

const AntivirusStats = ({ stats }: AntivirusStatsProps) => {
  return (
    <div className='antivirus-stats-section'>
      <h2>📊 Статистика</h2>

      {/* Загальна статистика */}
      <div className='antivirus-stats-row'>
        <div className='antivirus-stat-card stat-total'>
          <div className='stat-value'>{stats.total}</div>
          <div className='stat-label'>
            Усього об'єктів зі встановленим антивірусним ПЗ
          </div>
        </div>
        <div className='antivirus-stat-card stat-unique'>
          <div className='stat-value'>{stats.uniqueAntivirus.length}</div>
          <div className='stat-label'>Унікальних антивірусів</div>
        </div>
      </div>

      {/* Статистика по класам АС */}
      <div className='stats-group'>
        <h3>🖥️ Автоматизовані системи</h3>
        <div className='antivirus-stats-row'>
          <div className='antivirus-stat-card stat-class'>
            <div className='stat-value'>{stats.byClass['АС класу 1'] || 0}</div>
            <div className='stat-label'>АС класу 1</div>
          </div>
          <div className='antivirus-stat-card stat-class'>
            <div className='stat-value'>{stats.byClass['АС класу 2'] || 0}</div>
            <div className='stat-label'>АС класу 2</div>
          </div>
          <div className='antivirus-stat-card stat-class'>
            <div className='stat-value'>{stats.byClass['АС класу 3'] || 0}</div>
            <div className='stat-label'>АС класу 3</div>
          </div>
        </div>
      </div>

      {/* Статистика по класам ІКС */}
      <div className='stats-group'>
        <h3>🌐 Інформаційно-комунікаційні системи</h3>
        <div className='antivirus-stats-row'>
          <div className='antivirus-stat-card stat-iks'>
            <div className='stat-value'>
              {stats.byClass['ІКС класу 1'] || 0}
            </div>
            <div className='stat-label'>ІКС класу 1</div>
          </div>
          <div className='antivirus-stat-card stat-iks'>
            <div className='stat-value'>
              {stats.byClass['ІКС класу 2'] || 0}
            </div>
            <div className='stat-label'>ІКС класу 2</div>
          </div>
          <div className='antivirus-stat-card stat-iks'>
            <div className='stat-value'>
              {stats.byClass['ІКС класу 3'] || 0}
            </div>
            <div className='stat-label'>ІКС класу 3</div>
          </div>
        </div>
      </div>

      {/* Статистика по типам підрозділів */}
      <div className='stats-group'>
        <h3>🏢 По типам підрозділів</h3>
        <div className='antivirus-stats-row'>
          <div className='antivirus-stat-card stat-department'>
            <div className='stat-value'>
              {stats.byDepartmentType['підрозділ апарату'] || 0}
            </div>
            <div className='stat-label'>Підрозділи апарату</div>
          </div>
          <div className='antivirus-stat-card stat-department'>
            <div className='stat-value'>
              {stats.byDepartmentType['територіальний підрозділ'] || 0}
            </div>
            <div className='stat-label'>Територіальні підрозділи</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AntivirusStats;
