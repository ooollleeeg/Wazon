import GenericTab, { TabConfig } from '../common/GenericTab';
import GenericForm, { FormConfig } from '../common/GenericForm';
import GenericList, { ListConfig } from '../common/GenericList';
import GenericCard, { CardConfig } from '../common/GenericCard';
import KRTCardCompact from '../krt/KRTCardCompact';

// ===== FORM CONFIG =====
const krtFormConfig: FormConfig = {
  title: 'КРТ',
  sections: [
    {
      title: '🏢 Основна інформація',
      fields: [
        {
          name: 'address',
          label: 'Адреса',
          type: 'text',
          placeholder: 'Наприклад: 01001, м. Київ, вул. Хрещатик, 26',
          fullWidth: true,
        },
        {
          name: 'premisesNumber',
          label: 'Номер приміщення, в якому розміщується КРТ',
          type: 'text',
          placeholder: 'Наприклад: 101',
        },
        {
          name: 'subdivisionName',
          label: 'Назва підрозділу',
          type: 'text',
          required: true,
          placeholder: 'Наприклад: УБН',
        },
        {
          name: 'subdivisionType',
          label: 'Тип підрозділу',
          type: 'select',
          required: true,
          options: [
            { value: 'підрозділ апарату', label: 'підрозділ апарату' },
            {
              value: 'територіальний підрозділ',
              label: 'територіальний підрозділ',
            },
          ],
        },
        {
          name: 'serviceName',
          label: 'Назва служби',
          type: 'text',
          placeholder: 'Наприклад: РСС',
        },
        {
          name: 'systemName',
          label: 'Назва КРА',
          type: 'text',
          placeholder: 'Назва копіювально-розмножувальної апаратури',
          required: true,
        },
      ],
    },

    {
      title: 'Паспорт на комплекс технічного захисту інформації',
      icon: '📋',
      fields: [
        {
          name: 'passportNumber',
          label: 'Реєстраційний номер',
          type: 'text',
          placeholder: 'Наприклад: 16/2-66т',
        },
        {
          name: 'passportDate',
          label: 'Дата реєстрації',
          type: 'date',
        },
      ],
    },
  ],
  nestedFields: [
    {
      name: 'categorization',
      title: 'Категоріювання ОІД',
      icon: '📋',
      dateField: 'categorizationActDate',
      defaultItem: {
        categorizationActDate: '',
        categorizationActNumber: '',
        categorizationRank: '',
        categorizationValidUntil: '',
        foreignCriticalArea: '',
        hightInformationRank: '',
      },
      fields: [
        {
          name: 'categorizationActDate',
          label: 'Дата реєстрації акта категоріювання',
          type: 'date',
        },
        {
          name: 'categorizationActNumber',
          label: 'Номер акта категоріювання',
          type: 'text',
          placeholder: 'Наприклад: 16/2-11дск',
        },
        {
          name: 'categorizationRank',
          label: 'Встановлена категорія',
          type: 'select',
          options: [
            { value: 'I', label: 'I' },
            { value: 'II', label: 'II' },
            { value: 'III', label: 'III' },
            { value: 'IV', label: 'IV' },
          ],
        },
        {
          name: 'categorizationValidUntil',
          label: 'Термін дії категоріювання',
          type: 'date',
          calculateFrom: { field: 'categorizationActDate', years: 5 },
          helperText: 'Розраховується автоматично як дата реєстрації + 5 років',
        },
        {
          name: 'foreignCriticalArea',
          label:
            'Наявність в критичній зоні екстериторіальних установ (організацій)',
          type: 'select',
          options: [
            { value: 'Наявні', label: 'Наявні' },
            { value: 'Відсутні', label: 'Відсутні' },
          ],
        },
        {
          name: 'hightInformationRank',
          label: 'Вищий ступінь обмеження доступу до інформації',
          fullWidth: true,
          type: 'select',
          options: [
            { value: 'цілком таємно', label: 'цілком таємно' },
            { value: 'таємно', label: 'таємно' },
            {
              value: 'для службового користування',
              label: 'для службового користування',
            },
            {
              value: 'конфіденційна інформація',
              label: 'конфіденційна інформація',
            },
          ],
        },
      ],
    },
    {
      name: 'technicalTask',
      title: 'Технічне завдання на створення комплексу ТЗІ',
      icon: '🛠️',
      dateField: 'taskDate',
      defaultItem: { taskDate: '', taskNumber: '', taskClearance: '' },
      fields: [
        {
          name: 'taskDate',
          label: 'Дата реєстрації технічного завдання',
          type: 'date',
        },
        {
          name: 'taskNumber',
          label: 'Реєстраційний номер технічного завдання',
          type: 'text',
          placeholder: 'Наприклад: 16/2-55т',
        },
        {
          name: 'taskClearance',
          label: 'Дата погодження технічного завдання',
          type: 'date',
        },
      ],
    },
    {
      name: 'instrumentalControl',
      title: 'Протокол інструментального контролю захищеності інформації',
      icon: '🔍',
      defaultItem: {
        controlNumber: '',
        controlDate: '',
        controlTermin: '',
        controlPerformer: 'УРТЗІ ГУНП',
        permissionPerformer:
          'Дозвіл на проведення робіт з технічного захисту інформації для власних потреб, від 16.09.2024 № Д-14/123',
      },
      fields: [
        {
          name: 'controlNumber',
          label: 'Реєстраційний номер протокола',
          type: 'text',
          placeholder: 'Наприклад: 7/1-71т',
        },
        {
          name: 'controlDate',
          label: 'Дата реєстрації протокола',
          type: 'date',
        },

        {
          name: 'controlTermin',
          label: 'Термін дії протокола',
          type: 'date',
        },
        {
          name: 'controlPerformer',
          label: 'Виконавець робіт з ТЗІ',
          type: 'text',
          placeholder: 'Наприклад: ДРТЗІ НПУ',
        },
        {
          name: 'permissionPerformer',
          label: 'Реквізити Дозволу (ліцензії) на проведення робіт',
          type: 'text',
          fullWidth: true,
          placeholder:
            'Наприклад: Дозвіл на проведення робіт з технічного захисту інформації для власних потреб, від 16.09.2024 № Д-14/123',
        },
      ],
    },
    {
      name: 'specialCheck',
      title: 'Акт комплексної спеціальної перевірки',
      icon: '🔍',
      dateField: 'checkDate',
      defaultItem: {
        checkNumber: '',
        checkDate: '',
        checkPerformer: 'УРТЗІ ГУНП',
        checkPermissionPerformer:
          'Дозвіл на проведення робіт з технічного захисту інформації для власних потреб, від 16.09.2024 № Д-14/123',
      },
      fields: [
        {
          name: 'checkNumber',
          label: 'Реєстраційний номер акта',
          type: 'text',
          placeholder: 'Наприклад: 16/2-71т',
        },
        {
          name: 'checkDate',
          label: 'Дата реєстрації акта',
          type: 'date',
        },

        {
          name: 'checkPerformer',
          label: 'Виконавець робіт з ТЗІ',
          type: 'text',
          placeholder: 'Наприклад: ДРТЗІ НПУ',
        },
        {
          name: 'checkPermissionPerformer',
          label: 'Реквізити Дозволу (ліцензії) на проведення робіт',
          type: 'text',
          fullWidth: true,
          placeholder:
            'Наприклад: Дозвіл на проведення робіт з технічного захисту інформації для власних потреб, від 16.09.2024 № Д-14/123',
        },
      ],
    },
    {
      name: 'atestation',
      title: 'Атестація комплексу технічного захисту інформації',
      icon: '✅',
      dateField: 'attestationRegDate',
      defaultItem: {
        attestationRegNumber: '',
        attestationRegDate: '',
        attestationDsszziDate: '',
        attestationDsszziNumber: '',
        attestationValidUntil: '',
        atestationPerformer: 'УРТЗІ ГУНП',
        atestationPermissionPerformer:
          'Дозвіл на проведення робіт з технічного захисту інформації для власних потреб, від 16.09.2024 № Д-14/123',
      },
      fields: [
        {
          name: 'attestationRegNumber',
          label: 'Реєстраційний номер акта атестації',
          type: 'text',
          placeholder: 'Наприклад: 16/2-71т',
        },
        {
          name: 'attestationRegDate',
          label: 'Дата реєстрації акта атестації',
          type: 'date',
        },

        {
          name: 'attestationDsszziDate',
          label: 'Дата реєстрації акта в ДССЗЗІ',
          type: 'date',
        },
        {
          name: 'attestationDsszziNumber',
          label: 'Реєстраційний номер акта в ДССЗЗІ',
          type: 'text',
          placeholder: 'Наприклад: 2226',
        },
        {
          name: 'attestationValidUntil',
          label: 'Акт атестації дійсний до',
          type: 'date',
        },
        {
          name: 'atestationPerformer',
          label: 'Виконавець робіт з атестації комплексу ТЗІ',
          type: 'text',
          placeholder: 'Наприклад: ДРТЗІ НПУ',
        },
        {
          name: 'atestationPermissionPerformer',
          label: 'Реквізити Дозволу (ліцензії) на проведення робіт',
          type: 'text',
          fullWidth: true,
          placeholder:
            'Наприклад: Дозвіл на проведення робіт з технічного захисту інформації для власних потреб, від 16.09.2024 № Д-14/123',
        },
      ],
    },
    {
      name: 'protectionMeans',
      title: 'Застосовані засоби технічного захисту інформації',
      icon: '🛡️',
      dateField: 'protectionDate',
      defaultItem: {
        name: '',
        serialNumber: '',
        invertarNumber: '',
        releaseYear: '',
        certificateInfo: '',
      },
      fields: [
        {
          name: 'name',
          label: 'Назва',
          type: 'text',
          placeholder: 'Наприклад: Базальт-5ГЕШ"',
        },
        {
          name: 'serialNumber',
          label: 'Серійний номер засобу',
          type: 'text',
        },
        {
          name: 'invertarNumber',
          label: 'Інвентарний номер засобу',
          type: 'text',
        },
        {
          name: 'releaseYear',
          label: 'Дата виготовлення засобу (DD.MM.YYYY)',
          type: 'date',
        },
        {
          name: 'certificateInfo',
          label: 'Інформація про експертний висновок (сертифікат)',
          type: 'text',
          fullWidth: true,
        },
      ],
    },
    {
      name: 'orders',
      title: 'Наказ про введення в експлуатацію та інші розпорядчі документи',
      icon: '📑',
      defaultItem: { orderType: '', number: '', date: '', publisher: '' },
      fields: [
        {
          name: 'orderType',
          label: 'Короткий зміст наказу',
          type: 'text',
          placeholder:
            'Наприклад: Про введення в експлуатацію копіювально-розмножувальної апаратури',
        },
        {
          name: 'number',
          label: 'Номер',
          type: 'text',
        },
        {
          name: 'date',
          label: 'Дата',
          type: 'date',
        },
        {
          name: 'publisher',
          label: 'Видавець',
          type: 'text',
        },
      ],
    },
  ],
  submitLabel: 'Зберегти внесену інформацію',
};

// ===== CARD CONFIG =====
const krtCardConfig: CardConfig = {
  title: 'systemName',
  subtitle: 'subdivisionName',
  sections: [
    {
      title: '🏢 Основна інформація',
      fields: [
        { label: 'Адреса', value: 'address' },
        { label: 'Номер приміщення', value: 'premisesNumber' },
        {
          label: 'Назва підрозділу',
          value: 'subdivisionName',
          format: 'badge',
        },
        { label: 'Тип підрозділу', value: 'subdivisionType' },
        { label: 'Назва служби', value: 'serviceName' },
        { label: 'Назва КРА', value: 'systemName' },
      ],
    },
    {
      title: '📋 Документація',
      fields: [
        { label: 'Номер паспорту', value: 'passportNumber' },
        {
          label: 'Дата реєстрації паспорту',
          value: 'passportDate',
          format: 'date',
        },
      ],
    },
  ],
  nestedSections: [
    {
      name: 'categorization',
      title: 'Категоріювання ОІД',
      icon: '📋',
      itemTitle: 'categorizationRank',
      dateField: 'categorizationActDate',
      showPreviousVersions: true,
      fields: [
        {
          label: 'Дата реєстрації акта',
          value: 'categorizationActDate',
          format: 'date',
        },
        { label: 'Номер акта', value: 'categorizationActNumber' },
        { label: 'Категорія', value: 'categorizationRank', format: 'badge' },
        {
          label: 'Термін дії акта',
          value: 'categorizationValidUntil',
          format: 'date',
        },
        {
          label: 'Іноземні організації в критичній зоні',
          value: 'foreignCriticalArea',
        },
        {
          label: 'Вищий ступінь обмеження доступу до інформації',
          value: 'hightInformationRank',
        },
      ],
    },
    {
      name: 'technicalTask',
      title: 'Технічне завдання на створення комплексу ТЗІ',
      icon: '🛠️',
      itemTitle: 'taskNumber',
      dateField: 'taskDate',
      showPreviousVersions: true,
      fields: [
        { label: 'Дата реєстрації', value: 'taskDate', format: 'date' },
        { label: 'Реєстраційний номер', value: 'taskNumber' },
        { label: 'Дата погодження', value: 'taskClearance', format: 'date' },
      ],
    },
    {
      name: 'instrumentalControl',
      title: 'Протокол інструментального контролю',
      icon: '🔍',
      itemTitle: 'controlNumber',
      dateField: 'controlDate',
      showPreviousVersions: true,
      fields: [
        { label: 'Реєстраційний номер', value: 'controlNumber' },
        { label: 'Дата реєстрації', value: 'controlDate', format: 'date' },
        { label: 'Термін дії', value: 'controlTermin', format: 'date' },
        { label: 'Виконавець', value: 'controlPerformer' },
        {
          label: 'Реквізити Дозволу (ліцензії)',
          value: 'permissionPerformer',
          fullWidth: true,
        },
      ],
    },
    {
      name: 'specialCheck',
      title: 'Акт комплексної спеціальної перевірки',
      icon: '🔍',
      itemTitle: 'checkNumber',
      dateField: 'checkDate',
      showPreviousVersions: true,
      fields: [
        { label: 'Реєстраційний номер', value: 'checkNumber' },
        { label: 'Дата реєстрації', value: 'checkDate', format: 'date' },
        { label: 'Виконавець', value: 'checkPerformer' },
        {
          label: 'Реквізити Дозволу (ліцензії)',
          value: 'checkPermissionPerformer',
          fullWidth: true,
        },
      ],
    },
    {
      name: 'atestation',
      title: 'Атестація комплексу технічного захисту інформації',
      icon: '✅',
      itemTitle: 'attestationRegNumber',
      dateField: 'attestationRegDate',
      showPreviousVersions: true,
      fields: [
        { label: 'Реєстраційний номер', value: 'attestationRegNumber' },
        {
          label: 'Дата реєстрації',
          value: 'attestationRegDate',
          format: 'date',
        },
        {
          label: 'Дата ДССЗЗІ',
          value: 'attestationDsszziDate',
          format: 'date',
        },
        { label: 'Номер ДССЗЗІ', value: 'attestationDsszziNumber' },
        { label: 'Дійсний до', value: 'attestationValidUntil', format: 'date' },
        { label: 'Виконавець робіт', value: 'atestationPerformer' },
        {
          label: 'Реквізити Дозволу (ліцензії)',
          value: 'atestationPermissionPerformer',
          fullWidth: true,
        },
      ],
    },
    {
      name: 'protectionMeans',
      title: 'Застосовані засоби технічного захисту інформації',
      icon: '🛡️',
      itemTitle: 'name',
      dateField: 'meanDate',
      fields: [
        { label: 'Назва', value: 'name' },
        { label: 'Серійний номер', value: 'serialNumber' },
        { label: 'Інвентарний номер', value: 'invertarNumber' },
        { label: 'Дата виготовлення', value: 'releaseYear', format: 'date' },
        { label: 'Дані експертного висновку', value: 'certificateInfo' },
      ],
    },
    {
      name: 'orders',
      title: 'Накази',
      icon: '📑',
      itemTitle: 'orderType',
      fields: [
        { label: 'Тип наказу', value: 'orderType' },
        { label: 'Номер', value: 'number' },
        { label: 'Дата', value: 'date', format: 'date' },
        { label: 'Видавець', value: 'publisher' },
      ],
    },
  ],
  deleteLabel: 'Видалити запис про копіювально-розмножувальну техніку',
  deleteConfirmName: (data) => `${data.systemName}`,
};

// ===== LIST CONFIG =====
const krtListConfig: ListConfig = {
  searchFields: ['subdivisionName', 'premisesNumber', 'systemName', 'address'],
  compactThreshold: 2,
  CardComponent: (props) => (
    <GenericCard config={krtCardConfig} data={props} {...props} />
  ),
  CompactCardComponent: KRTCardCompact,
  emptyMessage:
    'Немає записів про копіювально-розмножувальну техніку. Додайте перший запис.',
  noResultsMessage: 'За заданими критеріями пошуку результатів не знайдено',
};

// ===== TAB CONFIG =====
const krtTabConfig: TabConfig = {
  apiEndpoint: '/api/objects/krt',
  displayName: 'КРТ',
  searchPlaceholder: 'Пошук по назві підрозділу, номеру приміщення, адресі...',
  addButtonLabel: '+ Додати запис про КРТ',
  FormComponent: (props) => <GenericForm config={krtFormConfig} {...props} />,
  ListComponent: (props) => <GenericList config={krtListConfig} {...props} />,
};

export default function KRTTab() {
  return <GenericTab config={krtTabConfig} />;
}
