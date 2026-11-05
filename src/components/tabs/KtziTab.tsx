import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/TabContent.css';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import './KtziTab.css';

type DocumentField = {
  name: string;
  label: string;
  type?: 'text' | 'date' | 'select';
  options?: string[];
};

type KtziDocuments = Record<string, Record<string, string>>;
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
    title: 'Акт КСП',
    fields: [
      { name: 'kspActNumber', label: 'Реєстраційний номер' },
      { name: 'kspActDate', label: 'Дата реєстрації', type: 'date' },
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

const EMPTY_DOCUMENTS: KtziDocuments = Object.fromEntries(
  DOCUMENT_SECTIONS.map(({ key, fields }) => [
    key,
    Object.fromEntries(fields.map(({ name }) => [name, ''])),
  ]),
);

const ktziTitle = (ktzi: Ktzi) =>
  [
    ktzi.subdivisionName || 'Без підрозділу',
    ktzi.premisesNumber ? `каб. ${ktzi.premisesNumber}` : '',
  ]
    .filter(Boolean)
    .join(', ');

const formatValue = (value?: string) => {
  if (!value) return '—';
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.split('-').reverse().join('.')
    : value;
};

export default function KtziTab() {
  const [ktzis, setKtzis] = useState<Ktzi[]>([]);
  const [stock, setStock] = useState<StockMean[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [mainForm, setMainForm] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<KtziDocuments>(EMPTY_DOCUMENTS);
  const [saving, setSaving] = useState(false);
  const [installForId, setInstallForId] = useState<number | null>(null);
  const [stockChoice, setStockChoice] = useState('');
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [ktziToDelete, setKtziToDelete] = useState<Ktzi | null>(null);
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
      if (match) setHighlightId(Number(match[1]));
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return ktzis;
    return ktzis.filter((ktzi) =>
      JSON.stringify([
        ktzi.address,
        ktzi.premisesNumber,
        ktzi.subdivisionName,
        ktzi.serviceName,
        ktzi.objects.map((object) => object.objectName),
        ktzi.protectionMeans.map((mean) => [mean.name, mean.serialNumber]),
        ktzi.documents,
      ])
        .toLowerCase()
        .includes(term),
    );
  }, [ktzis, searchTerm]);

  const stats = useMemo(
    () => ({
      total: ktzis.length,
      objects: ktzis.reduce((sum, ktzi) => sum + ktzi.objects.length, 0),
      means: ktzis.reduce((sum, ktzi) => sum + ktzi.protectionMeans.length, 0),
    }),
    [ktzis],
  );

  const startEdit = (ktzi: Ktzi) => {
    setEditingId(ktzi.id);
    setMainForm(
      Object.fromEntries(
        MAIN_FIELDS.map(({ name }) => [name, String(ktzi[name] ?? '')]),
      ),
    );
    setDocuments({ ...EMPTY_DOCUMENTS, ...ktzi.documents });
    setError('');
    setSuccess('');
  };

  const updateDocumentField = (
    documentType: string,
    fieldName: string,
    value: string,
  ) =>
    setDocuments((current) => ({
      ...current,
      [documentType]: { ...(current[documentType] || {}), [fieldName]: value },
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

      {!filtered.length && (
        <div className='ktzi-state'>
          КТЗІ створюється автоматично при додаванні АС, КРТ або службового
          приміщення з категорією інформації II чи III.
        </div>
      )}

      {filtered.map((ktzi) => {
        const isEditing = editingId === ktzi.id;
        const canDelete = !ktzi.objects.length && !ktzi.protectionMeans.length;
        return (
          <div
            key={ktzi.id}
            className={`generic-card ${highlightId === ktzi.id ? 'ktzi-highlight' : ''}`}
          >
            <div className='card-header'>
              <div className='card-title'>
                <h3>{ktziTitle(ktzi)}</h3>
                <p className='subtitle'>
                  {[ktzi.address, ktzi.serviceName].filter(Boolean).join(' · ')}
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
                      <div className='ktzi-fields'>
                        {section.fields.map((field) => (
                          <label key={field.name}>
                            <span>{field.label}</span>
                            {field.type === 'select' ? (
                              <select
                                value={documents[section.key]?.[field.name] || ''}
                                onChange={(event) =>
                                  updateDocumentField(
                                    section.key,
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
                                value={documents[section.key]?.[field.name] || ''}
                                onChange={(event) =>
                                  updateDocumentField(
                                    section.key,
                                    field.name,
                                    event.target.value,
                                  )
                                }
                              />
                            )}
                          </label>
                        ))}
                      </div>
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
                            : {object.objectName || '—'}
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
                      <div className='info-grid'>
                        {section.fields.map((field) => (
                          <div className='info-item' key={field.name}>
                            <span className='label'>{field.label}:</span>
                            <span className='value'>
                              {formatValue(ktzi.documents?.[section.key]?.[field.name])}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}

                  <section className='card-section'>
                    <h4 className='section-title'>
                      Засоби ТЗІ ({ktzi.protectionMeans.length})
                    </h4>
                    {ktzi.protectionMeans.map((mean) => (
                      <div className='ktzi-mean' key={mean.id}>
                        <span>
                          <b>{mean.name}</b>
                          {mean.toolType ? ` · ${mean.toolType}` : ''}
                          {mean.serialNumber ? ` · №${mean.serialNumber}` : ''}
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

      {ktziToDelete && (
        <DeleteConfirmModal
          fullName={`КТЗІ ${ktziTitle(ktziToDelete)}`}
          onConfirm={() => void remove(ktziToDelete)}
          onCancel={() => setKtziToDelete(null)}
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
