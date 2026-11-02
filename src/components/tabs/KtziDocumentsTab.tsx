import { FormEvent, useEffect, useState } from 'react';
import '../../styles/TabContent.css';
import './KtziDocumentsTab.css';

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
type Ktzi = {
  id: number;
  address?: string;
  premisesNumber?: string;
  subdivisionName?: string;
  objects: { objectType: string; objectName?: string }[];
  documents: KtziDocuments;
  migrationConflicts: MigrationConflict[];
};

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
      {
        name: 'categorizationActNumber',
        label: 'Номер акту',
      },
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
      {
        name: 'categorizationValidUntil',
        label: 'Термін дії',
        type: 'date',
      },
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
      {
        name: 'attestationValidUntil',
        label: 'Дійсний до',
        type: 'date',
      },
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

const EMPTY_DOCUMENTS = Object.fromEntries(
  DOCUMENT_SECTIONS.map(({ key, fields }) => [
    key,
    Object.fromEntries(fields.map(({ name }) => [name, ''])),
  ]),
);

const ktziLabel = (ktzi: Ktzi) =>
  [
    ktzi.address || 'Без адреси',
    ktzi.premisesNumber ? `прим. ${ktzi.premisesNumber}` : '',
    ktzi.subdivisionName,
  ]
    .filter(Boolean)
    .join(' · ');

export default function KtziDocumentsTab() {
  const [ktzis, setKtzis] = useState<Ktzi[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [documents, setDocuments] = useState<KtziDocuments>(EMPTY_DOCUMENTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedKtzi = ktzis.find((ktzi) => String(ktzi.id) === selectedId);

  useEffect(() => {
    const loadKtzis = async () => {
      try {
        const response = await fetch('/api/ktzi');
        if (!response.ok) throw new Error('Не вдалося завантажити перелік КТЗІ');
        const data: Ktzi[] = await response.json();
        setKtzis(data);
        if (data.length) {
          setSelectedId(String(data[0].id));
          setDocuments({ ...EMPTY_DOCUMENTS, ...data[0].documents });
        }
      } catch (loadError) {
        console.error('Помилка завантаження КТЗІ:', loadError);
        setError((loadError as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void loadKtzis();
  }, []);

  const handleKtziChange = (id: string) => {
    setSelectedId(id);
    const ktzi = ktzis.find((item) => String(item.id) === id);
    setDocuments({ ...EMPTY_DOCUMENTS, ...(ktzi?.documents || {}) });
    setError('');
    setSuccess('');
  };

  const updateDocumentField = (
    documentType: string,
    fieldName: string,
    value: string,
  ) => {
    setDocuments((current) => ({
      ...current,
      [documentType]: {
        ...(current[documentType] || {}),
        [fieldName]: value,
      },
    }));
    setSuccess('');
  };

  const saveDocuments = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/ktzi/${selectedId}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Помилка збереження');
      setDocuments({ ...EMPTY_DOCUMENTS, ...result.documents });
      setKtzis((current) =>
        current.map((ktzi) =>
          String(ktzi.id) === selectedId
            ? {
                ...ktzi,
                documents: result.documents,
                migrationConflicts: result.migrationConflicts,
              }
            : ktzi,
        ),
      );
      setSuccess('Спільні документи КТЗІ збережено');
    } catch (saveError) {
      console.error('Помилка збереження документів КТЗІ:', saveError);
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className='ktzi-documents-state'>Завантаження КТЗІ...</div>;
  }

  return (
    <div className='ktzi-documents-container'>
      <p className='ktzi-documents-intro'>
        Заповніть спільні документи один раз. Вони автоматично відображаються в
        картках усіх об’єктів, що входять до цього КТЗІ.
      </p>

      {error && <div className='error-message'>{error}</div>}

      {!ktzis.length ? (
        <div className='ktzi-documents-state'>
          КТЗІ з’явиться тут після створення першого об’єкта на вкладках АС,
          КРТ або службових приміщень.
        </div>
      ) : (
        <>
          <label className='ktzi-selector-label' htmlFor='ktzi-selector'>
            КТЗІ
          </label>
          <select
            id='ktzi-selector'
            className='ktzi-selector'
            value={selectedId}
            onChange={(event) => handleKtziChange(event.target.value)}
          >
            {ktzis.map((ktzi) => (
              <option key={ktzi.id} value={ktzi.id}>
                {ktziLabel(ktzi)}
              </option>
            ))}
          </select>

          {selectedKtzi && (
            <div className='ktzi-objects-list'>
              <strong>Об’єкти у складі КТЗІ:</strong>{' '}
              {selectedKtzi.objects.length
                ? selectedKtzi.objects
                    .map(
                      (object) =>
                        `${object.objectName || 'Об’єкт'} (${object.objectType})`,
                    )
                    .join(', ')
                : 'об’єкти не знайдені'}
            </div>
          )}

          {!!selectedKtzi?.migrationConflicts?.length && (
            <div className='ktzi-migration-warning'>
              <strong>
                У старих картках знайдено різні реквізити спільних документів.
                Автоматично жоден варіант не обрано.
              </strong>
              <p>
                Звірте наведені дані та внесіть правильний варіант у відповідну
                форму нижче. Старі записи в картках збережені.
              </p>
              {selectedKtzi.migrationConflicts.map((conflict) => {
                const section = DOCUMENT_SECTIONS.find(
                  (item) => item.key === conflict.documentType,
                );
                return (
                  <div key={conflict.documentType}>
                    <strong>{section?.title || conflict.documentType}</strong>
                    <ul>
                      {conflict.candidates.map((candidate, index) => (
                        <li key={`${candidate.objectType}-${index}`}>
                          {candidate.objectName} ({candidate.objectType}):{' '}
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

          <form onSubmit={saveDocuments}>
            <div className='ktzi-documents-grid'>
              {DOCUMENT_SECTIONS.map((section) => (
                <section className='ktzi-document-section' key={section.key}>
                  <h3>{section.title}</h3>
                  <div className='ktzi-document-fields'>
                    {section.fields.map((field) => (
                      <label key={field.name}>
                        <span>{field.label}</span>
                        {field.type === 'select' ? (
                          <select
                            value={
                              documents[section.key]?.[field.name] || ''
                            }
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
                            value={
                              documents[section.key]?.[field.name] || ''
                            }
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
            </div>
            <div className='ktzi-documents-actions'>
              {success && <span className='ktzi-documents-success'>{success}</span>}
              <button className='btn-primary' type='submit' disabled={saving}>
                {saving ? 'Збереження...' : 'Зберегти документи КТЗІ'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
