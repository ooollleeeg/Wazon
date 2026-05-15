import GenericTab, { TabConfig } from '../common/GenericTab';
import GenericForm, { FormConfig } from '../common/GenericForm';
import GenericList, { ListConfig } from '../common/GenericList';
import GenericCard, { CardConfig } from '../common/GenericCard';
import IKSCardCompact from '../iks/IKSCardCompact';

// ===== FORM CONFIG =====
const iksFormConfig: FormConfig = {
  title: 'Інформаційно-комунікаційні системи (ІКС)',
  sections: [
    {
      title: '🏢 Основна інформація',
      fields: [
        {
          name: 'systemClass',
          label: 'Клас системи',
          type: 'select',
          required: true,
          options: [
            { value: 'ІКС класу 1', label: 'ІКС класу 1' },
            { value: 'ІКС класу 2', label: 'ІКС класу 2' },
            { value: 'ІКС класу 3', label: 'ІКС класу 3' },
          ],
        },
        {
          name: 'systemName',
          label: 'Повна назва системи',
          type: 'text',
          placeholder: 'Повна назва ІКС',
          required: true,
          fullWidth: true,
        },
        {
          name: 'accessMode',
          label:
            'Режим доступу до державних електронних інформаційних ресурсів',
          type: 'select',
          required: true,
          fullWidth: true,
          options: [
            { value: 'відкрита інформація', label: 'відкрита інформація' },
            {
              value: 'інформація з обмеженим доступом',
              label: 'інформація з обмеженим доступом',
            },
            { value: 'таємна інформація', label: 'таємна інформація' },
            {
              value: 'цілком таємна інформація',
              label: 'цілком таємна інформація',
            },
          ],
        },
        {
          name: 'serversCount',
          label: 'Кількість серверів',
          type: 'number',
          placeholder: 'Наприклад: 5',
        },
        {
          name: 'workstationsCount',
          label: 'Кількість автоматизованих робочих місць',
          type: 'number',
          placeholder: 'Наприклад: 25',
        },
        {
          name: 'networkEquipmentCount',
          label: 'Кількість одиниць мережевого обладнання',
          type: 'number',
          placeholder: 'Наприклад: 10',
        },
      ],
    },

    {
      title: 'Комплекс засобів захисту від несанкціонованого доступу',
      fields: [
        {
          name: 'kzzName',
          label: 'Назва КЗЗ',
          type: 'text',
          placeholder: 'Наприклад: Гриф версії 5',
        },
        {
          name: 'kzzSerial',
          label: 'Серійний номер КЗЗ',
          type: 'text',
          placeholder: 'Наприклад: 001',
        },
        {
          name: 'kzzExpertOpinionNumber',
          label: 'Номер експертного висновку',
          type: 'text',
          placeholder: 'Наприклад: 12345',
        },
        {
          name: 'kzzExpertOpinionDate',
          label: 'Дата видачі експертного висновку',
          type: 'date',
        },
        {
          name: 'kzzManufacturerExploitationTerm',
          label: 'Встановлений виробником термін експлуатації',
          type: 'date',
        },
      ],
    },
    {
      title: 'Антивірусне програмне забезпечення',
      fields: [
        {
          name: 'antivirus',
          label: 'Назва антивірусного ПЗ',
          type: 'text',
          placeholder: 'Наприклад: Zillya Antivirus для бізнесу',
        },
        {
          name: 'antivirusOpinionNumber',
          label: 'Номер експертного висновку',
          type: 'text',
          placeholder: 'Наприклад: 12345',
        },
        {
          name: 'antivirusOpinionDate',
          label: 'Дата видачі експертного висновку',
          type: 'date',
        },
      ],
    },
  ],
  nestedFields: [
    {
      name: 'categorization',
      title: 'Акт категоріювання',
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
      name: 'atestation',
      title: 'Акт атестації комплекса ТЗІ',
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
          'Дозвіл на проведення робіт з ТЗІ для власних потреб, від 16.09.2024 № Д-14/123',
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
          label: 'Виконавець робіт з атестації комплекса ТЗІ',
          type: 'text',
          placeholder: 'Наприклад: ДРТЗІ НПУ',
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
      name: 'complianceDocuments',
      title: 'Документи про відповідність та сертифікацію',
      icon: '📜',
      defaultItem: {
        documentType: '',
        dsszzіNumber: '',
        dsszzіDate: '',
        validUntil: '',
        expertOpinionNumber: '',
        expertOpinionDate: '',
        inclusionDate: '',
        serialNumberInList: '',
        nextAuthorizationDeadline: '',
      },
      fields: [
        {
          name: 'documentType',
          label: 'Тип документа',
          type: 'select',
          required: true,
          options: [
            {
              value: 'Атестат відповідності',
              label: 'Атестат відповідності',
            },
            {
              value:
                'Декларація про відповідність вимогам нормативних документів',
              label:
                'Декларація про відповідність вимогам нормативних документів',
            },
            {
              value: 'Акт завершення робіт',
              label: 'Акт завершення робіт',
            },
            {
              value:
                'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
              label:
                'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
            },
          ],
        },
        {
          name: 'dsszzіNumber',
          label: 'Зареєстровано в ДССЗЗІ за номером',
          type: 'text',
          visibleWhen: {
            field: 'documentType',
            values: [
              'Атестат відповідності',
              'Декларація про відповідність вимогам нормативних документів',
              'Акт завершення робіт',
              'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
            ],
          },
        },
        {
          name: 'dsszzіDate',
          label: 'Дата реєстрації в ДССЗЗІ',
          type: 'date',
          visibleWhen: {
            field: 'documentType',
            values: [
              'Атестат відповідності',
              'Декларація про відповідність вимогам нормативних документів',
              'Акт завершення робіт',
              'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
            ],
          },
        },
        {
          name: 'validUntil',
          label: 'Дійсний до',
          type: 'date',
          visibleWhen: {
            field: 'documentType',
            values: [
              'Атестат відповідності',
              'Декларація про відповідність вимогам нормативних документів',
              'Акт завершення робіт',
            ],
          },
        },
        {
          name: 'expertOpinionNumber',
          label: 'Реєстраційний номер Експертного висновку',
          type: 'text',
          visibleWhen: {
            field: 'documentType',
            values: ['Атестат відповідності'],
          },
        },
        {
          name: 'expertOpinionDate',
          label: 'Дата реєстрації Експертного висновку',
          type: 'date',
          visibleWhen: {
            field: 'documentType',
            values: ['Атестат відповідності'],
          },
        },
        {
          name: 'inclusionDate',
          label: 'Дата включення до переліку',
          type: 'date',
          visibleWhen: {
            field: 'documentType',
            values: [
              'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
            ],
          },
        },
        {
          name: 'serialNumberInList',
          label: 'Порядковий номер у переліку',
          type: 'text',
          visibleWhen: {
            field: 'documentType',
            values: [
              'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
            ],
          },
        },
        {
          name: 'nextAuthorizationDeadline',
          label:
            'Кінцевий строк проведення планової авторизації системи з безпеки',
          type: 'date',
          visibleWhen: {
            field: 'documentType',
            values: [
              'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
            ],
          },
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
            'Наприклад: Про введення в експлуатацію інформаційно-комунікаційної системи',
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
const iksCardConfig: CardConfig = {
  title: 'systemName',
  subtitle: 'systemClass',
  sections: [
    {
      title: '🏢 Основна інформація',
      fields: [
        { label: 'Клас системи', value: 'systemClass', format: 'badge' },
        { label: 'Повна назва системи', value: 'systemName' },
        {
          label: 'Режим доступу до ДЕІР',
          value: 'accessMode',
          format: 'badge',
        },
        { label: 'Кількість серверів', value: 'serversCount' },
        { label: 'Кількість робочих місць', value: 'workstationsCount' },
        {
          label: 'Кількість мережевого обладнання',
          value: 'networkEquipmentCount',
        },
      ],
    },
    {
      title: 'Комплекс засобів захисту від несанкціонованого доступу',
      fields: [
        { label: 'Назва КЗЗ', value: 'kzzName' },
        { label: 'Серійний номер КЗЗ', value: 'kzzSerial' },
        {
          label: 'Номер експертного висновку',
          value: 'kzzExpertOpinionNumber',
        },
        {
          label: 'Дата видачі висновку',
          value: 'kzzExpertOpinionDate',
          format: 'date',
        },
        {
          label: 'Термін експлуатації',
          value: 'kzzManufacturerExploitationTerm',
          format: 'date',
        },
      ],
    },
    {
      title: 'Антивірусне програмне забезпечення',
      fields: [
        { label: 'Назва АВ ПЗ', value: 'antivirus' },
        {
          label: 'Номер експертного висновку',
          value: 'antivirusOpinionNumber',
        },
        {
          label: 'Дата видачі висновку',
          value: 'antivirusOpinionDate',
          format: 'date',
        },
      ],
    },
  ],
  nestedSections: [
    {
      name: 'categorization',
      title: 'Акт категоріювання',
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
      name: 'atestation',
      title: 'Акт атестації комплекса ТЗІ',
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
      ],
    },
    {
      name: 'complianceDocuments',
      title: 'Документи про відповідність та сертифікацію',
      icon: '📜',
      itemTitle: 'documentType',
      dateField: 'dsszzіDate',
      showPreviousVersions: true,
      fields: [
        { label: 'Тип документа', value: 'documentType', format: 'badge' },
        { label: 'Номер ДССЗЗІ', value: 'dsszzіNumber' },
        { label: 'Дата ДССЗЗІ', value: 'dsszzіDate', format: 'date' },
        { label: 'Дійсний до', value: 'validUntil', format: 'date' },
      ],
    },
    {
      name: 'protectionMeans',
      title: 'Застосовані засоби технічного захисту інформації',
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
  deleteLabel: 'Видалити запис про ІКС',
  deleteConfirmName: (data) => `${data.systemName} (${data.systemClass})`,
};

// ===== LIST CONFIG =====
const iksListConfig: ListConfig = {
  searchFields: ['systemName', 'systemClass', 'accessMode'],
  compactThreshold: 2,
  CardComponent: (props) => (
    <GenericCard config={iksCardConfig} data={props} {...props} />
  ),
  CompactCardComponent: IKSCardCompact,
  emptyMessage:
    'Немає записів про інформаційно-комунікаційні системи. Додайте першу систему.',
  noResultsMessage: 'Результатів не знайдено за заданими критеріями пошуку',
};

// ===== TAB CONFIG =====
const iksTabConfig: TabConfig = {
  apiEndpoint: '/api/objects/iks',
  displayName: 'ІКС',
  searchPlaceholder: 'Пошук по назві системи, класу, режиму доступу...',
  addButtonLabel: '+ Додати ІКС',
  FormComponent: (props) => <GenericForm config={iksFormConfig} {...props} />,
  ListComponent: (props) => <GenericList config={iksListConfig} {...props} />,
};

// ===== COMPONENT =====
export default function IKSTab({
  expandedItemId,
}: {
  expandedItemId?: number | null;
}) {
  return <GenericTab config={iksTabConfig} expandedItemId={expandedItemId} />;
}
