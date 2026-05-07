export const objectTypes = {
  personnel: {
    table: 'personnel',
    foreignKeyName: 'personnelId',
    label: 'Особовий склад',
    icon: '👥',
    fields: [
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
        name: 'dateOfOvs',
        label: 'З якого часу в ОВС',
        type: 'date',
        required: false,
      },
      {
        name: 'dateOfNpu',
        label: 'З якого часу в НПУ',
        type: 'date',
        required: false,
      },

      {
        name: 'position',
        label: 'Посада',
        type: 'text',
        required: true,
      },
      {
        name: 'dateOfPosition',
        label: 'З якого часу на посаді',
        type: 'date',
        required: false,
      },
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
        name: 'department',
        label: 'Підрозділ',
        type: 'text',
        required: false,
      },
      {
        name: 'dateOfDepartment',
        label: 'З якого часу в підрозділі',
        type: 'date',
        required: false,
      },

      {
        name: 'email',
        label: 'Службовий EMAIL',
        type: 'email',
        required: false,
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
            name: 'specialties',
            label: 'Спеціальність',
            type: 'text',
            required: false,
          },
          {
            name: 'educationRank',
            label: 'Здобутий рівень освіти',
            type: 'text',
            required: false,
          },
          {
            name: 'yearCompleted',
            label: 'Рік закінчення',
            type: 'number',
            required: true,
          },
        ],
      },
      certificates: {
        table: 'personnel_certificates',
        label: 'Свідоцтва про перепідготовку/підвищення',
        fields: [
          {
            name: 'trainingName',
            label: 'Назва курсу/семінару',
            type: 'text',
            required: true,
          },
          {
            name: 'certificateNumber',
            label: 'Номер свідоцтва',
            type: 'text',
            required: false,
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

  // АС класу 1 2 3 / Комбіновані ОІД
  class_a_systems: {
    table: 'class_a_systems',
    displayName: 'АС класу 1, 2, 3 / Комбіновані ОІД',
    icon: '🖥️',
    mainFields: ['subdivisionName', 'systemClass', 'systemName', 'objectType'],
    nestedTables: {
      categorization: {
        table: 'class_a_systems_categorization',
        fields: [
          'categorizationActDate',
          'categorizationActNumber',
          'categorizationRank',
          'categorizationValidUntil',
          'foreignCriticalArea',
          'hightInformationRank',
        ],
      },
      technicalTask: {
        table: 'class_a_systems_technical_task',
        fields: ['taskDate', 'taskNumber', 'taskClearance'],
      },
      instrumentalControl: {
        table: 'class_a_systems_instrumental_control',
        fields: [
          'controlNumber',
          'controlDate',
          'controlTermin',
          'controlPerformer',
          'permissionPerformer',
        ],
      },
      specialCheck: {
        table: 'class_a_systems_special_check',
        fields: [
          'checkNumber',
          'checkDate',
          'checkPerformer',
          'checkPermissionPerformer',
        ],
      },
      atestation: {
        table: 'class_a_systems_atestation',
        fields: [
          'attestationRegNumber',
          'attestationRegDate',
          'attestationDsszziDate',
          'attestationDsszziNumber',
          'attestationValidUntil',
          'atestationPerformer',
          'atestationPermissionPerformer',
        ],
      },
      complianceDocuments: {
        table: 'class_a_systems_compliance_documents',
        fields: [
          'documentType',
          'dsszzіNumber',
          'dsszzіDate',
          'validUntil',
          'expertOpinionNumber',
          'expertOpinionDate',
          'inclusionDate',
          'serialNumberInList',
          'nextAuthorizationDeadline',
        ],
      },
      protectionMeans: {
        table: 'class_a_systems_protection_means',
        fields: [
          'name',
          'serialNumber',
          'invertarNumber',
          'releaseYear',
          'certificateInfo',
        ],
      },
      software: {
        table: 'class_a_systems_software',
        fields: ['name', 'version', 'manufacturer'],
      },
      orders: {
        table: 'class_a_systems_orders',
        fields: ['orderType', 'number', 'date', 'publisher'],
      },
    },
    foreignKeyName: 'systemId',
    fields: [
      'address',
      'premisesNumber',
      'subdivisionName',
      'subdivisionType',
      'serviceName',
      'systemClass',
      'systemName',
      'objectType',
      'categorizationActDate',
      'categorizationActNumber',
      'kzzName',
      'kzzSerial',
      'antivirus',
      'antivirusOpinionNumber',
      'antivirusOpinionDate',
      'ttCreateDate',
      'ttCreateNumber',
      'formulaDate',
      'formulaNumber',
      'passportDate',
      'passportNumber',
      'protocolDate',
      'protocolNumber',
      'protocolValidUntil',
      'kspActDate',
      'kspActNumber',
      'attestationRegDate',
      'attestationRegNumber',
      'attestationDsszziDate',
      'attestationDsszziNumber',
      'attestationValidUntil',
    ],
  },

  service_premises: {
    table: 'service_premises',
    displayName: 'Службові приміщення',
    icon: '🏠',
    mainFields: ['subdivisionName', 'premisesNumber', 'address'],
    nestedTables: {
      categorization: {
        table: 'service_premises_categorization',
        fields: [
          'categorizationActDate',
          'categorizationActNumber',
          'categorizationRank',
          'categorizationValidUntil',
          'foreignCriticalArea',
          'hightInformationRank',
        ],
      },
      technicalTask: {
        table: 'service_premises_technical_task',
        fields: ['taskDate', 'taskNumber', 'taskClearance'],
      },
      instrumentalControl: {
        table: 'service_premises_instrumental_control',
        fields: [
          'controlNumber',
          'controlDate',
          'controlTermin',
          'controlPerformer',
          'permissionPerformer',
        ],
      },
      specialCheck: {
        table: 'service_premises_special_check',
        fields: [
          'checkNumber',
          'checkDate',
          'checkPerformer',
          'checkPermissionPerformer',
        ],
      },
      atestation: {
        table: 'service_premises_atestation',
        fields: [
          'attestationRegNumber',
          'attestationRegDate',
          'attestationDsszziDate',
          'attestationDsszziNumber',
          'attestationValidUntil',
          'atestationPerformer',
          'atestationPermissionPerformer',
        ],
      },
      protectionMeans: {
        table: 'service_premises_protection_means',
        fields: [
          'name',
          'serialNumber',
          'invertarNumber',
          'releaseYear',
          'certificateInfo',
        ],
      },
      governmentalCommunicationMeans: {
        table: 'service_premises_governmental_communication_means',
        fields: ['subscriberDeviceName', 'subscriberDeviceSerialNumber'],
      },
      orders: {
        table: 'service_premises_orders',
        fields: ['orderType', 'number', 'date', 'publisher'],
      },
    },
    foreignKeyName: 'premisesId',
    fields: [
      'address',
      'premisesNumber',
      'subdivisionName',
      'subdivisionType',
      'serviceName',
      'passportNumber',
      'passportDate',
      'categorizationActDate',
      'categorizationActNumber',
    ],
  },
  krt: {
    table: 'krt',
    displayName: 'КРТ (Копіювально-розмножувальна техніка)',
    icon: '🖨️',
    mainFields: ['subdivisionName', 'premisesNumber', 'address'],
    nestedTables: {
      categorization: {
        table: 'krt_categorization',
        fields: [
          'categorizationActDate',
          'categorizationActNumber',
          'categorizationRank',
          'categorizationValidUntil',
          'foreignCriticalArea',
          'hightInformationRank',
        ],
      },
      technicalTask: {
        table: 'krt_technical_task',
        fields: ['taskDate', 'taskNumber', 'taskClearance'],
      },
      instrumentalControl: {
        table: 'krt_instrumental_control',
        fields: [
          'controlNumber',
          'controlDate',
          'controlTermin',
          'controlPerformer',
          'permissionPerformer',
        ],
      },
      specialCheck: {
        table: 'krt_special_check',
        fields: [
          'checkNumber',
          'checkDate',
          'checkPerformer',
          'checkPermissionPerformer',
        ],
      },
      atestation: {
        table: 'krt_atestation',
        fields: [
          'attestationRegNumber',
          'attestationRegDate',
          'attestationDsszziDate',
          'attestationDsszziNumber',
          'attestationValidUntil',
          'atestationPerformer',
          'atestationPermissionPerformer',
        ],
      },
      protectionMeans: {
        table: 'krt_protection_means',
        fields: [
          'name',
          'serialNumber',
          'invertarNumber',
          'releaseYear',
          'certificateInfo',
        ],
      },
      orders: {
        table: 'krt_orders',
        fields: ['orderType', 'number', 'date', 'publisher'],
      },
    },
    foreignKeyName: 'krtId',
    fields: [
      'address',
      'premisesNumber',
      'subdivisionName',
      'subdivisionType',
      'serviceName',
      'systemName',
      'passportNumber',
      'passportDate',
      'categorizationActDate',
      'categorizationActNumber',
    ],
  },
  iks: {
    table: 'iks',
    displayName: 'ІКС (Інформаційно-комунікаційні системи)',
    icon: '🌐',
    mainFields: ['systemName', 'systemClass', 'accessMode'],
    nestedTables: {
      categorization: {
        table: 'iks_categorization',
        fields: [
          'categorizationActDate',
          'categorizationActNumber',
          'categorizationRank',
          'categorizationValidUntil',
          'foreignCriticalArea',
          'hightInformationRank',
        ],
      },
      computerEquipment: {
        table: 'iks_computer_equipment',
        fields: ['serversCount', 'workstationsCount', 'networkEquipmentCount'],
      },
      atestation: {
        table: 'iks_atestation',
        fields: [
          'attestationRegNumber',
          'attestationRegDate',
          'attestationDsszziDate',
          'attestationDsszziNumber',
          'attestationValidUntil',
          'atestationPerformer',
          'atestationPermissionPerformer',
        ],
      },
      complianceDocuments: {
        table: 'iks_compliance_documents',
        fields: [
          'documentType',
          'dsszzіNumber',
          'dsszzіDate',
          'validUntil',
          'expertOpinionNumber',
          'expertOpinionDate',
          'inclusionDate',
          'serialNumberInList',
          'nextAuthorizationDeadline',
        ],
      },
      protectionMeans: {
        table: 'iks_protection_means',
        fields: [
          'name',
          'serialNumber',
          'invertarNumber',
          'releaseYear',
          'certificateInfo',
        ],
      },
      orders: {
        table: 'iks_orders',
        fields: ['orderType', 'number', 'date', 'publisher'],
      },
    },
    foreignKeyName: 'iksId',
    fields: [
      'systemClass',
      'systemName',
      'accessMode',
      'kzzName',
      'kzzSerial',
      'antivirus',
      'antivirusOpinionNumber',
      'antivirusOpinionDate',
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

//////////

export function validateObjectType(req, res, next) {
  const { objectType } = req.params;

  if (!objectTypes[objectType]) {
    return res.status(404).json({
      error: `Unknown object type: ${objectType}`,
    });
  }

  req.objectType = objectType;
  req.config = objectTypes[objectType];
  next();
}

export function validateFields(req, res, next) {
  const { config } = req;

  if (!config || !config.fields) {
    return res.status(500).json({
      error: `Invalid config for object type`,
    });
  }

  const allowedFields = config.fields || [];
  const receivedFields = Object.keys(req.body);

  for (const field of receivedFields) {
    if (
      !allowedFields.includes(field) &&
      !Object.keys(config.nestedTables || {}).includes(field)
    ) {
      console.warn(`⚠️ Unknown field: ${field}`);
    }
  }

  next();
}

export function validateNestedFields(nestedTables) {
  return (req, res, next) => {
    if (!nestedTables) {
      return next();
    }

    for (const [key, config] of Object.entries(nestedTables)) {
      if (Array.isArray(req.body[key])) {
        req.body[key].forEach((item, index) => {
          if (!Array.isArray(config.fields)) {
            return;
          }

          for (const field of Object.keys(item)) {
            if (!config.fields.includes(field)) {
              console.warn(
                `⚠️ Unknown nested field: ${key}[${index}].${field}`,
              );
            }
          }
        });
      }
    }

    next();
  };
}
