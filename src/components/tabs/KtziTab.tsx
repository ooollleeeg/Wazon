import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/TabContent.css';
import '../common/GenericList.css';
import { highlightText } from '../../utils/searchUtils';
import KtziCardCompact from './KtziCardCompact';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
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
  toolType?: string;
  name: string;
  serialNumber?: string;
  invertarNumber?: string;
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
  objects: { objectType: string; objectName?: string }[];
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
const normalizeObjectType = (type: string) => {
  const normalized = type.toUpperCase();
  if (normalized === 'CLASS_A_SYSTEMS') return 'AS';
  if (normalized === 'SERVICE_PREMISES') return 'SP';
  if (normalized === 'KRT') return 'KRT';
  return normalized;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mainForm, setMainForm] = useState<Record<string, string>>({});
  const [documents, setDocuments] =
    useState<KtziDocumentVersions>(EMPTY_DOCUMENTS);
  const [saving, setSaving] = useState(false);
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
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

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
  }, [ktzis, searchTerm, selectedObjectTypes]);

  const toggleObjectType = (type: string) => {
    setSelectedObjectTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };

  const stats = useMemo(
    () => ({
      total: ktzis.length,
      objects: ktzis.reduce((sum, ktzi) => sum + ktzi.objects.length, 0),
      means: ktzis.reduce((sum, ktzi) => sum + ktzi.protectionMeans.length, 0),
    }),
    [ktzis],
  );
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
    }
  };

  const returnToStock = async (ktzi: Ktzi, mean: KtziMean) => {
    setMeanToReturn(null);
    setError('');
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
    }
  };

  const remove = async (ktzi: Ktzi) => {
    setKtziToDelete(null);
    setError('');
    try {
      await request(`/api/ktzi/${ktzi.id}`, { method: 'DELETE' });
      await load();
    } catch (removeError) {
      setError((removeError as Error).message);
    }
  };

  if (loading) {
    return <div className='ktzi-state'>Завантаження КТЗІ...</div>;
  }

  return (
    <div className='tab-content-wrapper'>
      {error && (
        <div className='error-message'>
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
      {success && <div className='ktzi-success'>{success}</div>}

      <div className='ktzi-stats'>
        <span>КТЗІ: <b>{stats.total}</b></span>
        <span>Об’єктів: <b>{stats.objects}</b></span>
        <span>Засобів ТЗІ: <b>{stats.means}</b></span>
      </div>

      <div className='content-controls'>
        <input
          type='text'
          className='search-input'
          placeholder='Пошук за адресою, підрозділом, об’єктом, засобом...'
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <div className='ktzi-object-type-filter' aria-label='Фільтр за типом об’єктів'>
        <span className='ktzi-filter-label'>Тип об’єкта у складі КТЗІ:</span>
        <button
          type='button'
          className={`ktzi-filter-button ${selectedObjectTypes.length === 0 ? 'active' : ''}`}
          aria-pressed={selectedObjectTypes.length === 0}
          onClick={() => setSelectedObjectTypes([])}
        >
          Усі
        </button>
        {OBJECT_TYPES.map((type) => (
          <button
            type='button'
            key={type}
            className={`ktzi-filter-button ${selectedObjectTypes.includes(type) ? 'active' : ''}`}
            aria-pressed={selectedObjectTypes.includes(type)}
            onClick={() => toggleObjectType(type)}
          >
            {OBJECT_TYPE_LABELS[type]}
          </button>
        ))}
        <span className='ktzi-filter-count'>
          Показано: {filtered.length} з {ktzis.length}
        </span>
      </div>

      {!filtered.length && (
        <div className='ktzi-state'>
          {ktzis.length
            ? 'КТЗІ за вибраними критеріями не знайдено.'
            : 'КТЗІ створюється автоматично при додаванні АС, КРТ або службового приміщення з категорією інформації II чи III.'}
        </div>
      )}

      <div className='cards-container compact-mode'>
        {expandedKtzis.map((ktzi) => {
        const isEditing = editingId === ktzi.id;
        const canDelete = !ktzi.objects.length && !ktzi.protectionMeans.length;

        return (
          <div
            key={ktzi.id}
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
                    <section className='card-section' key={section.key}>
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
                    <h4 className='section-title'>Об’єкти у складі КТЗІ</h4>
                    {ktzi.objects.length ? (
                      <div className='ktzi-chips'>
                        {ktzi.objects.map((object, index) => (
                          <span className='badge' key={index}>
                            {OBJECT_TYPE_LABELS[object.objectType] ||
                              object.objectType}
                            : {highlightText(object.objectName || '—', searchTerm)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className='ktzi-muted'>Об’єктів немає</p>
                    )}
                  </section>

                  {DOCUMENT_SECTIONS.map((section) => (
                    <section className='card-section' key={section.key}>
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

                  <section className='card-section'>
                    <h4 className='section-title'>
                      Засоби ТЗІ ({ktzi.protectionMeans.length})
                    </h4>
                    {ktzi.protectionMeans.map((mean) => (
                      <div className='ktzi-mean' key={mean.id}>
                        <span>
                          <b>{highlightText(mean.name, searchTerm)}</b>
                          {mean.toolType && (
                            <>
                              {' · '}
                              {highlightText(mean.toolType, searchTerm)}
                            </>
                          )}
                          {mean.serialNumber && (
                            <>
                              {' · №'}
                              {highlightText(mean.serialNumber, searchTerm)}
                            </>
                          )}
                        </span>
                        <button
                          className='btn-secondary'
                          onClick={() => setMeanToReturn({ ktzi, mean })}
                        >
                          На склад
                        </button>
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
