import GenericTab, { TabConfig } from '../common/GenericTab';
import GenericForm, { FormConfig } from '../common/GenericForm';
import GenericList, { ListConfig } from '../common/GenericList';
import GenericCard, { CardConfig } from '../common/GenericCard';
import ClassASCardCompact from '../class-as/ClassASCardCompact';

// ===== FORM CONFIG =====
const classASFormConfig: FormConfig = {
  title: 'АС класу 1, 2, 3',
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
          label: 'Номер приміщення, в якому розміщується АС',
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
        {
          name: 'systemClass',
          label: 'Клас системи',
          type: 'select',
          required: true,
          options: [
            { value: 'АС класу 1', label: 'АС класу 1' },
            { value: 'АС класу 2', label: 'АС класу 2' },
            { value: 'АС класу 3', label: 'АС класу 3' },
          ],
        },
        {
          name: 'systemName',
          label: 'Назва системи',
          type: 'text',
          placeholder: 'Назва АС',
          required: true,
        },
        {
          name: 'objectType',
          label: "Тип об'єкта інформаційної діяльності",
          type: 'select',
          required: true,
          options: [
            { value: "об'єкт ЕОТ", label: "об'єкт ЕОТ" },
            { value: 'комбінований ОІД', label: 'комбінований ОІД' },
          ],
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
    {
      title: 'Формуляр на автоматизовану систему',
      icon: '📋',
      fields: [
        {
          name: 'formulaNumber',
          label: 'Реєстраційний номер',
          type: 'text',
          placeholder: 'Наприклад: 16/2-71дск',
        },
        {
          name: 'formulaDate',
          label: 'Дата реєстрації',
          type: 'date',
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
      title: 'Акт категоріювання ОІД (ОЕОТ)',
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
      title: 'Протокол інструментального контролю',
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
      dateField: 'dsszzіDate',
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
          placeholder: 'Наприклад: Базальт-5ГЕШ',
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
      name: 'software',
      title: 'Програмне забезпечення',
      icon: '💾',
      hideAllByDefault: true,
      defaultItem: { name: '', version: '', manufacturer: '' },
      fields: [
        {
          name: 'name',
          label: 'Найменування програмного забезпечення',
          type: 'text',
          required: true,
          fullWidth: true,
          placeholder: 'Наприклад: Libra Office',
        },
        {
          name: 'version',
          label: 'Версія',
          type: 'text',
          placeholder: 'Наприклад: 1.0.0',
        },
        {
          name: 'manufacturer',
          label: 'Найменування виробника та його національна приналежність',
          type: 'text',
          placeholder: 'Наприклад: ABC Corp, США',
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
            'Наприклад: Про введення в експлуатацію автоматизованиої системи класу 1 в РСС АБВГД ГУНП',
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
const classASCardConfig: CardConfig = {
  title: 'systemName',
  subtitle: 'systemClass',
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
        { label: 'Клас системи', value: 'systemClass', format: 'badge' },
        { label: 'Назва системи', value: 'systemName' },
        {
          label: "Тип об'єкта інформаційної діяльності",
          value: 'objectType',
          format: 'badge',
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
    {
      title: '📋 Документація',
      fields: [
        { label: 'Номер формуляру', value: 'formulaNumber' },
        {
          label: 'Дата реєстрації формуляру',
          value: 'formulaDate',
          format: 'date',
        },
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
      title: 'Акт категоріювання ОІД (ОЕОТ)',
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
          label: 'Дата проведення заходу',
          value: 'controlEventDate',
          format: 'date',
        },
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
          label: 'Дата проведення заходу',
          value: 'checkEventDate',
          format: 'date',
        },
        {
          label: 'Реквізити Дозволу (ліцензії)',
          value: 'checkPermissionPerformer',
          fullWidth: true,
        },
      ],
    },
    {
      name: 'atestation',
      title: 'Акт атестації комплексу ТЗІ',
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
        { label: 'Номер експертного висновку', value: 'expertOpinionNumber' },
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
      name: 'software',
      title: 'Програмне забезпечення',
      icon: '💾',
      itemTitle: 'name',
      hideAllByDefault: true,
      fields: [
        { label: 'Найменування', value: 'name' },
        { label: 'Версія', value: 'version' },
        { label: 'Виробник', value: 'manufacturer' },
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
  deleteLabel: 'Видалити запис про автоматизовану систему',
  deleteConfirmName: (data) => `${data.systemName} (${data.systemClass})`,
};

// ===== LIST CONFIG =====
const classASListConfig: ListConfig = {
  searchFields: [
    'systemName',
    'subdivisionName',
    'systemClass',
    'serviceName',
    'address',
    'premisesNumber',
  ],
  compactThreshold: 2,
  CardComponent: (props) => (
    <GenericCard config={classASCardConfig} data={props} {...props} />
  ),
  CompactCardComponent: ClassASCardCompact,
  emptyMessage:
    'Немає записів про автоматизовані системи. Додайте першу систему.',
  noResultsMessage: 'Результатів не знайдено за заданими критеріями пошуку',
};

// ===== TAB CONFIG =====
const classASTabConfig: TabConfig = {
  apiEndpoint: '/api/objects/class_a_systems',
  displayName: 'АС класу 1, 2, 3',
  searchPlaceholder: 'Пошук по назві системи, підрозділу, класу...',
  addButtonLabel: '+ Додати автоматизовану систему',
  FormComponent: (props) => (
    <GenericForm config={classASFormConfig} {...props} />
  ),
  ListComponent: (props) => (
    <GenericList config={classASListConfig} {...props} />
  ),
};

// ===== COMPONENT =====
export default function ClassASTab({
  expandedItemId,
}: {
  expandedItemId?: number | null;
}) {
  return (
    <GenericTab config={classASTabConfig} expandedItemId={expandedItemId} />
  );
}
