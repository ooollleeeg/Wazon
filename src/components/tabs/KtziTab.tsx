import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import '../../styles/TabContent.css';
import '../common/GenericList.css';
import { highlightText } from '../../utils/searchUtils';
import KtziCardCompact from './KtziCardCompact';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import LoadingSpinner from '../common/LoadingSpinner';
import './KtziTab.css';

type DocumentField = {
  name: string;
  label: string;
  type?: 'text' | 'date' | 'select';
  options?: string[];
};

type DocumentVersion = {
  [key: string]: string | number | boolean | undefined;
  id?: number;
  isCurrent?: boolean;
};
type KtziDocuments = Record<string, DocumentVersion>;
type KtziDocumentVersions = Record<string, DocumentVersion[]>;
type MigrationConflict = {
  documentType: string;
  candidates: {
    objectType: string;
    objectName: string;
    data: Record<string, string>;
  }[];
};
type KtziMean = {
  id: number;
  categoryId?: string | number;
  toolType?: string;
  name: string;
  serialNumber?: string;
  invertarNumber?: string;
  releaseYear?: string | number;
  manufacturerExploitationTerm?: string;
  certificateInfo?: string;
  notes?: string;
};
type StockMean = {
  id: number | string;
  category: string;
  name: string;
  serialNumber?: string;
  objectType?: string;
  status?: string;
};
type Ktzi = {
  id: number;
  address?: string;
  premisesNumber?: string;
  subdivisionName?: string;
  subdivisionType?: string;
  serviceName?: string;
  objects: { id: number; objectType: string; objectName?: string }[];
  documents: KtziDocuments;
  documentVersions?: KtziDocumentVersions;
  migrationConflicts: MigrationConflict[];
  protectionMeans: KtziMean[];
};

const MAIN_FIELDS: { name: keyof Ktzi; label: string; type?: 'select' }[] = [
  { name: 'address', label: 'Адреса' },
  { name: 'premisesNumber', label: 'Номер приміщення' },
  { name: 'subdivisionName', label: 'Підрозділ' },
  { name: 'subdivisionType', label: 'Тип підрозділу', type: 'select' },
  { name: 'serviceName', label: 'Служба' },
];

const KTZI_MEAN_FIELDS: { name: keyof KtziMean; label: string; date?: boolean; fullWidth?: boolean }[] = [
  { name: 'toolType', label: 'Категорія / тип' },
  { name: 'name', label: 'Назва' },
  { name: 'serialNumber', label: 'Серійний номер' },
  { name: 'invertarNumber', label: 'Інвентарний номер' },
  { name: 'releaseYear', label: 'Рік виготовлення' },
  {
    name: 'manufacturerExploitationTerm',
    label: 'Термін експлуатації виробника',
    date: true,
  },
  { name: 'certificateInfo', label: 'Інформація про сертифікат', fullWidth: true },
  { name: 'notes', label: 'Примітки', fullWidth: true },
];

const SUBDIVISION_TYPES = ['Апарат', 'Територіальний підрозділ'];

const DOCUMENT_SECTIONS: {
  key: string;
  title: string;
  fields: DocumentField[];
}[] = [
  {
    key: 'passport',
    title: 'Паспорт на КТЗІ',
    fields: [
      { name: 'passportNumber', label: 'Реєстраційний номер' },
      { name: 'passportDate', label: 'Дата реєстрації', type: 'date' },
    ],
  },
  {
    key: 'ksp',
    title: 'Акт комплексної спеціальної перевірки',
    fields: [
      { name: 'checkNumber', label: 'Реєстраційний номер акту' },
      { name: 'checkDate', label: 'Дата реєстрації акту', type: 'date' },
      { name: 'checkPerformer', label: 'Виконавець робіт з ТЗІ' },
      { name: 'checkEventDate', label: 'Дата проведення заходу', type: 'date' },
      {
        name: 'checkPermissionPerformer',
        label: 'Реквізити дозволу на проведення робіт',
      },
    ],
  },
  {
    key: 'technicalTask',
    title: 'Технічне завдання на створення комплексу ТЗІ',
    fields: [
      { name: 'taskNumber', label: 'Реєстраційний номер' },
      { name: 'taskDate', label: 'Дата реєстрації', type: 'date' },
      { name: 'taskClearance', label: 'Дата погодження', type: 'date' },
    ],
  },
  {
    key: 'categorization',
    title: 'Акт категоріювання',
    fields: [
      {
        name: 'categorizationType',
        label: 'Вид категоріювання',
        type: 'select',
        options: ['первинне', 'чергове', 'позачергове'],
      },
      { name: 'categorizationActNumber', label: 'Номер акту' },
      {
        name: 'categorizationActDate',
        label: 'Дата реєстрації акту',
        type: 'date',
      },
      {
        name: 'categorizationRank',
        label: 'Встановлена категорія',
        type: 'select',
        options: ['I', 'II', 'III', 'IV'],
      },
      { name: 'categorizationValidUntil', label: 'Термін дії', type: 'date' },
      {
        name: 'foreignCriticalArea',
        label: 'Іноземні організації в критичній зоні',
        type: 'select',
        options: ['Наявні', 'Відсутні'],
      },
      {
        name: 'hightInformationRank',
        label: 'Вищий ступінь обмеження доступу до інформації',
        type: 'select',
        options: [
          'цілком таємно',
          'таємно',
          'для службового користування',
          'конфіденційна інформація',
        ],
      },
    ],
  },
  {
    key: 'atestation',
    title: 'Акт атестації комплексу ТЗІ',
    fields: [
      { name: 'attestationRegNumber', label: 'Реєстраційний номер акту' },
      {
        name: 'attestationRegDate',
        label: 'Дата реєстрації акту',
        type: 'date',
      },
      {
        name: 'attestationDsszziDate',
        label: 'Дата реєстрації в ДССЗЗІ',
        type: 'date',
      },
      { name: 'attestationDsszziNumber', label: 'Реєстраційний номер в ДССЗЗІ' },
      { name: 'attestationValidUntil', label: 'Дійсний до', type: 'date' },
      { name: 'atestationPerformer', label: 'Виконавець робіт з атестації' },
      {
        name: 'attestationWorkStartDate',
        label: 'Дата початку робіт',
        type: 'date',
      },
      {
        name: 'attestationWorkEndDate',
        label: 'Дата закінчення робіт',
        type: 'date',
      },
      {
        name: 'atestationPermissionPerformer',
        label: 'Реквізити дозволу на проведення робіт',
      },
    ],
  },
];

const OBJECT_TYPE_LABELS: Record<string, string> = {
  AS: 'АС',
  KRT: 'КРТ',
  SP: 'СП',
};
const OBJECT_TYPES = ['AS', 'SP', 'KRT'] as const;
const CATEGORIZATION_RANKS = ['II', 'III'] as const;
const normalizeObjectType = (type: string) => {
  const normalized = type.toUpperCase();
  if (normalized === 'CLASS_A_SYSTEMS') return 'AS';
  if (normalized === 'SERVICE_PREMISES') return 'SP';
  if (normalized === 'KRT') return 'KRT';
  return normalized;
};
const getObjectCardHash = (object: Ktzi['objects'][number]) => {
  const hashPrefix: Record<string, string> = {
    AS: 'class-a',
    SP: 'service-premises',
    KRT: 'krt',
  };
  const prefix = hashPrefix[normalizeObjectType(object.objectType)];
  return prefix ? `#${prefix}:${object.id}` : null;
};
const getSubdivisionOrder = (type?: string) => {
  const normalized = (type || '').toLocaleLowerCase('uk-UA');
  if (normalized.includes('апарат') || normalized.includes('apparatus')) return 0;
  if (
    normalized.includes('територ') ||
    normalized.includes('territorial')
  ) {
    return 1;
  }
  return 2;
};
const getCurrentCategorizationRank = (ktzi: Ktzi) => {
  const rank =
    ktzi.documentVersions?.categorization?.[0]?.categorizationRank ||
    ktzi.documents?.categorization?.categorizationRank;
  return String(rank || '').trim().toUpperCase();
};

const EMPTY_DOCUMENTS: KtziDocumentVersions = Object.fromEntries(
  DOCUMENT_SECTIONS.map(({ key }) => [key, []]),
);

const ktziTitle = (ktzi: Ktzi) =>
  [
    ktzi.subdivisionName || 'Без підрозділу',
    ktzi.premisesNumber ? `каб. ${ktzi.premisesNumber}` : '',
  ]
    .filter(Boolean)
    .join(', ');

const getObjectTypeLabels = (ktzi: Ktzi) =>
  Array.from(
    new Set(
      ktzi.objects.map(
        (object) =>
          OBJECT_TYPE_LABELS[normalizeObjectType(object.objectType)] ||
          object.objectType,
      ),
    ),
  );

const formatValue = (value?: string | number | boolean) => {
  if (!value) return '—';
  const stringValue = String(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(stringValue)
    ? stringValue.split('-').reverse().join('.')
    : stringValue;
};

const DOCUMENT_DATE_FIELDS: Record<string, string> = {
  technicalTask: 'taskDate',
  categorization: 'categorizationActDate',
  atestation: 'attestationRegDate',
  passport: 'passportDate',
  ksp: 'checkDate',
};

const parseDocumentDate = (value: string | number | boolean | undefined) => {
  if (!value) return 0;
  const date = String(value).trim();
  const isoDate = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    return Date.UTC(
      Number(isoDate[1]),
      Number(isoDate[2]) - 1,
      Number(isoDate[3]),
    );
  }
  const localizedDate = date.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (localizedDate) {
    return Date.UTC(
      Number(localizedDate[3]),
      Number(localizedDate[2]) - 1,
      Number(localizedDate[1]),
    );
  }
  const parsedDate = new Date(date).getTime();
  return Number.isNaN(parsedDate) ? 0 : parsedDate;
};

const sortDocumentVersions = (
  documentType: string,
  versions: DocumentVersion[],
) => {
  const dateField = DOCUMENT_DATE_FIELDS[documentType];
  return versions
    .map((version, index) => ({ version, index }))
    .sort((first, second) => {
      const dateOrder =
        parseDocumentDate(second.version[dateField]) -
        parseDocumentDate(first.version[dateField]);
      return (
        dateOrder ||
        (second.version.id || second.index) -
          (first.version.id || first.index)
      );
    });
};

export default function KtziTab() {
  const [ktzis, setKtzis] = useState<Ktzi[]>([]);
  const [stock, setStock] = useState<StockMean[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedObjectTypes, setSelectedObjectTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubdivisionTypes, setSelectedSubdivisionTypes] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mainForm, setMainForm] = useState<Record<string, string>>({});
  const [documents, setDocuments] =
    useState<KtziDocumentVersions>(EMPTY_DOCUMENTS);
  const [saving, setSaving] = useState(false);
  const [operationLoading, setOperationLoading] = useState('');
  const [installForId, setInstallForId] = useState<number | null>(null);
  const [stockChoice, setStockChoice] = useState('');
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [ktziToDelete, setKtziToDelete] = useState<Ktzi | null>(null);
  const [expandedPrevious, setExpandedPrevious] = useState<
    Record<string, boolean>
  >({});
  const [documentVersionToDelete, setDocumentVersionToDelete] = useState<{
    documentType: string;
    versionIndex: number;
    title: string;
  } | null>(null);
  const [meanToReturn, setMeanToReturn] = useState<{
    ktzi: Ktzi;
    mean: KtziMean;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const [ktziResponse, stockResponse] = await Promise.all([
        fetch('/api/ktzi'),
        fetch('/api/protection-means/all'),
      ]);
      if (!ktziResponse.ok) throw new Error('Не вдалося завантажити перелік КТЗІ');
      setKtzis(await ktziResponse.json());
      if (stockResponse.ok) {
        const data = await stockResponse.json();
        const items: StockMean[] = data.items || [];
        setStock(
          items.filter(
            (item) =>
              item.objectType === 'INVENTORY' || item.status === 'in_stock',
          ),
        );
      }
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const applyHash = () => {
      const match = window.location.hash.match(/^#ktzi:(\d+)/);
      if (match) {
        const ktziId = Number(match[1]);
        setHighlightId(ktziId);
        setExpandedId(ktziId);
        setSearchTerm('');
        setSelectedObjectTypes([]);
        setSelectedCategories([]);
        setSelectedSubdivisionTypes([]);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  useEffect(() => {
    if (loading || highlightId === null || expandedId !== highlightId) return;
    const card = document.getElementById(`ktzi-card-${highlightId}`);
    if (!card) return;
    const animationFrame = window.requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [loading, highlightId, expandedId, filtered]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return ktzis
      .filter((ktzi) => {
        const matchesType =
          selectedObjectTypes.length === 0 ||
          ktzi.objects.some((object) =>
            selectedObjectTypes.includes(
              normalizeObjectType(object.objectType),
            ),
          );
        if (!matchesType) return false;
        if (
          selectedCategories.length > 0 &&
          !selectedCategories.includes(getCurrentCategorizationRank(ktzi))
        ) {
          return false;
        }
        if (
          selectedSubdivisionTypes.length > 0 &&
          !selectedSubdivisionTypes.includes(
            String(getSubdivisionOrder(ktzi.subdivisionType)),
          )
        ) {
          return false;
        }
        if (!term) return true;
        return JSON.stringify([
            ktzi.address,
            ktzi.premisesNumber,
            ktzi.subdivisionName,
            ktzi.subdivisionType,
            ktzi.serviceName,
            ktzi.objects.map((object) => object.objectName),
            ktzi.protectionMeans.map((mean) => [mean.name, mean.serialNumber]),
            ktzi.documents,
          ])
            .toLowerCase()
            .includes(term);
      })
      .sort((a, b) => {
        const typeOrder =
          getSubdivisionOrder(a.subdivisionType) -
          getSubdivisionOrder(b.subdivisionType);
        return (
          typeOrder ||
          (a.subdivisionName || '').localeCompare(
            b.subdivisionName || '',
            'uk',
            { sensitivity: 'base' },
          ) ||
          (a.premisesNumber || '').localeCompare(
            b.premisesNumber || '',
            'uk',
            { numeric: true, sensitivity: 'base' },
          )
        );
      });
  }, [
    ktzis,
    searchTerm,
    selectedObjectTypes,
    selectedCategories,
    selectedSubdivisionTypes,
  ]);

  const toggleObjectType = (type: string) => {
    setSelectedObjectTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };
  const toggleFilterValue = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const stats = useMemo(
    () => {
      const countBy = (predicate: (ktzi: Ktzi) => boolean) =>
        filtered.filter(predicate).length;
      return {
        total: filtered.length,
        objects: filtered.reduce((sum, ktzi) => sum + ktzi.objects.length, 0),
        means: filtered.reduce(
          (sum, ktzi) => sum + ktzi.protectionMeans.length,
          0,
        ),
        byObjectType: {
          AS: countBy((ktzi) =>
            ktzi.objects.some(
              (object) => normalizeObjectType(object.objectType) === 'AS',
            ),
          ),
          SP: countBy((ktzi) =>
            ktzi.objects.some(
              (object) => normalizeObjectType(object.objectType) === 'SP',
            ),
          ),
          KRT: countBy((ktzi) =>
            ktzi.objects.some(
              (object) => normalizeObjectType(object.objectType) === 'KRT',
            ),
          ),
        },
        byCategory: Object.fromEntries(
          CATEGORIZATION_RANKS.map((rank) => [
            rank,
            countBy((ktzi) => getCurrentCategorizationRank(ktzi) === rank),
          ]),
        ),
        bySubdivisionType: {
          apparatus: countBy(
            (ktzi) => getSubdivisionOrder(ktzi.subdivisionType) === 0,
          ),
          territorial: countBy(
            (ktzi) => getSubdivisionOrder(ktzi.subdivisionType) === 1,
          ),
        },
      };
    },
    [filtered, ktzis],
  );
  const activeFiltersCount =
    selectedObjectTypes.length +
    selectedCategories.length +
    selectedSubdivisionTypes.length;
  const expandedKtzis = filtered.filter((ktzi) => expandedId === ktzi.id);
  const compactKtzis = filtered.filter((ktzi) => expandedId !== ktzi.id);

  const startEdit = (ktzi: Ktzi) => {
    setExpandedId(ktzi.id);
    setEditingId(ktzi.id);
    setMainForm(
      Object.fromEntries(
        MAIN_FIELDS.map(({ name }) => [name, String(ktzi[name] ?? '')]),
      ),
    );
    setDocuments(
      Object.fromEntries(
        DOCUMENT_SECTIONS.map(({ key, fields }) => {
          const versions =
            ktzi.documentVersions?.[key] ||
            (ktzi.documents?.[key] ? [ktzi.documents[key]] : []);
          return [
            key,
            key === 'passport' && !versions.length
              ? [Object.fromEntries(fields.map(({ name }) => [name, '']))]
              : versions,
          ];
        }),
      ),
    );
    setError('');
    setSuccess('');
  };

  const updateDocumentField = (
    documentType: string,
    versionIndex: number,
    fieldName: string,
    value: string,
  ) => {
    setDocuments((current) => ({
      ...current,
      [documentType]: current[documentType].map((version, index) =>
        index === versionIndex ? { ...version, [fieldName]: value } : version,
      ),
    }));
  };

  const addDocumentVersion = (documentType: string) => {
    const section = DOCUMENT_SECTIONS.find(({ key }) => key === documentType);
    if (!section) return;
    setDocuments((current) => ({
      ...current,
      [documentType]: [
        ...(current[documentType] || []),
        Object.fromEntries(section.fields.map(({ name }) => [name, ''])),
      ],
    }));
  };

  const removeDocumentVersion = (documentType: string, versionIndex: number) =>
    setDocuments((current) => ({
      ...current,
      [documentType]: current[documentType].filter(
        (_version, index) => index !== versionIndex,
      ),
    }));

  const request = async (url: string, init: RequestInit) => {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Помилка запиту');
    return result;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (editingId === null) return;
    setSaving(true);
    setError('');
    try {
      await request(`/api/ktzi/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(mainForm),
      });
      await request(`/api/ktzi/${editingId}/documents`, {
        method: 'PUT',
        body: JSON.stringify({ documents }),
      });
      setEditingId(null);
      setSuccess('КТЗІ збережено');
      await load();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const install = async (ktzi: Ktzi) => {
    const mean = stock.find((item) => String(item.id) === stockChoice);
    if (!mean) return;
    setError('');
    setOperationLoading('Встановлення засобу ТЗІ...');
    try {
      await request('/api/protection-means/install', {
        method: 'POST',
        body: JSON.stringify({
          meanId: mean.id,
          objectType: 'KTZI',
          objectId: ktzi.id,
          category: mean.category,
        }),
      });
      setInstallForId(null);
      setStockChoice('');
      setSuccess('Засіб ТЗІ встановлено');
      await load();
    } catch (installError) {
      setError((installError as Error).message);
    } finally {
      setOperationLoading('');
    }
  };

  const returnToStock = async (ktzi: Ktzi, mean: KtziMean) => {
    setMeanToReturn(null);
    setError('');
    setOperationLoading('Повернення засобу ТЗІ на склад...');
    try {
      await request(`/api/protection-means/${mean.id}/assignments`, {
        method: 'DELETE',
        body: JSON.stringify({
          objectType: 'KTZI',
          objectId: ktzi.id,
          name: mean.name,
          serialNumber: mean.serialNumber,
          invertarNumber: mean.invertarNumber,
        }),
      });
      setSuccess('Засіб ТЗІ повернуто на склад');
      await load();
    } catch (returnError) {
      setError((returnError as Error).message);
    } finally {
      setOperationLoading('');
    }
  };

  const remove = async (ktzi: Ktzi) => {
    setKtziToDelete(null);
    setError('');
    setOperationLoading('Видалення КТЗІ...');
    try {
      await request(`/api/ktzi/${ktzi.id}`, { method: 'DELETE' });
      await load();
    } catch (removeError) {
      setError((removeError as Error).message);
    } finally {
      setOperationLoading('');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen label='Завантаження КТЗІ...' />;
  }

  return (
    <div className='tab-content-wrapper'>
      {(saving || operationLoading) && (
        <LoadingSpinner
          fullScreen
          label={saving ? 'Збереження КТЗІ...' : operationLoading}
        />
      )}
      {error && (
        <div className='error-message'>
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
      {success && <div className='ktzi-success'>{success}</div>}

      <section className='ktzi-stats-section'>
        <h2>📊 Статистика</h2>
        <div className='ktzi-stats-groups'>
          <div className='ktzi-stats-group'>
            <h3>Загальна кількість</h3>
            <div className='ktzi-stats-row'>
              {[
                ['КТЗІ', stats.total, 'total'],
                ['Об’єкти у складі КТЗІ', stats.objects, 'objects'],
                ['Засоби ТЗІ', stats.means, 'means'],
              ].map(([label, value, kind]) => (
                <div
                  className={`ktzi-stat-card ktzi-stat-${kind}`}
                  key={String(kind)}
                >
                  <div className='ktzi-stat-value'>{value}</div>
                  <div className='ktzi-stat-label'>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className='ktzi-stats-group'>
            <h3>Розподіл КТЗІ</h3>
            <div className='ktzi-stats-subsection'>
              <h4>За типом об’єктів</h4>
              <div className='ktzi-stats-row'>
                {OBJECT_TYPES.map((type) => (
                  <div className='ktzi-stat-card ktzi-stat-objects' key={type}>
                    <div className='ktzi-stat-value'>
                      {stats.byObjectType[type]}
                    </div>
                    <div className='ktzi-stat-label'>
                      {OBJECT_TYPE_LABELS[type]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className='ktzi-stats-subsection'>
              <h4>За категорією</h4>
              <div className='ktzi-stats-row'>
                {CATEGORIZATION_RANKS.map((rank) => (
                  <div className='ktzi-stat-card ktzi-stat-category' key={rank}>
                    <div className='ktzi-stat-value'>
                      {stats.byCategory[rank]}
                    </div>
                    <div className='ktzi-stat-label'>Категорія {rank}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className='ktzi-stats-subsection'>
              <h4>За типом підрозділу</h4>
              <div className='ktzi-stats-row'>
                <div className='ktzi-stat-card ktzi-stat-subdivision'>
                  <div className='ktzi-stat-value'>
                    {stats.bySubdivisionType.apparatus}
                  </div>
                  <div className='ktzi-stat-label'>Підрозділ апарату</div>
                </div>
                <div className='ktzi-stat-card ktzi-stat-subdivision'>
                  <div className='ktzi-stat-value'>
                    {stats.bySubdivisionType.territorial}
                  </div>
                  <div className='ktzi-stat-label'>
                    Територіальний підрозділ
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className='content-controls'>
        <input
          type='text'
          className='search-input'
          placeholder='Пошук за адресою, підрозділом, об’єктом, засобом...'
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <section className='ktzi-filters-section'>
        <div className='ktzi-filters-header'>
          <h2>🔍 Фільтри</h2>
          {activeFiltersCount > 0 && (
            <button
              type='button'
              className='ktzi-reset-filters'
              onClick={() => {
                setSelectedObjectTypes([]);
                setSelectedCategories([]);
                setSelectedSubdivisionTypes([]);
              }}
            >
              Очистити ({activeFiltersCount})
            </button>
          )}
        </div>
        <div className='ktzi-filters-container'>
          <div className='ktzi-filter-group'>
            <h3>Тип об’єкта у складі КТЗІ</h3>
            <div className='ktzi-filter-options'>
              {OBJECT_TYPES.map((type) => (
                <label className='ktzi-filter-checkbox' key={type}>
                  <input
                    type='checkbox'
                    checked={selectedObjectTypes.includes(type)}
                    onChange={() => toggleObjectType(type)}
                  />
                  <span>{OBJECT_TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className='ktzi-filter-group'>
            <h3>Категорія КТЗІ</h3>
            <div className='ktzi-filter-options'>
              {CATEGORIZATION_RANKS.map((rank) => (
                <label className='ktzi-filter-checkbox' key={rank}>
                  <input
                    type='checkbox'
                    checked={selectedCategories.includes(rank)}
                    onChange={() =>
                      toggleFilterValue(rank, setSelectedCategories)
                    }
                  />
                  <span>{rank}</span>
                </label>
              ))}
            </div>
          </div>
          <div className='ktzi-filter-group'>
            <h3>Тип підрозділу</h3>
            <div className='ktzi-filter-options'>
              {[
                { key: '0', label: 'Підрозділ апарату' },
                { key: '1', label: 'Територіальний підрозділ' },
              ].map(({ key, label }) => (
                <label className='ktzi-filter-checkbox' key={key}>
                  <input
                    type='checkbox'
                    checked={selectedSubdivisionTypes.includes(key)}
                    onChange={() =>
                      toggleFilterValue(key, setSelectedSubdivisionTypes)
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className='ktzi-filter-results'>
          Показано: <b>{filtered.length}</b> з <b>{ktzis.length}</b>
        </div>
      </section>

      {!filtered.length && (
        <div className='ktzi-state'>
          {ktzis.length
            ? 'КТЗІ за вибраними критеріями не знайдено.'
            : 'КТЗІ створюється автоматично при додаванні АС, КРТ або службового приміщення з категорією інформації II чи III.'}
        </div>
      )}

      <div
        className={`cards-container compact-mode ${expandedId !== null ? 'ktzi-expanded-surface' : ''}`}
      >
        {expandedKtzis.map((ktzi) => {
        const isEditing = editingId === ktzi.id;
        const canDelete = !ktzi.objects.length && !ktzi.protectionMeans.length;

        return (
          <div
            key={ktzi.id}
            id={`ktzi-card-${ktzi.id}`}
            className={`generic-card expanded-card-wrapper ${highlightId === ktzi.id ? 'ktzi-highlight' : ''}`}
          >
            <div className='card-header'>
              <div className='card-title'>
                <h3>{highlightText(ktziTitle(ktzi), searchTerm)}</h3>
                <p className='subtitle'>
                  {highlightText(
                    [ktzi.address, ktzi.serviceName].filter(Boolean).join(' · '),
                    searchTerm,
                  )}
                </p>
              </div>
              <div className='card-actions'>
                {!isEditing && (
                  <button
                    className='btn-icon btn-edit'
                    onClick={() => startEdit(ktzi)}
                    title='Редагувати'
                  >
                    ✎
                  </button>
                )}
                <button
                  type='button'
                  className='btn-icon btn-close'
                  onClick={() => {
                    setExpandedId(null);
                    setEditingId(null);
                  }}
                  title='Згорнути'
                  aria-label='Згорнути картку'
                >
                  ✕
                </button>
              </div>
            </div>

            <div className='card-content'>
              {isEditing ? (
                <form onSubmit={save}>
                  <section className='card-section'>
                    <h4 className='section-title'>Основна інформація</h4>
                    <div className='ktzi-fields'>
                      {MAIN_FIELDS.map((field) => (
                        <label key={field.name}>
                          <span>{field.label}</span>
                          {field.type === 'select' ? (
                            <select
                              value={mainForm[field.name] || ''}
                              onChange={(event) =>
                                setMainForm({
                                  ...mainForm,
                                  [field.name]: event.target.value,
                                })
                              }
                            >
                              <option value=''>— Не обрано —</option>
                              {SUBDIVISION_TYPES.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={mainForm[field.name] || ''}
                              onChange={(event) =>
                                setMainForm({
                                  ...mainForm,
                                  [field.name]: event.target.value,
                                })
                              }
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  </section>

                  {!!ktzi.migrationConflicts?.length && (
                    <div className='ktzi-migration-warning'>
                      <strong>
                        У старих картках знайдено різні реквізити документів.
                        Автоматично жоден варіант не обрано.
                      </strong>
                      {ktzi.migrationConflicts.map((conflict) => {
                        const section = DOCUMENT_SECTIONS.find(
                          (item) => item.key === conflict.documentType,
                        );
                        return (
                          <div key={conflict.documentType}>
                            <em>{section?.title || conflict.documentType}</em>
                            <ul>
                              {conflict.candidates.map((candidate, index) => (
                                <li key={index}>
                                  {candidate.objectName} (
                                  {OBJECT_TYPE_LABELS[candidate.objectType] ||
                                    candidate.objectType}
                                  ):{' '}
                                  {Object.entries(candidate.data)
                                    .filter(([, value]) => value)
                                    .map(([fieldName, value]) => {
                                      const label = section?.fields.find(
                                        (field) => field.name === fieldName,
                                      )?.label;
                                      return `${label || fieldName}: ${value}`;
                                    })
                                    .join('; ')}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {DOCUMENT_SECTIONS.map((section) => (
                    <section
                      className='card-section ktzi-document-section'
                      key={section.key}
                    >
                      <h4 className='section-title'>{section.title}</h4>
                      {sortDocumentVersions(
                        section.key,
                        documents[section.key] || [],
                      ).map(({ version, index }, versionIndex) => (
                        <div className='ktzi-document-version' key={version.id || index}>
                          {section.key !== 'passport' && (
                            <div className='ktzi-document-version-header'>
                              {versionIndex === 0 ? (
                                <strong className='badge-current'>Поточний</strong>
                              ) : (
                                <span />
                              )}
                              <button
                                className='btn-secondary'
                                type='button'
                                onClick={() =>
                                  setDocumentVersionToDelete({
                                    documentType: section.key,
                                    versionIndex: index,
                                    title:
                                      String(
                                        version[
                                          section.fields[0]?.name || ''
                                        ] || '',
                                      ) || section.title,
                                  })
                                }
                              >
                                Видалити запис
                              </button>
                            </div>
                          )}
                          <div className='ktzi-fields'>
                            {section.fields.map((field) => (
                              <label key={field.name}>
                                <span>{field.label}</span>
                                {field.type === 'select' ? (
                                  <select
                                    value={String(version[field.name] || '')}
                                    onChange={(event) =>
                                      updateDocumentField(
                                        section.key,
                                        index,
                                        field.name,
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value=''>— Не обрано —</option>
                                    {field.options?.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field.type || 'text'}
                                    value={String(version[field.name] || '')}
                                    onChange={(event) =>
                                      updateDocumentField(
                                        section.key,
                                        index,
                                        field.name,
                                        event.target.value,
                                      )
                                    }
                                  />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      {section.key !== 'passport' && (
                        <button
                          className='btn-secondary'
                          type='button'
                          onClick={() => addDocumentVersion(section.key)}
                        >
                          + Додати запис
                        </button>
                      )}
                    </section>
                  ))}

                  <div className='ktzi-actions'>
                    <button
                      type='button'
                      className='btn-secondary'
                      onClick={() => setEditingId(null)}
                    >
                      Скасувати
                    </button>
                    <button className='btn-primary' type='submit' disabled={saving}>
                      {saving ? 'Збереження...' : 'Зберегти'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <section className='card-section'>
                    <h4 className='section-title'>Основна інформація</h4>
                    <div className='info-grid'>
                      {[
                        ['Адреса', ktzi.address],
                        ['Номер приміщення', ktzi.premisesNumber],
                        ['Підрозділ', ktzi.subdivisionName],
                        ['Тип підрозділу', ktzi.subdivisionType],
                        ['Служба', ktzi.serviceName],
                      ].map(([label, value]) => (
                        <div className='info-item' key={label}>
                          <span className='label'>{label}:</span>
                          <span className='value'>
                            {highlightText(formatValue(value), searchTerm)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className='card-section'>
                    <h4 className='section-title'>Об’єкти у складі КТЗІ</h4>
                    {ktzi.objects.length ? (
                      <div className='ktzi-chips'>
                        {ktzi.objects.map((object, index) => (
                          <button
                            className='ktzi-object-link'
                            key={`${object.objectType}-${object.id || index}`}
                            type='button'
                            onClick={() => {
                              const hash = getObjectCardHash(object);
                              if (hash) window.location.hash = hash;
                            }}
                            aria-label={`Відкрити картку ${OBJECT_TYPE_LABELS[object.objectType] || object.objectType}: ${object.objectName || '—'}`}
                          >
                            {OBJECT_TYPE_LABELS[object.objectType] ||
                              object.objectType}
                            :{' '}
                            {highlightText(
                              object.objectName || '—',
                              searchTerm,
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className='ktzi-muted'>Об’єктів немає</p>
                    )}
                  </section>

                  {DOCUMENT_SECTIONS.map((section) => (
                    <section
                      className='card-section ktzi-document-section'
                      key={section.key}
                    >
                      <h4 className='section-title'>{section.title}</h4>
                      {(() => {
                        const allVersions =
                          ktzi.documentVersions?.[section.key] ||
                          (ktzi.documents?.[section.key]
                            ? [ktzi.documents[section.key]]
                            : []);
                        const isPassport = section.key === 'passport';
                        const previousKey = `${ktzi.id}:${section.key}`;
                        const showPrevious = !!expandedPrevious[previousKey];
                        const visible = isPassport
                          ? allVersions.slice(0, 1)
                          : showPrevious
                            ? allVersions
                            : allVersions.slice(0, 1);
                        const previousCount = isPassport
                          ? 0
                          : allVersions.length - 1;
                        return (
                          <>
                            {visible.map((version, index) => (
                              <div
                                className='ktzi-document-version'
                                key={version.id || index}
                              >
                                {!isPassport && index === 0 && (
                                  <div className='ktzi-document-version-status'>
                                    <strong className='badge-current'>
                                      Поточний
                                    </strong>
                                  </div>
                                )}
                                <div className='info-grid'>
                                  {section.fields.map((field) => (
                                    <div className='info-item' key={field.name}>
                                      <span className='label'>
                                        {field.label}:
                                      </span>
                                      <span className='value'>
                                        {highlightText(
                                          formatValue(version[field.name]),
                                          searchTerm,
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {previousCount > 0 && (
                              <button
                                type='button'
                                className='btn-toggle-previous'
                                onClick={() =>
                                  setExpandedPrevious((current) => ({
                                    ...current,
                                    [previousKey]: !current[previousKey],
                                  }))
                                }
                              >
                                {showPrevious
                                  ? '← Приховати попередні'
                                  : `↓ Переглянути попередні (${previousCount})`}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </section>
                  ))}

                  <section className='card-section ktzi-protection-section'>
                    <h4 className='section-title'>
                      Засоби ТЗІ ({ktzi.protectionMeans.length})
                    </h4>
                    {ktzi.protectionMeans.map((mean) => (
                      <div className='ktzi-mean' key={mean.id}>
                        <div className='ktzi-mean-content'>
                          <div className='info-grid'>
                            {KTZI_MEAN_FIELDS.map((field) => {
                              const value =
                                field.name === 'toolType'
                                  ? mean.toolType || mean.categoryId
                                  : mean[field.name];
                              return (
                                <div
                                  className={`info-item ${field.fullWidth ? 'full-width' : ''}`}
                                  key={field.name}
                                >
                                  <span className='label'>{field.label}:</span>
                                  <span className='value'>
                                    {highlightText(
                                      formatValue(value),
                                      searchTerm,
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <button
                            className='btn-secondary'
                            onClick={() => setMeanToReturn({ ktzi, mean })}
                          >
                            На склад
                          </button>
                        </div>
                      </div>
                    ))}
                    {installForId === ktzi.id ? (
                      <div className='ktzi-install'>
                        <select
                          value={stockChoice}
                          onChange={(event) => setStockChoice(event.target.value)}
                        >
                          <option value=''>— Оберіть засіб зі складу —</option>
                          {stock
                            .filter((item) => item.category !== 'КЗЗ від НСД')
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                                {item.serialNumber ? ` (№${item.serialNumber})` : ''}
                                {` — ${item.category}`}
                              </option>
                            ))}
                        </select>
                        <button
                          className='btn-primary'
                          disabled={!stockChoice}
                          onClick={() => void install(ktzi)}
                        >
                          Встановити
                        </button>
                        <button
                          className='btn-secondary'
                          onClick={() => setInstallForId(null)}
                        >
                          Скасувати
                        </button>
                      </div>
                    ) : (
                      <button
                        className='btn-primary'
                        onClick={() => {
                          setInstallForId(ktzi.id);
                          setStockChoice('');
                        }}
                      >
                        + Встановити зі складу
                      </button>
                    )}
                  </section>

                  {canDelete && (
                    <div className='ktzi-actions'>
                      <button
                        className='btn-secondary'
                        onClick={() => setKtziToDelete(ktzi)}
                      >
                        Видалити порожній КТЗІ
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      <div className='compact-cards-grid'>
        {compactKtzis.map((ktzi) => (
          <KtziCardCompact
            key={ktzi.id}
            subdivisionName={ktzi.subdivisionName}
            objectTypes={getObjectTypeLabels(ktzi)}
            premisesNumber={ktzi.premisesNumber}
            searchTerm={searchTerm}
            onClick={() => {
              setEditingId(null);
              setExpandedId(ktzi.id);
            }}
          />
        ))}
      </div>
      </div>

      {ktziToDelete && (
        <DeleteConfirmModal
          fullName={`КТЗІ ${ktziTitle(ktziToDelete)}`}
          onConfirm={() => void remove(ktziToDelete)}
          onCancel={() => setKtziToDelete(null)}
        />
      )}

      {documentVersionToDelete && (
        <DeleteConfirmModal
          title='Видалення версії документа'
          fullName={documentVersionToDelete.title}
          message={
            <>
              Запис документа буде видалено з КТЗІ.
            </>
          }
          onConfirm={() => {
            removeDocumentVersion(
              documentVersionToDelete.documentType,
              documentVersionToDelete.versionIndex,
            );
            setDocumentVersionToDelete(null);
          }}
          onCancel={() => setDocumentVersionToDelete(null)}
        />
      )}

      {meanToReturn && (
        <DeleteConfirmModal
          fullName={meanToReturn.mean.name}
          title='Повернення на склад'
          message={
            <>
              Засіб ТЗІ <strong>{meanToReturn.mean.name}</strong> буде знято з
              КТЗІ та повернуто на склад.
            </>
          }
          subtext=''
          confirmLabel='Так, повернути'
          cancelLabel='Ні, залишити'
          onConfirm={() =>
            void returnToStock(meanToReturn.ktzi, meanToReturn.mean)
          }
          onCancel={() => setMeanToReturn(null)}
        />
      )}
    </div>
  );
}
