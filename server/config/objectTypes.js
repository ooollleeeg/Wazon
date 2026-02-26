export const objectTypes = {
  personnel: {
    table: 'personnel',
    foreignKeyName: 'personnelId',
    label: 'Особовий склад',
    icon: '👥',
    fields: [
      { name: 'position', label: 'Посада', type: 'text', required: true },
      {
        name: 'officialRank',
        label: 'Спец. звання за посадою',
        type: 'text',
        required: false,
      },
      {
        name: 'actualRank',
        label: 'Спец. звання фактичне',
        type: 'text',
        required: false,
      },
      {
        name: 'fullName',
        label: "Прізвище, ім'я, по-батькові",
        type: 'text',
        required: true,
      },
      {
        name: 'dateOfBirth',
        label: 'Дата народження',
        type: 'date',
        required: true,
      },
      {
        name: 'email',
        label: 'Службовий EMAIL',
        type: 'email',
        required: true,
      },
      {
        name: 'phone',
        label: 'Номер службового телефону',
        type: 'tel',
        required: false,
      },
      {
        name: 'mobilePhone',
        label: 'Номер мобільного телефону',
        type: 'tel',
        required: false,
      },
    ],
    nestedTables: {
      education: {
        table: 'personnel_education',
        label: 'ОСВІТА',
        fields: [
          {
            name: 'institution',
            label: 'Навчальний заклад',
            type: 'text',
            required: true,
          },
          {
            name: 'yearCompleted',
            label: 'Рік закінчення',
            type: 'number',
            required: true,
          },
          {
            name: 'specialties',
            label: 'Спеціальності',
            type: 'json',
            required: false,
          },
        ],
      },
      certificates: {
        table: 'personnel_certificates',
        label: 'Свідоцтва про перепідготовку/підвищення',
        fields: [
          {
            name: 'certificateNumber',
            label: 'Номер свідоцтва',
            type: 'text',
            required: false,
          },
          {
            name: 'trainingName',
            label: 'Назва курсу/семінару',
            type: 'text',
            required: true,
          },
          {
            name: 'location',
            label: 'Місце проведення',
            type: 'text',
            required: false,
          },
          {
            name: 'year',
            label: 'Рік проведення',
            type: 'number',
            required: true,
          },
        ],
      },
    },
  },

  'service-premises': {
    table: 'service_premises',
    label: 'Службові приміщення',
    icon: '🏠',
    fields: [
      { name: 'name', label: 'Назва', type: 'text', required: true },
      { name: 'address', label: 'Адреса', type: 'text', required: true },
      { name: 'area', label: 'Площа (м²)', type: 'number', required: false },
      { name: 'notes', label: 'Примітки', type: 'textarea', required: false },
    ],
  },
  krt: {
    table: 'krt',
    label: 'КРТ',
    icon: '📞',
    fields: [
      { name: 'name', label: 'Назва', type: 'text', required: true },
      { name: 'model', label: 'Модель', type: 'text', required: true },
      {
        name: 'serialNumber',
        label: 'Серійний номер',
        type: 'text',
        required: false,
      },
      { name: 'notes', label: 'Примітки', type: 'textarea', required: false },
    ],
  },
  'search-control-equipment': {
    table: 'search_control_equipment',
    label: 'Пошукова техніка',
    icon: '🔍',
    fields: [
      { name: 'name', label: 'Назва', type: 'text', required: true },
      { name: 'type', label: 'Тип', type: 'text', required: true },
      {
        name: 'location',
        label: 'Місцезнаходження',
        type: 'text',
        required: false,
      },
      {
        name: 'calibrationDate',
        label: 'Дата калібрування',
        type: 'date',
        required: false,
      },
      { name: 'notes', label: 'Примітки', type: 'textarea', required: false },
    ],
  },
  'tzi-check': {
    table: 'tzi_check',
    label: 'Перевірки ТЗІ',
    icon: '✓',
    fields: [
      { name: 'name', label: 'Назва', type: 'text', required: true },
      { name: 'date', label: 'Дата', type: 'date', required: true },
      {
        name: 'status',
        label: 'Статус',
        type: 'select',
        options: ['активна', 'завершена', 'скасована'],
        required: true,
      },
      { name: 'result', label: 'Результат', type: 'textarea', required: false },
      { name: 'notes', label: 'Примітки', type: 'textarea', required: false },
    ],
  },
  'gunp-research': {
    table: 'gunp_research',
    label: 'Дослідження ГУНП',
    icon: '🔬',
    fields: [
      { name: 'name', label: 'Назва', type: 'text', required: true },
      { name: 'date', label: 'Дата', type: 'date', required: true },
      {
        name: 'status',
        label: 'Статус',
        type: 'select',
        options: ['активна', 'завершена', 'скасована'],
        required: true,
      },
      {
        name: 'findings',
        label: 'Висновки',
        type: 'textarea',
        required: false,
      },
      { name: 'notes', label: 'Примітки', type: 'textarea', required: false },
    ],
  },
  documents: {
    table: 'documents',
    label: 'Документи',
    icon: '📄',
    fields: [
      { name: 'name', label: 'Назва', type: 'text', required: true },
      { name: 'type', label: 'Тип', type: 'text', required: true },
      { name: 'number', label: 'Номер', type: 'text', required: false },
      { name: 'date', label: 'Дата видачі', type: 'date', required: false },
      {
        name: 'expirationDate',
        label: 'Дата закінчення',
        type: 'date',
        required: false,
      },
      {
        name: 'status',
        label: 'Статус',
        type: 'select',
        options: ['активна', 'закінчена', 'скасована'],
        required: true,
      },
      { name: 'notes', label: 'Примітки', type: 'textarea', required: false },
    ],
  },
};

export const getObjectType = (type) => objectTypes[type];
export const isValidObjectType = (type) => type in objectTypes;
