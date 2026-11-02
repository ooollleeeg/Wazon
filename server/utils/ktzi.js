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
  const ktzi = await ensureKtzi(data);
  return { ...data, ktziId: ktzi.id };
};

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

const protectionMeanTables = {
  class_a_systems: ['class_a_systems_protection_means', 'AS', 'systemId'],
  krt: ['krt_protection_means', 'KRT', 'krtId'],
  service_premises: ['service_premises_protection_means', 'SP', 'premisesId'],
};

export const syncKtziProtectionMeans = async (
  table,
  objectId,
  ktziId,
) => {
  const config = protectionMeanTables[table];
  if (!config) return;

  const [sourceTable, objectType, foreignKey] = config;
  if (!ktziId) {
    await run(
      'DELETE FROM protection_mean_assignments WHERE objectType = ? AND objectId = ?',
      [objectType, objectId],
    );
    return;
  }

  const rows = await all(
    `SELECT categoryId, toolType, name, serialNumber, invertarNumber,
      releaseYear, manufacturerExploitationTerm, certificateInfo, notes
      FROM ${sourceTable} WHERE ${foreignKey} = ?`,
    [objectId],
  );

  await run(
    'DELETE FROM protection_mean_assignments WHERE objectType = ? AND objectId = ?',
    [objectType, objectId],
  );

  for (const row of rows) {
    const serialNumber = String(row.serialNumber || '').trim();
    const invertarNumber = String(row.invertarNumber || '').trim();
    let mean = serialNumber || invertarNumber
      ? await get(
          `SELECT * FROM protection_means
           WHERE ktziId = ?
             AND (categoryId = ? OR (categoryId IS NULL AND ? IS NULL))
             AND (
               (? != '' AND COALESCE(serialNumber, '') = ?)
               OR (? != '' AND COALESCE(invertarNumber, '') = ?)
             )
           LIMIT 1`,
          [
            ktziId,
            row.categoryId,
            row.categoryId,
            serialNumber,
            serialNumber,
            invertarNumber,
            invertarNumber,
          ],
        )
      : null;

    if (!mean) {
      const result = await run(
        `INSERT INTO protection_means
          (ktziId, categoryId, toolType, name, serialNumber, invertarNumber,
           releaseYear, manufacturerExploitationTerm, certificateInfo, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ktziId,
          row.categoryId,
          row.toolType,
          row.name,
          row.serialNumber,
          row.invertarNumber,
          row.releaseYear,
          row.manufacturerExploitationTerm,
          row.certificateInfo,
          row.notes,
        ],
      );
      mean = { id: result.id };
    }

    await run(
      `INSERT INTO protection_mean_assignments
        (protectionMeanId, objectType, objectId)
       VALUES (?, ?, ?)`,
      [mean.id, objectType, objectId],
    );
  }

  await run(
    `DELETE FROM protection_means
     WHERE ktziId = ? AND NOT EXISTS (
       SELECT 1 FROM protection_mean_assignments
       WHERE protectionMeanId = protection_means.id
     )`,
    [ktziId],
  );
};

export const shareKtziProtectionMeans = async (
  table,
  objectId,
  assignments,
) => {
  const sourceConfig = protectionMeanTables[table];
  if (!sourceConfig || !['class_a_systems', 'krt'].includes(table)) {
    const error = new Error('Спільне призначення доступне лише для АС та КРТ');
    error.status = 400;
    throw error;
  }

  const [, sourceType] = sourceConfig;
  const source = await get(
    `SELECT ktziId FROM ${table} WHERE id = ?`,
    [objectId],
  );
  if (!source?.ktziId) {
    const error = new Error('Для об’єкта не визначено КТЗІ');
    error.status = 400;
    throw error;
  }

  for (const assignment of assignments || []) {
    if (!assignment?.mean || !Array.isArray(assignment.targets)) continue;
    const { mean, targets } = assignment;
    const canonicalMeans = await all(
      `SELECT pm.id, pm.categoryId, pm.toolType, pm.name, pm.serialNumber,
        pm.invertarNumber, pm.releaseYear, pm.manufacturerExploitationTerm,
        pm.certificateInfo, pm.notes
       FROM protection_means pm
       JOIN protection_mean_assignments pma
         ON pma.protectionMeanId = pm.id
       WHERE pm.ktziId = ? AND pma.objectType = ? AND pma.objectId = ?
         AND pm.categoryId = ?
         AND pm.name = ?
         AND COALESCE(pm.serialNumber, '') = COALESCE(?, '')
         AND COALESCE(pm.invertarNumber, '') = COALESCE(?, '')`,
      [
        source.ktziId,
        sourceType,
        objectId,
        mean.categoryId || null,
        mean.name || '',
        mean.serialNumber || '',
        mean.invertarNumber || '',
      ],
    );
    if (!canonicalMeans.length) {
      const error = new Error(
        `Не знайдено збережений засіб "${mean.name || 'без назви'}" для спільного призначення`,
      );
      error.status = 400;
      throw error;
    }

    for (const target of targets) {
      const targetType = target.objectType;
      const targetTable =
        targetType === 'AS'
          ? 'class_a_systems'
          : targetType === 'KRT'
            ? 'krt'
            : null;
      if (
        !targetTable ||
        (String(target.objectId) === String(objectId) &&
          targetType === sourceType)
      ) {
        const error = new Error('Некоректний об’єкт для спільного призначення');
        error.status = 400;
        throw error;
      }

      const targetObject = await get(
        `SELECT ktziId FROM ${targetTable} WHERE id = ?`,
        [target.objectId],
      );
      if (!targetObject || String(targetObject.ktziId) !== String(source.ktziId)) {
        const error = new Error('Об’єкт належить до іншого КТЗІ');
        error.status = 400;
        throw error;
      }

      for (const canonicalMean of canonicalMeans) {
        const [targetMeanTable, targetForeignKey] =
          targetType === 'AS'
            ? ['class_a_systems_protection_means', 'systemId']
            : ['krt_protection_means', 'krtId'];
        const localMean = await get(
          `SELECT id FROM ${targetMeanTable}
           WHERE ${targetForeignKey} = ?
             AND (categoryId = ? OR (categoryId IS NULL AND ? IS NULL))
             AND name = ?
             AND COALESCE(serialNumber, '') = COALESCE(?, '')
             AND COALESCE(invertarNumber, '') = COALESCE(?, '')
           LIMIT 1`,
          [
            target.objectId,
            canonicalMean.categoryId,
            canonicalMean.categoryId,
            canonicalMean.name,
            canonicalMean.serialNumber,
            canonicalMean.invertarNumber,
          ],
        );
        if (!localMean) {
          await run(
            `INSERT INTO ${targetMeanTable}
             (${targetForeignKey}, categoryId, toolType, name, serialNumber,
              invertarNumber, releaseYear, manufacturerExploitationTerm,
              certificateInfo, notes, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
              target.objectId,
              canonicalMean.categoryId,
              canonicalMean.toolType,
              canonicalMean.name,
              canonicalMean.serialNumber,
              canonicalMean.invertarNumber,
              canonicalMean.releaseYear,
              canonicalMean.manufacturerExploitationTerm,
              canonicalMean.certificateInfo,
              canonicalMean.notes,
            ],
          );
        }
        await run(
          `INSERT OR IGNORE INTO protection_mean_assignments
           (protectionMeanId, objectType, objectId)
           VALUES (?, ?, ?)`,
          [canonicalMean.id, targetType, target.objectId],
        );
      }
    }
  }

  return { success: true };
};

export const applyKtziProtectionMeanChanges = async (
  table,
  objectId,
  changes,
) => {
  const sourceConfig = protectionMeanTables[table];
  if (!sourceConfig || !['class_a_systems', 'krt'].includes(table)) {
    const error = new Error('Оновлення спільних засобів доступне лише для АС та КРТ');
    error.status = 400;
    throw error;
  }

  const [, sourceType] = sourceConfig;
  const source = await get(`SELECT id FROM ${table} WHERE id = ?`, [objectId]);
  if (!source) {
    const error = new Error('Об’єкт не знайдено');
    error.status = 404;
    throw error;
  }

  const targetTables = {
    AS: ['class_a_systems_protection_means', 'systemId'],
    KRT: ['krt_protection_means', 'krtId'],
  };
  const fields = [
    'categoryId',
    'toolType',
    'name',
    'serialNumber',
    'invertarNumber',
    'releaseYear',
    'manufacturerExploitationTerm',
    'certificateInfo',
    'notes',
  ];
  const changedIds = new Set();

  for (const change of changes || []) {
    const protectionMeanId = Number(change?.protectionMeanId);
    if (!Number.isInteger(protectionMeanId) || protectionMeanId <= 0) {
      const error = new Error('Некоректний засіб ТЗІ для оновлення');
      error.status = 400;
      throw error;
    }
    if (changedIds.has(protectionMeanId)) continue;
    changedIds.add(protectionMeanId);

    const currentMean = await get(
      'SELECT * FROM protection_means WHERE id = ?',
      [protectionMeanId],
    );
    if (!currentMean) {
      const error = new Error('Спільний засіб ТЗІ більше не існує');
      error.status = 404;
      throw error;
    }

    const assignments = await all(
      `SELECT objectType, objectId FROM protection_mean_assignments
       WHERE protectionMeanId = ? AND NOT (objectType = ? AND objectId = ?)`,
      [protectionMeanId, sourceType, objectId],
    );
    const targets = assignments.filter((assignment) =>
      targetTables[assignment.objectType],
    );
    if (!targets.length) continue;

    if (!change.mean) {
      await deleteKtziProtectionMean(protectionMeanId);
      continue;
    }

    const updatedMean = Object.fromEntries(
      fields.map((field) => [
        field,
        change.mean[field] === undefined
          ? currentMean[field]
          : change.mean[field],
      ]),
    );
    await run(
      `UPDATE protection_means
       SET categoryId = ?, toolType = ?, name = ?, serialNumber = ?,
         invertarNumber = ?, releaseYear = ?, manufacturerExploitationTerm = ?,
         certificateInfo = ?, notes = ?
       WHERE id = ?`,
      [...fields.map((field) => updatedMean[field] ?? null), protectionMeanId],
    );

    for (const target of targets) {
      const [targetTable, foreignKey] = targetTables[target.objectType];
      const updateResult = await run(
        `UPDATE ${targetTable}
         SET categoryId = ?, toolType = ?, name = ?, serialNumber = ?,
           invertarNumber = ?, releaseYear = ?, manufacturerExploitationTerm = ?,
           certificateInfo = ?, notes = ?
         WHERE ${foreignKey} = ?
           AND (categoryId = ? OR (categoryId IS NULL AND ? IS NULL))
           AND name = ?
           AND COALESCE(serialNumber, '') = COALESCE(?, '')
           AND COALESCE(invertarNumber, '') = COALESCE(?, '')`,
        [
          ...fields.map((field) => updatedMean[field] ?? null),
          target.objectId,
          currentMean.categoryId,
          currentMean.categoryId,
          currentMean.name,
          currentMean.serialNumber,
          currentMean.invertarNumber,
        ],
      );
      if (!updateResult.changes) {
        const error = new Error(
          `Не знайдено локальну копію спільного засобу для об’єкта ${target.objectType}#${target.objectId}`,
        );
        error.status = 409;
        throw error;
      }
    }
  }

  return { success: true };
};

export const deleteKtziProtectionMean = async (protectionMeanId) => {
  const mean = await get(
    `SELECT categoryId, name, serialNumber, invertarNumber
     FROM protection_means WHERE id = ?`,
    [protectionMeanId],
  );
  if (!mean) return;

  const assignments = await all(
    `SELECT objectType, objectId FROM protection_mean_assignments
     WHERE protectionMeanId = ?`,
    [protectionMeanId],
  );
  const sourceTables = {
    AS: ['class_a_systems_protection_means', 'systemId'],
    KRT: ['krt_protection_means', 'krtId'],
    SP: ['service_premises_protection_means', 'premisesId'],
    IKS: ['iks_protection_means', 'iksId'],
  };

  for (const assignment of assignments) {
    const sourceConfig = sourceTables[assignment.objectType];
    if (!sourceConfig) continue;
    const [table, foreignKey] = sourceConfig;
    await run(
      `DELETE FROM ${table}
       WHERE ${foreignKey} = ?
         AND (categoryId = ? OR (categoryId IS NULL AND ? IS NULL))
         AND name = ?
         AND COALESCE(serialNumber, '') = COALESCE(?, '')
         AND COALESCE(invertarNumber, '') = COALESCE(?, '')`,
      [
        assignment.objectId,
        mean.categoryId,
        mean.categoryId,
        mean.name,
        mean.serialNumber,
        mean.invertarNumber,
      ],
    );
  }

  await run(
    'DELETE FROM protection_mean_assignments WHERE protectionMeanId = ?',
    [protectionMeanId],
  );
  await run('DELETE FROM protection_means WHERE id = ?', [protectionMeanId]);
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
