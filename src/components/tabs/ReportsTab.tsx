import { useMemo, useState } from 'react';
import './ReportsTab.css';

interface ReportField {
  path: string;
  label: string;
}

interface ReportDataset {
  id: string;
  label: string;
  fields: ReportField[];
  defaults: string[];
}

interface ReportColumn {
  path: string;
  label: string;
  header: string;
}

type DataRecord = Record<string, unknown>;

const field = (path: string, label: string): ReportField => ({ path, label });

const datasets: ReportDataset[] = [
  {
    id: 'class_a_systems',
    label: 'АС / комбіновані ОІД',
    fields: [
      field('subdivisionName', 'Підрозділ'),
      field('subdivisionType', 'Тип підрозділу'),
      field('serviceName', 'Назва служби'),
      field('systemClass', 'Клас системи'),
      field('systemName', 'Назва системи'),
      field('objectType', 'Тип об’єкта'),
      field('informationCategory', 'Категорія інформації'),
      field('address', 'Адреса'),
      field('premisesNumber', 'Номер приміщення'),
      field('kzzName', 'Назва КЗЗ'),
      field('kzzSerial', 'Серійний номер КЗЗ'),
      field('antivirus', 'Антивірус'),
      field('passportNumber', 'Номер паспорта на КТЗІ'),
      field('passportDate', 'Дата паспорта'),
      field('categorization.categorizationRank', 'Категорія приміщення'),
      field('categorization.categorizationActNumber', 'Номер акта категоріювання'),
      field('categorization.categorizationActDate', 'Дата акта категоріювання'),
      field('technicalTask.taskNumber', 'Номер технічного завдання'),
      field('technicalTask.taskDate', 'Дата технічного завдання'),
      field('instrumentalControl.controlNumber', 'Номер протокола інструментального контролю'),
      field('instrumentalControl.controlDate', 'Дата протоколу інструментального контролю'),
      field('instrumentalControl.controlTermin', 'Термін дії протокола інструментального контролю'),
      field('specialCheck.checkNumber', 'Номер акта спеціальної перевірки'),
      field('specialCheck.checkDate', 'Дата акта спеціальної перевірки'),
      field('specialResearch.registrationNumber', 'Номер протокола спеціального дослідження'),
      field('specialResearch.registrationDate', 'Дата протоколу спеціального дослідження'),
      field('atestation.attestationRegNumber', 'Номер акта атестації'),
      field('atestation.attestationRegDate', 'Дата акта атестації'),
      field('atestation.attestationValidUntil', 'Акт атестації чинний до'),
      field('atestation.attestationDsszziNumber', 'Номер акта атестації ДССЗЗІ'),
      field('atestation.attestationDsszziDate', 'Дата акта атестації ДССЗЗІ'),
      field('software.name', 'Програмне забезпечення'),
      field('software.version', 'Версія ПЗ'),
      field('software.manufacturer', 'Виробник ПЗ'),
      field('ktziInfo.protectionMeans.toolType', 'Категорія засобу ТЗІ'),
      field('ktziInfo.protectionMeans.name', 'Назва засобу ТЗІ'),
      field('ktziInfo.protectionMeans.serialNumber', 'Серійний номер засобу ТЗІ'),
      field('complianceDocuments.documentType', 'Тип документа'),
      field('complianceDocuments.dsszzіNumber', 'Номер ДССЗЗІ'),
      field('complianceDocuments.dsszzіDate', 'Дата ДССЗЗІ'),
      field('complianceDocuments.inclusionDate', 'Дата включення до Переліку авторизованих систем'),
      field('complianceDocuments.serialNumberInList', 'Порядковий номер у Переліку авторизованих систем'),
      field('complianceDocuments.nextAuthorizationDeadline', 'Кінцевий строк проведення планової авторизації'),
    ],
    defaults: ['subdivisionName', 'systemName', 'systemClass', 'address'],
  },
  {
    id: 'service_premises',
    label: 'Службові приміщення',
    fields: [
      field('subdivisionName', 'Підрозділ'),
      field('subdivisionType', 'Тип підрозділу'),
      field('serviceName', 'Назва служби'),
      field('premisesNumber', 'Номер приміщення'),
      field('address', 'Адреса'),
      field('informationCategory', 'Категорія інформації'),
      field('passportNumber', 'Номер паспорта на КТЗІ'),
      field('passportDate', 'Дата паспорта'),
      field('categorization.categorizationRank', 'Категорія приміщення'),
      field('categorization.categorizationActNumber', 'Номер акта категоріювання'),
      field('technicalTask.taskNumber', 'Номер технічного завдання'),
      field('technicalTask.taskDate', 'Дата технічного завдання'),
      field('instrumentalControl.controlNumber', 'Номер протокола інструментального контролю'),
      field('instrumentalControl.controlDate', 'Дата протоколу інструментального контролю'),
      field('instrumentalControl.controlTermin', 'Термін дії протокола інструментального контролю'),
      field('specialCheck.checkNumber', 'Номер акта спеціальної перевірки'),
      field('specialCheck.checkDate', 'Дата акта спеціальної перевірки'),
      field('atestation.attestationRegNumber', 'Номер акта атестації'),
      field('atestation.attestationRegDate', 'Дата акта атестації'),
      field('atestation.attestationValidUntil', 'Акт атестації чинний до'),
      field('atestation.attestationDsszziNumber', 'Номер акта атестації ДССЗЗІ'),
      field('atestation.attestationDsszziDate', 'Дата акта атестації ДССЗЗІ'),
      field('ktziInfo.protectionMeans.toolType', 'Категорія засобу ТЗІ'),
      field('ktziInfo.protectionMeans.name', 'Назва засобу ТЗІ'),
      field('ktziInfo.protectionMeans.serialNumber', 'Серійний номер засобу ТЗІ'),
      field('governmentalCommunicationMeans.subscriberDeviceName', 'Засіб урядового зв’язку'),
      field('governmentalCommunicationMeans.subscriberDeviceSerialNumber', 'Серійний номер засобу зв’язку'),
    ],
    defaults: ['subdivisionName', 'premisesNumber', 'address'],
  },
  {
    id: 'krt',
    label: 'КРТ',
    fields: [
      field('subdivisionName', 'Підрозділ'),
      field('subdivisionType', 'Тип підрозділу'),
      field('serviceName', 'Назва служби'),
      field('systemName', 'Назва КРТ'),
      field('premisesNumber', 'Номер приміщення'),
      field('address', 'Адреса'),
      field('informationCategory', 'Категорія інформації'),
      field('passportNumber', 'Номер паспорта на КТЗІ'),
      field('passportDate', 'Дата паспорта'),
      field('categorization.categorizationRank', 'Категорія КРТ'),
      field('categorization.categorizationActNumber', 'Номер акта категоріювання'),
      field('technicalTask.taskNumber', 'Номер технічного завдання'),
      field('technicalTask.taskDate', 'Дата технічного завдання'),
      field('instrumentalControl.controlNumber', 'Номер протокола інструментального контролю'),
      field('instrumentalControl.controlDate', 'Дата протоколу інструментального контролю'),
      field('instrumentalControl.controlTermin', 'Термін дії протокола інструментального контролю'),
      field('specialCheck.checkNumber', 'Номер акта спеціальної перевірки'),
      field('specialCheck.checkDate', 'Дата акта спеціальної перевірки'),
      field('atestation.attestationRegNumber', 'Номер акта атестації'),
      field('atestation.attestationRegDate', 'Дата акта атестації'),
      field('atestation.attestationValidUntil', 'Акт атестації чинний до'),
      field('atestation.attestationDsszziNumber', 'Номер акта атестації ДССЗЗІ'),
      field('atestation.attestationDsszziDate', 'Дата акта атестації ДССЗЗІ'),
      field('ktziInfo.protectionMeans.toolType', 'Категорія засобу ТЗІ'),
      field('ktziInfo.protectionMeans.name', 'Назва засобу ТЗІ'),
      field('ktziInfo.protectionMeans.serialNumber', 'Серійний номер засобу ТЗІ'),
    ],
    defaults: ['subdivisionName', 'systemName', 'premisesNumber', 'address'],
  },
  {
    id: 'iks',
    label: 'ІКС',
    fields: [
      field('systemName', 'Назва системи'),
      field('systemClass', 'Клас системи'),
      field('subdivisionName', 'Підрозділ'),
      field('subdivisionType', 'Тип підрозділу'),
      field('accessMode', 'Режим доступу'),
      field('kzzName', 'Назва КЗЗ'),
      field('kzzSerial', 'Серійний номер КЗЗ'),
      field('antivirus', 'Антивірус'),
      field('categorization.categorizationRank', 'Категорія системи'),
      field('categorization.categorizationActNumber', 'Номер акта категоріювання'),
      field('computerEquipment.serversCount', 'Кількість серверів'),
      field('computerEquipment.workstationsCount', 'Кількість робочих станцій'),
      field('computerEquipment.networkEquipmentCount', 'Кількість мережевого обладнання'),
      field('atestation.attestationRegNumber', 'Номер акта атестації'),
      field('atestation.attestationRegDate', 'Дата акта атестації'),
      field('atestation.attestationValidUntil', 'Акт атестації чинний до'),
      field('atestation.attestationDsszziNumber', 'Номер акта атестації ДССЗЗІ'),
      field('atestation.attestationDsszziDate', 'Дата акта атестації ДССЗЗІ'),
      field('complianceDocuments.documentType', 'Тип документа відповідності'),
      field('complianceDocuments.validUntil', 'Документ чинний до'),
      field('protectionMeans.name', 'Засіб захисту'),
      field('protectionMeans.serialNumber', 'Серійний номер засобу захисту'),
    ],
    defaults: ['systemName', 'systemClass', 'subdivisionName', 'accessMode'],
  },
  {
    id: 'personnel',
    label: 'Особовий склад',
    fields: [
      field('fullName', 'ПІБ'),
      field('position', 'Посада'),
      field('officialRank', 'Спецзвання за посадою'),
      field('actualRank', 'Фактичне спецзвання'),
      field('department', 'Підрозділ'),
      field('dateOfBirth', 'Дата народження'),
      field('dateOfOvs', 'Дата початку служби в ОВС'),
      field('dateOfNpu', 'Дата початку служби в НПУ'),
      field('dateOfPosition', 'Дата призначення на посаду'),
      field('email', 'Службова електронна пошта'),
      field('phone', 'Службовий телефон'),
      field('mobilePhone', 'Мобільний телефон'),
      field('education.institution', 'Навчальний заклад'),
      field('education.specialties', 'Спеціальність'),
      field('education.educationRank', 'Рівень освіти'),
      field('education.yearCompleted', 'Рік закінчення навчання'),
      field('certificates.trainingName', 'Курс / семінар'),
      field('certificates.certificateNumber', 'Номер свідоцтва'),
      field('certificates.year', 'Рік навчання'),
    ],
    defaults: ['fullName', 'position', 'department'],
  },
  {
    id: 'search-control-equipment',
    label: 'Вимірювальна та пошукова техніка',
    fields: [
      field('category', 'Категорія'),
      field('name', 'Назва'),
      field('serialNumber', 'Серійний номер'),
      field('invertarNumber', 'Інвентарний номер'),
      field('releaseYear', 'Рік випуску'),
      field('technicalCondition', 'Технічний стан'),
      field('pricePerUnit', 'Вартість одиниці'),
      field('notes', 'Примітки'),
    ],
    defaults: ['category', 'name', 'serialNumber', 'technicalCondition'],
  },
  {
    id: 'tzi-check',
    label: 'Перевірки ТЗІ',
    fields: [
      field('checkType', 'Тип перевірки'),
      field('checkOrganName', 'Орган, що проводив перевірку'),
      field('organName', 'Назва органу / підрозділу'),
      field('startDate', 'Дата початку'),
      field('endDate', 'Дата завершення'),
      field('violationFirstCategory', 'Порушення I категорії'),
      field('violationSecondCategory', 'Порушення II категорії'),
      field('violationThirdCategory', 'Порушення III категорії'),
      field('detailsViolation', 'Деталі порушень'),
      field('holdAccountable', 'Притягнуті до відповідальності'),
    ],
    defaults: ['organName', 'startDate', 'endDate', 'checkType'],
  },
];

const getValues = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(getValues);
  if (value === null || value === undefined || value === '') return [];
  if (typeof value === 'object') return [];
  return [String(value)];
};

const getValuesAtPath = (value: unknown, segments: string[]): string[] => {
  if (segments.length === 0) return getValues(value);
  if (Array.isArray(value)) {
    return value.flatMap((item) => getValuesAtPath(item, segments));
  }
  if (value && typeof value === 'object') {
    return getValuesAtPath(
      (value as DataRecord)[segments[0]],
      segments.slice(1),
    );
  }
  return [];
};

const getFieldValue = (record: DataRecord, path: string): string =>
  getValuesAtPath(record, path.split('.')).join('; ');

const csvCell = (value: string): string => {
  const safeValue = /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
};

function ReportsTab() {
  const [datasetId, setDatasetId] = useState(datasets[0].id);
  const dataset = datasets.find((item) => item.id === datasetId) ?? datasets[0];
  const [columns, setColumns] = useState<ReportColumn[]>(
    dataset.defaults.map((path) => {
      const selectedField = dataset.fields.find((item) => item.path === path)!;
      return { ...selectedField, header: selectedField.label };
    }),
  );
  const [reportTitle, setReportTitle] = useState('Звіт');
  const [records, setRecords] = useState<DataRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableFields = useMemo(
    () => dataset.fields.filter((item) => !columns.some((column) => column.path === item.path)),
    [columns, dataset],
  );

  const changeDataset = (nextDatasetId: string) => {
    const nextDataset = datasets.find((item) => item.id === nextDatasetId);
    if (!nextDataset) return;
    setDatasetId(nextDatasetId);
    setColumns(
      nextDataset.defaults.map((path) => {
        const selectedField = nextDataset.fields.find((item) => item.path === path)!;
        return { ...selectedField, header: selectedField.label };
      }),
    );
    setRecords(null);
    setError('');
  };

  const addField = (path: string) => {
    const selectedField = dataset.fields.find((item) => item.path === path);
    if (!selectedField) return;
    setColumns((current) => [...current, { ...selectedField, header: selectedField.label }]);
  };

  const updateColumn = (index: number, update: Partial<ReportColumn>) => {
    setColumns((current) =>
      current.map((column, columnIndex) =>
        columnIndex === index ? { ...column, ...update } : column,
      ),
    );
  };

  const moveColumn = (index: number, offset: number) => {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    setColumns((current) => {
      const reordered = [...current];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered;
    });
  };

  const generateReport = async () => {
    if (columns.length === 0) {
      setError('Додайте до макету принаймні одне поле.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/objects/${encodeURIComponent(dataset.id)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error('Сервер повернув неочікуваний формат даних.');
      setRecords(data as DataRecord[]);
    } catch (requestError) {
      console.error('Помилка формування звіту:', requestError);
      setError('Не вдалося завантажити дані для звіту. Перевірте з’єднання та спробуйте ще раз.');
      setRecords(null);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!records || columns.length === 0) return;
    const rows = [
      columns.map((column) => csvCell(column.header)),
      ...records.map((record) =>
        columns.map((column) => csvCell(getFieldValue(record, column.path))),
      ),
    ];
    const content = `\uFEFF${rows.map((row) => row.join(';')).join('\r\n')}`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = reportTitle.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-');
    link.href = url;
    link.download = `${safeTitle || 'Звіт'}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className='reports-builder'>
      <header className='reports-intro'>
        <div>
          <span className='reports-eyebrow'>Конструктор таблиць</span>
          <h2>Створіть звіт із даних застосунку</h2>
          <p>Оберіть набір даних, додайте потрібні поля та розташуйте їх у бажаному порядку.</p>
        </div>
      </header>

      <section className='reports-card reports-source'>
        <label htmlFor='report-dataset'>1. Набір даних</label>
        <select id='report-dataset' value={datasetId} onChange={(event) => changeDataset(event.target.value)}>
          {datasets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <p>Поля з пов’язаних записів об’єднуються в одній клітинці через крапку з комою.</p>
      </section>

      <section className='reports-card'>
        <div className='reports-section-heading'>
          <div>
            <h3>2. Макет стовпчиків</h3>
            <p>Порядок полів у списку відповідає порядку стовпчиків у звіті.</p>
          </div>
        </div>

        {columns.length === 0 ? (
          <div className='reports-empty-layout'>Додайте поля до макету нижче.</div>
        ) : (
          <ol className='reports-column-list'>
            {columns.map((column, index) => (
              <li className='reports-column' key={column.path}>
                <span className='reports-column-number'>{index + 1}</span>
                <div className='reports-column-fields'>
                  <span>{column.label}</span>
                  <input
                    aria-label={`Заголовок стовпчика ${index + 1}`}
                    value={column.header}
                    onChange={(event) => updateColumn(index, { header: event.target.value })}
                    placeholder='Назва стовпчика'
                  />
                </div>
                <div className='reports-column-actions'>
                  <button type='button' onClick={() => moveColumn(index, -1)} disabled={index === 0} aria-label='Перемістити стовпчик ліворуч'>←</button>
                  <button type='button' onClick={() => moveColumn(index, 1)} disabled={index === columns.length - 1} aria-label='Перемістити стовпчик праворуч'>→</button>
                  <button type='button' className='reports-remove-column' onClick={() => setColumns((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Вилучити поле ${column.label}`}>×</button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className='reports-add-field'>
          <label htmlFor='report-field'>Додати поле</label>
          <select id='report-field' value='' onChange={(event) => addField(event.target.value)}>
            <option value='' disabled>Оберіть поле зі списку</option>
            {availableFields.map((item) => <option key={item.path} value={item.path}>{item.label}</option>)}
          </select>
        </div>
      </section>

      <section className='reports-card reports-actions'>
        <label htmlFor='report-title'>Назва звіту</label>
        <input id='report-title' value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} />
        <button type='button' className='reports-primary-button' onClick={generateReport} disabled={loading || columns.length === 0}>
          {loading ? 'Формуємо звіт…' : 'Сформувати звіт'}
        </button>
      </section>

      {error && <div className='reports-error' role='alert'>{error}</div>}

      {records !== null && (
        <section className='reports-card reports-result'>
          <div className='reports-result-heading'>
            <div>
              <h3>{reportTitle || 'Звіт'}</h3>
              <p>Записів: {records.length}</p>
            </div>
            <button type='button' className='reports-export-button' onClick={exportCsv} disabled={records.length === 0}>
              Завантажити для Excel
            </button>
          </div>
          {records.length === 0 ? (
            <div className='reports-empty-layout'>Для цього набору даних поки немає записів.</div>
          ) : (
            <div className='reports-table-wrapper'>
              <table className='reports-table'>
                <thead>
                  <tr>{columns.map((column) => <th key={column.path}>{column.header || column.label}</th>)}</tr>
                </thead>
                <tbody>
                  {records.map((record, rowIndex) => (
                    <tr key={String(record.id ?? rowIndex)}>
                      {columns.map((column) => <td key={column.path}>{getFieldValue(record, column.path) || '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className='reports-export-note'>Файл CSV у кодуванні UTF-8 сумісний з Excel і відкривається як таблиця.</p>
        </section>
      )}
    </div>
  );
}

export default ReportsTab;
