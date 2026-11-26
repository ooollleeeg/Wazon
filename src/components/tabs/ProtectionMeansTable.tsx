import { highlightText } from '../../utils/searchUtils';

export interface AssignedProtectionObject {
  objectId?: string | number;
  objectName?: string;
  objectType?: string;
  objectAddress?: string;
  premisesNumber?: string;
  subdivisionName?: string;
  departmentType?: string;
  systemClass?: string;
}

export interface ProtectionMean {
  id: string;
  category: string;
  name: string;
  objectName?: string;
  objectAddress?: string;
  objectId?: string;
  objectType?: string;
  subdivisionName?: string | null;
  premisesNumber?: string | null;
  ktziId?: number;
  ktziAddress?: string;
  ktziPremisesNumber?: string | null;
  ktziSubdivisionName?: string | null;
  assignedObjects?: AssignedProtectionObject[];
  systemClass?: string;
  serialNumber?: string;
  departmentType: string;
  status: 'installed' | 'in_stock';
  [key: string]: any;
}

interface ProtectionMeansTableProps {
  means: ProtectionMean[];
  onViewDetails: (mean: ProtectionMean) => void;
  onInstall?: (mean: ProtectionMean) => void;
  searchTerm?: string;
}

const ProtectionMeansTable = ({
  means,
  onViewDetails,
  onInstall,
  searchTerm = '',
}: ProtectionMeansTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'installed':
        return <span className='badge badge-installed'>✅ Встановлено</span>;
      case 'in_stock':
        return <span className='badge badge-in-stock'>🔄 На складі</span>;
      default:
        return <span className='badge badge-unknown'>⚠️ Невідомо</span>;
    }
  };

  const getObjectTypeLabel = (mean: ProtectionMean): string => {
    if (mean.status === 'in_stock') return '—';

    const typeMap: Record<string, string> = {
      AS: 'АС',
      SP: 'Службове приміщення',
      KRT: 'КРТ',
      IKS: 'ІКС',
      KTZI: 'КТЗІ',
      INVENTORY: 'На складі',
    };

    const types = mean.assignedObjects?.length
      ? mean.assignedObjects.map((object) => object.objectType)
      : [mean.objectType];
    const labels = [
      ...new Set(types.filter((type): type is string => Boolean(type))),
    ].map((type) => typeMap[type] || type);
    return labels.join(', ') || '—';
  };

  const getInstallationLabel = (mean: ProtectionMean): string => {
    if (mean.status === 'in_stock') return 'На складі';
    if (mean.category === 'КЗЗ від НСД') {
      return [
        mean.subdivisionName || 'Без підрозділу',
        ...(mean.objectType === 'AS'
          ? [`прим. № ${mean.premisesNumber || '—'}`]
          : []),
        mean.objectName || 'Без назви',
      ].join(', ');
    }

    return `${mean.ktziSubdivisionName || 'Без підрозділу'}, прим. № ${
      mean.ktziPremisesNumber || '—'
    }`;
  };

  if (means.length === 0) {
    return (
      <div className='empty-state'>
        <p>📭 Немає записів, які відповідають вашим фільтрам</p>
      </div>
    );
  }

  return (
    <div className='protection-means-table-container'>
      <table className='protection-means-table'>
        <thead>
          <tr>
            <th>Категорія</th>
            <th>Назва засобу</th>
            <th>Серійний номер</th>
            <th>Об'єкт установки</th>
            <th>Тип об'єкту</th>
            <th>Статус</th>
            <th>Дія</th>
          </tr>
        </thead>
        <tbody>
          {means.map((mean: ProtectionMean, idx: number) => (
            <tr
              key={`${mean.id || mean.serialNumber || mean.name}-${idx}`}
              className={`mean-row mean-${mean.status}`}
            >
              <td className='category-cell'>
                <span className='category-badge'>
                  {highlightText(mean.category, searchTerm, `${mean.id}-cat`)}
                </span>
              </td>
              <td className='name-cell'>
                <strong>
                  {highlightText(mean.name, searchTerm, `${mean.id}-name`)}
                </strong>
              </td>
              <td className='serial-cell'>
                {mean.serialNumber
                  ? highlightText(
                      mean.serialNumber,
                      searchTerm,
                      `${mean.id}-serial`,
                    )
                  : '—'}
              </td>
              <td className='object-cell'>
                <span className={mean.status === 'in_stock' ? 'na' : undefined}>
                  {getInstallationLabel(mean)}
                </span>
              </td>
              <td className='object-type-cell'>{getObjectTypeLabel(mean)}</td>
              <td className='status-cell'>{getStatusBadge(mean.status)}</td>
              <td className='action-cell'>
                <button
                  className='btn-view'
                  onClick={() => onViewDetails(mean)}
                  title='Переглянути деталі'
                >
                  👁️
                </button>
                {mean.status === 'in_stock' && onInstall && (
                  <button
                    className='btn-install'
                    onClick={() => onInstall(mean)}
                    title="Встановити на об'єкт"
                  >
                    ⚙️
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProtectionMeansTable;
