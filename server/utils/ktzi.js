import { db } from '../database.js';

const KTZI_TABLES = new Set(['class_a_systems', 'krt', 'service_premises']);

const normalizePart = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('uk-UA');

export const isKtziTable = (table) => KTZI_TABLES.has(table);

export const buildKtziKey = ({ address, premisesNumber, subdivisionName }) =>
  [address, premisesNumber, subdivisionName].map(normalizePart).join('|');

const getKtziData = (data) => ({
  address: data.address || '',
  premisesNumber: data.premisesNumber || '',
  subdivisionName: data.subdivisionName || '',
  subdivisionType: data.subdivisionType || '',
  serviceName: data.serviceName || '',
});

const run = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.run(query, params, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });

const get = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) reject(error);
      else resolve(row || null);
    });
  });

const all = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });

export const ensureKtzi = async (data) => {
  const ktziData = getKtziData(data);
  const ktziKey = buildKtziKey(ktziData);

  if (!ktziKey.replace(/\|/g, '')) {
    throw new Error('Для визначення КТЗІ потрібні адреса, номер приміщення або підрозділ');
  }

  const existing = await get('SELECT * FROM ktzi WHERE ktziKey = ?', [ktziKey]);
  if (existing) return existing;

  const result = await run(
    `INSERT INTO ktzi
      (ktziKey, address, premisesNumber, subdivisionName, subdivisionType, serviceName)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      ktziKey,
      ktziData.address,
      ktziData.premisesNumber,
      ktziData.subdivisionName,
      ktziData.subdivisionType,
      ktziData.serviceName,
    ],
  );

  return get('SELECT * FROM ktzi WHERE id = ?', [result.id]);
};

export const attachObjectToKtzi = async (table, data) => {
  if (!isKtziTable(table)) return data;
  if (String(data.informationCategory || '').trim() === 'IV') {
    return { ...data, ktziId: null };
  }

  if (data.ktziId) {
    const current = await get('SELECT * FROM ktzi WHERE id = ?', [data.ktziId]);
    if (current) return { ...data, ...getKtziData(current), ktziId: current.id };
  }

  const ktzi = await ensureKtzi(data);
  return { ...data, ktziId: ktzi.id };
};

const KTZI_MAIN_FIELDS = [
  'address',
  'premisesNumber',
  'subdivisionName',
  'subdivisionType',
  'serviceName',
];

export const updateKtziMainInfo = async (ktziId, data) => {
  const invalidInput = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
  };
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw invalidInput('Потрібно передати основну інформацію КТЗІ');
  }
  const current = await get('SELECT * FROM ktzi WHERE id = ?', [ktziId]);
  if (!current) throw invalidInput('КТЗІ не знайдено', 404);

  const next = {};
  for (const field of KTZI_MAIN_FIELDS) {
    const value = data[field] === undefined ? current[field] : data[field];
    if (value !== null && typeof value !== 'string') {
      throw invalidInput(`Поле ${field} має бути текстовим`);
    }
    next[field] = (value || '').trim();
  }
  if (!next.subdivisionName) {
    throw invalidInput('Назва підрозділу є обов’язковою');
  }

  const ktziKey = buildKtziKey(next);
  const duplicate = await get(
    'SELECT id FROM ktzi WHERE ktziKey = ? AND id != ?',
    [ktziKey, ktziId],
  );
  if (duplicate) {
    throw invalidInput(
      'КТЗІ з такими адресою, номером приміщення та підрозділом уже існує',
      409,
    );
  }

  await run('BEGIN TRANSACTION');
  try {
    await run(
      `UPDATE ktzi
       SET ktziKey = ?, address = ?, premisesNumber = ?, subdivisionName = ?,
         subdivisionType = ?, serviceName = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        ktziKey,
        next.address,
        next.premisesNumber,
        next.subdivisionName,
        next.subdivisionType,
        next.serviceName,
        ktziId,
      ],
    );
    for (const table of KTZI_TABLES) {
      await run(
        `UPDATE ${table}
         SET address = ?, premisesNumber = ?, subdivisionName = ?,
           subdivisionType = ?, serviceName = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE ktziId = ?`,
        [
          next.address,
          next.premisesNumber,
          next.subdivisionName,
          next.subdivisionType,
          next.serviceName,
          ktziId,
        ],
      );
    }
    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }

  return get('SELECT * FROM ktzi WHERE id = ?', [ktziId]);
};

export const getKtziProtectionMeans = (ktziId) =>
  all(
    `SELECT id, categoryId, toolType, name, serialNumber, invertarNumber,
      releaseYear, manufacturerExploitationTerm, certificateInfo, notes
     FROM protection_means WHERE ktziId = ? ORDER BY toolType, name, id`,
    [ktziId],
  );

export const KTZI_DOCUMENT_FIELDS = {
  technicalTask: ['taskDate', 'taskNumber', 'taskClearance'],
  categorization: [
    'categorizationType',
    'categorizationActDate',
    'categorizationActNumber',
    'categorizationRank',
    'categorizationValidUntil',
    'foreignCriticalArea',
    'hightInformationRank',
  ],
  atestation: [
    'attestationRegNumber',
    'attestationRegDate',
    'attestationDsszziDate',
    'attestationDsszziNumber',
    'attestationValidUntil',
    'atestationPerformer',
    'attestationWorkStartDate',
    'attestationWorkEndDate',
    'atestationPermissionPerformer',
  ],
  passport: ['passportNumber', 'passportDate'],
  ksp: ['kspActNumber', 'kspActDate'],
};

const ktziDocumentLegacySources = {
  technicalTask: [
    ['class_a_systems_technical_task', 'class_a_systems', 'systemId', 'taskDate', 'systemName', 'AS'],
    ['krt_technical_task', 'krt', 'krtId', 'taskDate', 'systemName', 'KRT'],
    ['service_premises_technical_task', 'service_premises', 'premisesId', 'taskDate', 'serviceName', 'SP'],
  ],
  categorization: [
    ['class_a_systems_categorization', 'class_a_systems', 'systemId', 'categorizationActDate', 'systemName', 'AS'],
    ['krt_categorization', 'krt', 'krtId', 'categorizationActDate', 'systemName', 'KRT'],
    ['service_premises_categorization', 'service_premises', 'premisesId', 'categorizationActDate', 'serviceName', 'SP'],
  ],
  atestation: [
    ['class_a_systems_atestation', 'class_a_systems', 'systemId', 'attestationRegDate', 'systemName', 'AS'],
    ['krt_atestation', 'krt', 'krtId', 'attestationRegDate', 'systemName', 'KRT'],
    ['service_premises_atestation', 'service_premises', 'premisesId', 'attestationRegDate', 'serviceName', 'SP'],
  ],
};

const legacyNestedDocumentCandidates = async (ktziId, documentType) => {
  const sources = ktziDocumentLegacySources[documentType];
  if (!sources) return [];

  const candidates = [];
  for (const [
    nestedTable,
    objectTable,
    foreignKey,
    dateField,
    nameField,
    objectType,
  ] of sources) {
    const rows = await all(
      `SELECT nested.*, object.id AS ktziObjectId,
              object.${nameField} AS ktziObjectName
       FROM ${nestedTable} nested
       JOIN ${objectTable} object ON object.id = nested.${foreignKey}
       WHERE object.ktziId = ?
       ORDER BY nested.${dateField} DESC, nested.id DESC`,
      [ktziId],
    );
    const seenObjects = new Set();
    for (const row of rows) {
      if (seenObjects.has(row.ktziObjectId)) continue;
      const data = Object.fromEntries(
        KTZI_DOCUMENT_FIELDS[documentType].map((field) => [
          field,
          String(row[field] || ''),
        ]),
      );
      if (!Object.values(data).some((value) => value.trim())) continue;
      seenObjects.add(row.ktziObjectId);
      candidates.push({
        objectType,
        objectName: row.ktziObjectName || `Об’єкт ${row.ktziObjectId}`,
        data,
      });
    }
  }
  return candidates;
};

const legacyScalarDocumentCandidates = async (ktziId, documentType) => {
  const sources =
    documentType === 'passport'
      ? [
          ['class_a_systems', 'passportNumber', 'passportDate', 'systemName', 'AS'],
          ['krt', 'passportNumber', 'passportDate', 'systemName', 'KRT'],
          ['service_premises', 'passportNumber', 'passportDate', 'serviceName', 'SP'],
        ]
      : [['class_a_systems', 'kspActNumber', 'kspActDate', 'systemName', 'AS']];
  const candidates = [];
  for (const [table, numberField, dateField, nameField, objectType] of sources) {
    const rows = await all(
      `SELECT ${numberField}, ${dateField}, id AS ktziObjectId,
              ${nameField} AS ktziObjectName
       FROM ${table}
       WHERE ktziId = ?
         AND (COALESCE(${numberField}, '') != '' OR COALESCE(${dateField}, '') != '')
       ORDER BY ${dateField} DESC, id DESC`,
      [ktziId],
    );
    candidates.push(
      ...rows.map((row) => ({
        objectType,
        objectName: row.ktziObjectName || `Об’єкт ${row.ktziObjectId}`,
        data: {
          [numberField]: row[numberField] || '',
          [dateField]: row[dateField] || '',
        },
      })),
    );
  }
  return candidates;
};

const resolveLegacyDocumentCandidates = (documentType, candidates) => {
  const fields = KTZI_DOCUMENT_FIELDS[documentType];
  const conflictingFields = fields.filter((field) => {
    const values = new Set(
      candidates
        .map((candidate) => candidate.data[field])
        .filter((value) => value),
    );
    return values.size > 1;
  });
  if (conflictingFields.length) {
    return { data: null, conflict: { documentType, candidates } };
  }

  const data = Object.fromEntries(fields.map((field) => [field, '']));
  candidates.forEach((candidate) => {
    fields.forEach((field) => {
      if (!data[field] && candidate.data[field]) {
        data[field] = candidate.data[field];
      }
    });
  });
  return { data, conflict: null };
};

const documentSummary = (documentType, data) => {
  const numberFields = {
    technicalTask: 'taskNumber',
    categorization: 'categorizationActNumber',
    atestation: 'attestationRegNumber',
    passport: 'passportNumber',
    ksp: 'kspActNumber',
  };
  const dateFields = {
    technicalTask: 'taskClearance',
    categorization: 'categorizationActDate',
    atestation: 'attestationRegDate',
    passport: 'passportDate',
    ksp: 'kspActDate',
  };
  const validUntilFields = {
    categorization: 'categorizationValidUntil',
    atestation: 'attestationValidUntil',
  };
  return {
    number: data[numberFields[documentType]] || '',
    date: data[dateFields[documentType]] || '',
    validUntil: data[validUntilFields[documentType]] || '',
  };
};

const saveKtziDocument = async (ktziId, documentType, data) => {
  const fields = KTZI_DOCUMENT_FIELDS[documentType];
  const documentData = Object.fromEntries(
    fields.map((field) => [field, String(data[field] || '')]),
  );
  if (!Object.values(documentData).some((value) => value.trim())) {
    await run('DELETE FROM ktzi_documents WHERE ktziId = ? AND documentType = ?', [
      ktziId,
      documentType,
    ]);
    return;
  }

  const summary = documentSummary(documentType, documentData);
  await run('DELETE FROM ktzi_documents WHERE ktziId = ? AND documentType = ?', [
    ktziId,
    documentType,
  ]);
  await run(
    `INSERT INTO ktzi_documents
      (ktziId, documentType, documentNumber, documentDate, validUntil, documentData)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      ktziId,
      documentType,
      summary.number,
      summary.date,
      summary.validUntil,
      JSON.stringify(documentData),
    ],
  );
};

const hydrateKtziDocument = (row) => {
  if (row.documentData) {
    try {
      return { ...JSON.parse(row.documentData) };
    } catch (error) {
      console.error(`Некоректні дані документа КТЗІ ${row.documentType}:`, error);
    }
  }
  const legacyFieldMap = {
    technicalTask: { taskNumber: row.documentNumber, taskClearance: row.documentDate },
    categorization: {
      categorizationActNumber: row.documentNumber,
      categorizationActDate: row.documentDate,
      categorizationValidUntil: row.validUntil,
    },
    atestation: {
      attestationRegNumber: row.documentNumber,
      attestationRegDate: row.documentDate,
      attestationValidUntil: row.validUntil,
    },
  };
  return legacyFieldMap[row.documentType] || {};
};

export const getKtziDocumentData = async (ktziId) => {
  const rows = await all(
    'SELECT * FROM ktzi_documents WHERE ktziId = ? ORDER BY id',
    [ktziId],
  );
  const documents = {};
  const migrationConflicts = [];
  rows.forEach((row) => {
    if (KTZI_DOCUMENT_FIELDS[row.documentType]) {
      documents[row.documentType] = hydrateKtziDocument(row);
    }
  });

  for (const documentType of Object.keys(KTZI_DOCUMENT_FIELDS)) {
    const storedRow = rows.find((row) => row.documentType === documentType);
    if (storedRow?.documentData) continue;
    const candidates =
      documentType === 'passport' || documentType === 'ksp'
        ? await legacyScalarDocumentCandidates(ktziId, documentType)
        : await legacyNestedDocumentCandidates(ktziId, documentType);
    const resolution = resolveLegacyDocumentCandidates(
      documentType,
      candidates,
    );
    if (resolution.conflict && !storedRow) {
      migrationConflicts.push(resolution.conflict);
      continue;
    }
    if (!candidates.length && !storedRow) continue;
    const data = {
      ...(resolution.data || {}),
      ...(documents[documentType] || {}),
    };
    if (!Object.values(data).some((value) => value.trim())) continue;
    await saveKtziDocument(ktziId, documentType, data);
    documents[documentType] = data;
  }

  return { documents, migrationConflicts };
};

export const saveKtziDocumentData = async (ktziId, documents) => {
  const invalidInput = (message) => {
    const error = new Error(message);
    error.status = 400;
    return error;
  };
  if (!documents || typeof documents !== 'object' || Array.isArray(documents)) {
    throw invalidInput('Потрібно передати документи КТЗІ');
  }
  for (const documentType of Object.keys(documents)) {
    if (!KTZI_DOCUMENT_FIELDS[documentType]) {
      throw invalidInput(`Невідомий тип документа КТЗІ: ${documentType}`);
    }
    if (!documents[documentType] || typeof documents[documentType] !== 'object') {
      throw invalidInput(`Некоректні дані документа КТЗІ: ${documentType}`);
    }
    const allowedFields = new Set(KTZI_DOCUMENT_FIELDS[documentType]);
    if (Object.keys(documents[documentType]).some((field) => !allowedFields.has(field))) {
      throw invalidInput(`Документ ${documentType} містить невідомі поля`);
    }
    if (
      Object.values(documents[documentType]).some(
        (value) => value !== null && value !== undefined && typeof value !== 'string',
      )
    ) {
      throw invalidInput(`Поля документа ${documentType} мають бути текстовими`);
    }
  }

  await run('BEGIN TRANSACTION');
  try {
    for (const documentType of Object.keys(KTZI_DOCUMENT_FIELDS)) {
      await saveKtziDocument(ktziId, documentType, documents[documentType] || {});
    }
    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
  return getKtziDocumentData(ktziId);
};

export const syncKtziComplianceDocuments = async (ktziId, documents = []) => {
  if (!Array.isArray(documents)) return;
  for (const document of documents) {
    if (!document?.documentType) continue;
    const number = document.dsszzіNumber || '';
    const date = document.dsszzіDate || '';
    if (!number && !date && !document.validUntil) continue;
    await run(
      'DELETE FROM ktzi_documents WHERE ktziId = ? AND documentType = ?',
      [ktziId, document.documentType],
    );
    await run(
      `INSERT INTO ktzi_documents
        (ktziId, documentType, documentNumber, documentDate, validUntil)
       VALUES (?, ?, ?, ?, ?)`,
      [
        ktziId,
        document.documentType,
        number,
        date,
        document.validUntil || '',
      ],
    );
  }
};

export const getKtziObjects = (ktziId) =>
  new Promise((resolve, reject) => {
    const queries = [
      `SELECT id, 'AS' AS objectType, systemName AS objectName, systemClass,
        subdivisionName, premisesNumber, address FROM class_a_systems WHERE ktziId = ?`,
      `SELECT id, 'KRT' AS objectType, systemName AS objectName,
        subdivisionName, premisesNumber, address FROM krt WHERE ktziId = ?`,
      `SELECT id, 'SP' AS objectType, serviceName AS objectName,
        subdivisionName, premisesNumber, address FROM service_premises WHERE ktziId = ?`,
    ];

    Promise.all(
      queries.map(
        (query) =>
          new Promise((queryResolve, queryReject) => {
            db.all(query, [ktziId], (error, rows) => {
              if (error) queryReject(error);
              else queryResolve(rows || []);
            });
          }),
      ),
    )
      .then((rows) => resolve(rows.flat()))
      .catch(reject);
  });
