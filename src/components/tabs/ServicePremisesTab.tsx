import GenericTab, { TabConfig } from '../common/GenericTab';
import GenericForm, { FormConfig } from '../common/GenericForm';
import GenericList, { ListConfig } from '../common/GenericList';
import GenericCard, { CardConfig } from '../common/GenericCard';
import ServicePremisesCardCompact from '../service-premises/ServicePremisesCardCompact';

// ===== FORM CONFIG =====
const servicePremisesFormConfig: FormConfig = {
  title: 'Службові приміщення',
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
          label: 'Номер приміщення',
          type: 'text',
          placeholder: 'Наприклад: 101',
        },
        {
          name: 'subdivisionName',
          label: 'Назва підрозділу',
          type: 'text',
          required: true,
          placeholder: 'Наприклад: УОТЗ',
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
      title: 'Акт категоріювання ОІД',
      icon: '📋',
      dateField: 'categorizationActDate',
      defaultItem: {
        categorizationType: '',
        categorizationActDate: '',
        categorizationActNumber: '',
        categorizationRank: '',
        categorizationValidUntil: '',
        foreignCriticalArea: '',
        hightInformationRank: '',
      },
      fields: [
        {
          name: 'categorizationType',
          label: 'Вид категоріювання',
          type: 'select',
          options: [
            { value: 'первинне', label: 'первинне' },
            { value: 'чергове', label: 'чергове' },
            { value: 'позачергове', label: 'позачергове' },
          ],
        },
        {
          name: 'categorizationActDate',
          label: 'Дата реєстрації акту категоріювання',
          type: 'date',
        },
        {
          name: 'categorizationActNumber',
          label: 'Номер акту категоріювання',
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
        controlEventDate: '',
        permissionPerformer:
          'Дозвіл на проведення робіт з ТЗІ для власних потреб, від 16.09.2024 № Д-14/123',
      },
      fields: [
        {
          name: 'controlNumber',
          label: 'Реєстраційний номер протоколу',
          type: 'text',
          placeholder: 'Наприклад: 7/1-71т',
        },
        {
          name: 'controlDate',
          label: 'Дата реєстрації протоколу',
          type: 'date',
        },
        {
          name: 'controlTermin',
          label: 'Термін дії протоколу',
          type: 'date',
        },
        {
          name: 'controlPerformer',
          label: 'Виконавець робіт з ТЗІ',
          type: 'text',
          placeholder: 'Наприклад: ДРТЗІ НПУ',
        },
        {
          name: 'controlEventDate',
          label: 'Дата проведення заходу',
          type: 'date',
          required: true,
        },
        {
          name: 'permissionPerformer',
          label: 'Реквізити Дозволу (ліцензії) на проведення робіт',
          type: 'text',
          fullWidth: true,
          placeholder:
            'Наприклад: Дозвіл на проведення робіт з ТЗІ для власних потреб, від 16.09.2024 № Д-14/123',
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
        checkEventDate: '',
        checkPermissionPerformer:
          'Дозвіл на проведення робіт з ТЗІ для власних потреб, від 16.09.2024 № Д-14/123',
      },
      fields: [
        {
          name: 'checkNumber',
          label: 'Реєстраційний номер акту',
          type: 'text',
          placeholder: 'Наприклад: 16/2-71т',
        },
        {
          name: 'checkDate',
          label: 'Дата реєстрації акту',
          type: 'date',
        },
        {
          name: 'checkPerformer',
          label: 'Виконавець робіт з ТЗІ',
          type: 'text',
          placeholder: 'Наприклад: ДРТЗІ НПУ',
        },
        {
          name: 'checkEventDate',
          label: 'Дата проведення заходу',
          type: 'date',
          required: true,
        },
        {
          name: 'checkPermissionPerformer',
          label: 'Реквізити Дозволу (ліцензії) на проведення робіт',
          type: 'text',
          fullWidth: true,
          placeholder:
            'Наприклад: Дозвіл на проведення робіт з ТЗІ для власних потреб, від 16.09.2024 № Д-14/123',
        },
      ],
    },
    {
      name: 'atestation',
      title: 'Акт атестації комплексу ТЗІ',
      icon: '✅',
      dateField: 'attestationRegDate',
      defaultItem: {
        attestationRegNumber: '',
        attestationRegDate: '',
        attestationDsszziDate: '',
        attestationDsszziNumber: '',
        attestationValidUntil: '',
        atestationPerformer: 'УРТЗІ ГУНП',
        attestationWorkStartDate: '',
        attestationWorkEndDate: '',
        atestationPermissionPerformer:
          'Дозвіл на проведення робіт з ТЗІ для власних потреб, від 16.09.2024 № Д-14/123',
      },
      fields: [
        {
          name: 'attestationRegNumber',
          label: 'Реєстраційний номер акту атестації',
          type: 'text',
          placeholder: 'Наприклад: 16/2-71т',
        },
        {
          name: 'attestationRegDate',
          label: 'Дата реєстрації акту атестації',
          type: 'date',
        },
        {
          name: 'attestationDsszziDate',
          label: 'Дата реєстрації акту в ДССЗЗІ',
          type: 'date',
        },
        {
          name: 'attestationDsszziNumber',
          label: 'Реєстраційний номер акту в ДССЗЗІ',
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
          name: 'attestationWorkStartDate',
          label: 'Дата початку проведення робіт',
          type: 'date',
          required: true,
        },
        {
          name: 'attestationWorkEndDate',
          label: 'Дата закінчення робіт',
          type: 'date',
          required: true,
          calculateFrom: { field: 'attestationWorkStartDate', days: 3 },
        },
        {
          name: 'atestationPermissionPerformer',
          label: 'Реквізити Дозволу (ліцензії) на проведення робіт',
          type: 'text',
          fullWidth: true,
          placeholder:
            'Наприклад: Дозвіл на проведення робіт з ТЗІ для власних потреб, від 16.09.2024 № Д-14/123',
        },
      ],
    },
    {
      name: 'protectionMeans',
      title: 'Застосовані засоби технічного захисту інформації',
      icon: '🛡️',
      dateField: 'protectionDate',
      defaultItem: {
        toolType: '',
        name: '',
        serialNumber: '',
        invertarNumber: '',
        releaseYear: '',
        certificateInfo: '',
      },
      fields: [
        {
          name: 'toolType',
          label: 'Вид засобу ТЗІ',
          type: 'select',
          required: true,
          options: [
            {
              value: 'Генератор радіочастотного зашумлення',
              label: 'Генератор радіочастотного зашумлення',
            },
            {
              value: 'Фільтр електроживлення',
              label: 'Фільтр електроживлення',
            },
            {
              value: 'Мережевий трансформатор',
              label: 'Мережевий трансформатор',
            },
            {
              value: 'Генератор акустичного зашумлення',
              label: 'Генератор акустичного зашумлення',
            },
            { value: 'Віброперетворювач', label: 'Віброперетворювач' },
            {
              value: 'Акустичний випромінювач',
              label: 'Акустичний випромінювач',
            },
            { value: 'Виріб типу "SRC-300"', label: 'Виріб типу "SRC-300"' },
            { value: 'Інше', label: 'Інше' },
          ],
        },
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
      name: 'governmentalCommunicationMeans',
      title: "Засоби урядового зв'язку",
      icon: '📡',
      defaultItem: {
        subscriberDeviceName: '',
        subscriberDeviceSerialNumber: '',
      },
      fields: [
        {
          name: 'subscriberDeviceName',
          label: 'Назва абонентського пристрою',
          type: 'text',
          placeholder: 'Наприклад: Абонентська станція',
        },
        {
          name: 'subscriberDeviceSerialNumber',
          label: 'Серійний номер абонентського пристрою',
          type: 'text',
          placeholder: 'Наприклад: SN12345678',
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
            'Наприклад: Про введення в експлуатацію приміщення для розміщення комплексу ТЗІ',
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
const servicePremisesCardConfig: CardConfig = {
  title: 'subdivisionName',
  subtitle: 'premisesNumber',
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
      title: 'Акт категоріювання ОІД',
      icon: '📋',
      itemTitle: 'categorizationRank',
      dateField: 'categorizationActDate',
      showPreviousVersions: true,
      fields: [
        { label: 'Вид категоріювання', value: 'categorizationType' },
        {
          label: 'Дата реєстрації акту',
          value: 'categorizationActDate',
          format: 'date',
        },
        { label: 'Номер акту', value: 'categorizationActNumber' },
        { label: 'Категорія', value: 'categorizationRank', format: 'badge' },
        {
          label: 'Термін дії акту',
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
        {
          label: 'Дата реєстрації',
          value: 'taskDate',
          format: 'date',
        },
        { label: 'Номер', value: 'taskNumber' },
        {
          label: 'Дата погодження',
          value: 'taskClearance',
          format: 'date',
        },
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
        {
          label: 'Номер протоколу',
          value: 'controlNumber',
        },
        {
          label: 'Дата',
          value: 'controlDate',
          format: 'date',
        },
        {
          label: 'Термін дії',
          value: 'controlTermin',
          format: 'date',
        },
        {
          label: 'Виконавець',
          value: 'controlPerformer',
        },
        {
          label: 'Дата проведення заходу',
          value: 'controlEventDate',
          format: 'date',
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
        {
          label: 'Номер акту',
          value: 'checkNumber',
        },
        {
          label: 'Дата',
          value: 'checkDate',
          format: 'date',
        },
        {
          label: 'Виконавець',
          value: 'checkPerformer',
        },
        {
          label: 'Дата проведення заходу',
          value: 'checkEventDate',
          format: 'date',
        },
      ],
    },
    {
      name: 'atestation',
      title: 'Акт атестації комплексу ТЗІ',
      dateField: 'attestationRegDate',
      showPreviousVersions: true,
      icon: '✅',
      itemTitle: 'attestationRegNumber',
      fields: [
        {
          label: 'Номер акту',
          value: 'attestationRegNumber',
        },
        {
          label: 'Дата реєстрації',
          value: 'attestationRegDate',
          format: 'date',
        },
        {
          label: 'Номер в ДССЗЗІ',
          value: 'attestationDsszziNumber',
        },
        {
          label: 'Дійсний до',
          value: 'attestationValidUntil',
          format: 'date',
        },
        {
          label: 'Виконавець робіт',
          value: 'atestationPerformer',
        },
        {
          label: 'Дата початку робіт',
          value: 'attestationWorkStartDate',
          format: 'date',
        },
        {
          label: 'Дата закінчення робіт',
          value: 'attestationWorkEndDate',
          format: 'date',
        },
      ],
    },
    {
      name: 'protectionMeans',
      title: 'Засоби ТЗІ',
      icon: '🛡️',
      itemTitle: 'name',
      showAllByDefault: true,
      fields: [
        { label: 'Вид засобу ТЗІ', value: 'toolType' },
        { label: 'Назва', value: 'name' },
        { label: 'Серійний номер', value: 'serialNumber' },
        { label: 'Інвентарний номер', value: 'invertarNumber' },
        { label: 'Дата виготовлення', value: 'releaseYear', format: 'date' },
        { label: 'Дані експертного висновку', value: 'certificateInfo' },
      ],
    },
    {
      name: 'governmentalCommunicationMeans',
      title: "Засоби урядового зв'язку",
      icon: '📡',
      itemTitle: 'subscriberDeviceName',
      showAllByDefault: true,
      fields: [
        { label: 'Назва пристрою', value: 'subscriberDeviceName' },
        { label: 'Серійний номер', value: 'subscriberDeviceSerialNumber' },
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
  deleteLabel: 'Видалити запис про службове приміщення',
  deleteConfirmName: (data) =>
    `${data.subdivisionName} (${data.premisesNumber})`,
};

// ===== LIST CONFIG =====
const servicePremisesListConfig: ListConfig = {
  searchFields: ['subdivisionName', 'premisesNumber', 'serviceName', 'address'],
  compactThreshold: 2,
  CardComponent: (props) => (
    <GenericCard config={servicePremisesCardConfig} data={props} {...props} />
  ),
  CompactCardComponent: ServicePremisesCardCompact,
  emptyMessage: 'Немає записів про службові приміщення. Додайте перший запис.',
  noResultsMessage: 'Результатів не знайдено за заданими критеріями пошуку',
};

// ===== TAB CONFIG =====
const servicePremisesTabConfig: TabConfig = {
  apiEndpoint: '/api/objects/service_premises',
  displayName: 'Службові приміщення',
  searchPlaceholder: 'Пошук по назві підрозділу, номеру приміщення, адресі...',
  addButtonLabel: '+ Додати службове приміщення',
  FormComponent: (props) => (
    <GenericForm config={servicePremisesFormConfig} {...props} />
  ),
  ListComponent: (props) => (
    <GenericList config={servicePremisesListConfig} {...props} />
  ),
};

export default function ServicePremisesTab({
  expandedItemId,
}: {
  expandedItemId?: number | null;
}) {
  return (
    <GenericTab
      config={servicePremisesTabConfig}
      expandedItemId={expandedItemId}
    />
  );
}
