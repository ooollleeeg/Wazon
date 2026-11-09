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
  ksp: [
    'checkNumber',
    'checkDate',
    'checkPerformer',
    'checkEventDate',
    'checkPermissionPerformer',
  ],
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
  ksp: [
    ['class_a_systems_special_check', 'class_a_systems', 'systemId', 'checkDate', 'systemName', 'AS'],
    ['krt_special_check', 'krt', 'krtId', 'checkDate', 'systemName', 'KRT'],
    ['service_premises_special_check', 'service_premises', 'premisesId', 'checkDate', 'serviceName', 'SP'],
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
      `SELECT nested.*, nested.id AS legacyId,
              object.id AS ktziObjectId,
              object.${nameField} AS ktziObjectName
       FROM ${nestedTable} nested
       JOIN ${objectTable} object ON object.id = nested.${foreignKey}
       WHERE object.ktziId = ?
       ORDER BY nested.${dateField} DESC, nested.id DESC`,
      [ktziId],
    );
    for (const row of rows) {
      const data = Object.fromEntries(
        KTZI_DOCUMENT_FIELDS[documentType].map((field) => [
          field,
          String(row[field] || ''),
        ]),
      );
      if (!Object.values(data).some((value) => value.trim())) continue;
      candidates.push({
        objectType,
        objectName: row.ktziObjectName || `Об’єкт ${row.ktziObjectId}`,
        data,
        sourceTable: nestedTable,
        sourceId: row.legacyId,
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
              id AS legacyId, ${nameField} AS ktziObjectName
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
        sourceTable: table,
        sourceId: row.legacyId,
        data:
          documentType === 'ksp'
            ? {
                checkNumber: row[numberField] || '',
                checkDate: row[dateField] || '',
                checkPerformer: '',
                checkEventDate: '',
                checkPermissionPerformer: '',
              }
            : {
                [numberField]: row[numberField] || '',
                [dateField]: row[dateField] || '',
              },
      })),
    );
  }
  return candidates;
};

const documentSummary = (documentType, data) => {
  const numberFields = {
    technicalTask: 'taskNumber',
    categorization: 'categorizationActNumber',
    atestation: 'attestationRegNumber',
    passport: 'passportNumber',
    ksp: 'checkNumber',
  };
  const dateFields = {
    technicalTask: 'taskClearance',
    categorization: 'categorizationActDate',
    atestation: 'attestationRegDate',
    passport: 'passportDate',
    ksp: 'checkDate',
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

const insertKtziDocumentVersion = async (ktziId, documentType, data) => {
  const fields = KTZI_DOCUMENT_FIELDS[documentType];
  const documentData = Object.fromEntries(
    fields.map((field) => [field, String(data[field] || '')]),
  );
  const summary = documentSummary(documentType, documentData);
  const result = await run(
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
  return {
    id: result.id,
    documentType,
    documentDate: summary.date,
    documentData: JSON.stringify(documentData),
  };
};

const hydrateKtziDocument = (row) => {
  if (row.documentData) {
    try {
      const documentData = JSON.parse(row.documentData);
      if (row.documentType === 'ksp') {
        const {
          kspActNumber,
          kspActDate,
          ...currentDocumentData
        } = documentData;
        return {
          ...currentDocumentData,
          checkNumber:
            documentData.checkNumber || kspActNumber || '',
          checkDate: documentData.checkDate || kspActDate || '',
          checkPerformer: documentData.checkPerformer || '',
          checkEventDate: documentData.checkEventDate || '',
          checkPermissionPerformer:
            documentData.checkPermissionPerformer || '',
        };
      }
      return { ...documentData };
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
    ksp: {
      checkNumber: row.documentNumber,
      checkDate: row.documentDate,
      checkPerformer: '',
      checkEventDate: '',
      checkPermissionPerformer: '',
    },
  };
  return legacyFieldMap[row.documentType] || {};
};

const documentDateFields = {
  technicalTask: 'taskDate',
  categorization: 'categorizationActDate',
  atestation: 'attestationRegDate',
  passport: 'passportDate',
  ksp: 'checkDate',
};

const getDocumentVersionKey = (documentType, data) =>
  JSON.stringify(
    KTZI_DOCUMENT_FIELDS[documentType].map((field) => data[field] || ''),
  );

const getDocumentIdentityKey = (documentType, data) => {
  const numberFields = {
    technicalTask: 'taskNumber',
    categorization: 'categorizationActNumber',
    atestation: 'attestationRegNumber',
    passport: 'passportNumber',
    ksp: 'checkNumber',
  };
  const identity = [
    data[numberFields[documentType]] || '',
    data[documentDateFields[documentType]] || '',
  ];
  return identity.some(Boolean)
    ? JSON.stringify(identity)
    : getDocumentVersionKey(documentType, data);
};

const parseDocumentDate = (value) => {
  if (!value) return 0;
  const date = String(value).trim();
  const isoDate = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    return Date.UTC(
      Number(isoDate[1]),
      Number(isoDate[2]) - 1,
      Number(isoDate[3]),
    );
  }
  const localizedDate = date.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (localizedDate) {
    return Date.UTC(
      Number(localizedDate[3]),
      Number(localizedDate[2]) - 1,
      Number(localizedDate[1]),
    );
  }
  const parsedDate = new Date(date).getTime();
  return Number.isNaN(parsedDate) ? 0 : parsedDate;
};

const sortDocumentVersions = (documentType, versions) => {
  const dateField = documentDateFields[documentType];
  return versions.sort((first, second) => {
    const firstDate = parseDocumentDate(first[dateField]);
    const secondDate = parseDocumentDate(second[dateField]);
    return secondDate - firstDate || (second.id || 0) - (first.id || 0);
  });
};

const getLegacyDocumentCandidates = async (ktziId, documentType) => {
  const nested = await legacyNestedDocumentCandidates(ktziId, documentType);
  if (documentType === 'passport' || documentType === 'ksp') {
    return [
      ...nested,
      ...(await legacyScalarDocumentCandidates(ktziId, documentType)),
    ];
  }
  return nested;
};

const legacyDocumentImportLocks = new Map();

const performLegacyDocumentImport = async (
  ktziId,
  documentType,
  storedRows,
) => {
  const migrationComplete = await get(
    `SELECT 1 FROM ktzi_document_legacy_imports
     WHERE ktziId = ? AND documentType = ?
       AND sourceTable = '__complete__' AND sourceId = 0`,
    [ktziId, documentType],
  );
  if (migrationComplete) return storedRows;

  const candidates = await getLegacyDocumentCandidates(ktziId, documentType);
  const importedRows = await all(
    `SELECT sourceTable, sourceId FROM ktzi_document_legacy_imports
     WHERE ktziId = ? AND documentType = ? AND sourceTable != '__complete__'`,
    [ktziId, documentType],
  );
  const importedSources = new Set(
    importedRows.map(({ sourceTable, sourceId }) => `${sourceTable}:${sourceId}`),
  );
  const existingVersions = storedRows.map((row) => ({
    id: row.id,
    ...hydrateKtziDocument(row),
  }));
  const existingByIdentity = new Map(
    existingVersions.map((data, index) => [
      getDocumentIdentityKey(documentType, data),
      storedRows[index],
    ]),
  );

  for (const candidate of candidates) {
    const sourceKey = `${candidate.sourceTable}:${candidate.sourceId}`;
    if (importedSources.has(sourceKey)) continue;

    const data = Object.fromEntries(
      KTZI_DOCUMENT_FIELDS[documentType].map((field) => [
        field,
        String(candidate.data[field] || ''),
      ]),
    );
    const identityKey = getDocumentIdentityKey(documentType, data);
    const existingRow = existingByIdentity.get(identityKey);
    if (existingRow) {
      const existingData = hydrateKtziDocument(existingRow);
      const mergedData = Object.fromEntries(
        KTZI_DOCUMENT_FIELDS[documentType].map((field) => [
          field,
          existingData[field] || data[field] || '',
        ]),
      );
      if (
        KTZI_DOCUMENT_FIELDS[documentType].some(
          (field) => existingData[field] !== mergedData[field],
        )
      ) {
        const summary = documentSummary(documentType, mergedData);
        const serializedData = JSON.stringify(mergedData);
        await run(
          `UPDATE ktzi_documents
           SET documentNumber = ?, documentDate = ?, validUntil = ?, documentData = ?
           WHERE id = ?`,
          [
            summary.number,
            summary.date,
            summary.validUntil,
            serializedData,
            existingRow.id,
          ],
        );
        existingRow.documentData = serializedData;
        existingRow.documentDate = summary.date;
      }
    } else {
      const row = await insertKtziDocumentVersion(ktziId, documentType, data);
      storedRows.push(row);
      existingByIdentity.set(identityKey, row);
    }

    await run(
      `INSERT OR IGNORE INTO ktzi_document_legacy_imports
         (ktziId, documentType, sourceTable, sourceId)
       VALUES (?, ?, ?, ?)`,
      [ktziId, documentType, candidate.sourceTable, candidate.sourceId],
    );
  }
  await run(
    `INSERT OR IGNORE INTO ktzi_document_legacy_imports
       (ktziId, documentType, sourceTable, sourceId)
     VALUES (?, ?, '__complete__', 0)`,
    [ktziId, documentType],
  );
  return storedRows;
};

const importLegacyDocumentVersions = async (
  ktziId,
  documentType,
  storedRows,
) => {
  const key = `${ktziId}:${documentType}`;
  const pendingImport = legacyDocumentImportLocks.get(key);
  if (pendingImport) {
    await pendingImport;
    return all(
      `SELECT * FROM ktzi_documents
       WHERE ktziId = ? AND documentType = ? ORDER BY id DESC`,
      [ktziId, documentType],
    );
  }

  const importPromise = performLegacyDocumentImport(
    ktziId,
    documentType,
    storedRows,
  );
  legacyDocumentImportLocks.set(key, importPromise);
  try {
    return await importPromise;
  } finally {
    legacyDocumentImportLocks.delete(key);
  }
};

export const getKtziDocumentData = async (ktziId) => {
  const documents = {};
  const documentVersions = {};
  for (const documentType of Object.keys(KTZI_DOCUMENT_FIELDS)) {
    let rows = await all(
      `SELECT * FROM ktzi_documents
       WHERE ktziId = ? AND documentType = ? ORDER BY id DESC`,
      [ktziId, documentType],
    );
    rows = await importLegacyDocumentVersions(ktziId, documentType, rows);
    let versions = sortDocumentVersions(
      documentType,
      rows.map((row) => ({ id: row.id, ...hydrateKtziDocument(row) })),
    );
    if (documentType === 'passport') versions = versions.slice(0, 1);
    versions = versions.map((data, index) => ({
      ...data,
      isCurrent: documentType !== 'passport' && index === 0,
    }));
    if (!versions.length) continue;
    documentVersions[documentType] = versions;
    const { id, isCurrent, ...current } = versions[0];
    documents[documentType] = current;
  }

  return { documents, documentVersions, migrationConflicts: [] };
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
    const versions = Array.isArray(documents[documentType])
      ? documents[documentType]
      : [documents[documentType]];
    if (
      !documents[documentType] ||
      typeof documents[documentType] !== 'object' ||
      versions.some(
        (version) =>
          !version || typeof version !== 'object' || Array.isArray(version),
      )
    ) {
      throw invalidInput(`Некоректні дані документа КТЗІ: ${documentType}`);
    }
    const allowedFields = new Set(KTZI_DOCUMENT_FIELDS[documentType]);
    if (
      versions.some((version) =>
        Object.keys(version).some(
          (field) =>
            !allowedFields.has(field) &&
            !(field === 'isCurrent' && typeof version[field] === 'boolean') &&
            !(field === 'id' && Number.isInteger(version[field])),
        ),
      )
    ) {
      throw invalidInput(`Документ ${documentType} містить невідомі поля`);
    }
    if (
      versions.some((version) =>
        KTZI_DOCUMENT_FIELDS[documentType].some(
          (field) =>
            version[field] !== null &&
            version[field] !== undefined &&
            typeof version[field] !== 'string',
        ),
      )
    ) {
      throw invalidInput(`Поля документа ${documentType} мають бути текстовими`);
    }
  }

  await run('BEGIN TRANSACTION');
  try {
    for (const documentType of Object.keys(KTZI_DOCUMENT_FIELDS)) {
      await run(
        'DELETE FROM ktzi_documents WHERE ktziId = ? AND documentType = ?',
        [ktziId, documentType],
      );
      let versions = Array.isArray(documents[documentType])
        ? documents[documentType]
        : documents[documentType]
          ? [documents[documentType]]
          : [];
      if (documentType === 'passport') versions = versions.slice(-1);
      for (const version of versions) {
        const data = Object.fromEntries(
          KTZI_DOCUMENT_FIELDS[documentType].map((field) => [
            field,
            String(version[field] || ''),
          ]),
        );
        if (!Object.values(data).some((value) => value.trim())) continue;
        await insertKtziDocumentVersion(ktziId, documentType, data);
      }
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
