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

const firstNestedRecord = (records, dateField) => {
  if (!Array.isArray(records) || records.length === 0) return null;
  return [...records].sort(
    (a, b) =>
      new Date(b[dateField] || 0).getTime() -
      new Date(a[dateField] || 0).getTime(),
  )[0];
};

const syncDocument = async (ktziId, documentType, document) => {
  if (!document) return;

  const values = {
    technicalTask: {
      number: document.taskNumber,
      date: document.taskDate,
    },
    categorization: {
      number: document.categorizationActNumber,
      date: document.categorizationActDate,
      validUntil: document.categorizationValidUntil,
    },
    atestation: {
      number: document.attestationRegNumber,
      date: document.attestationRegDate,
      validUntil: document.attestationValidUntil,
    },
  }[documentType];

  if (!values || (!values.number && !values.date && !values.validUntil)) return;

  await run(
    'DELETE FROM ktzi_documents WHERE ktziId = ? AND documentType = ?',
    [ktziId, documentType],
  );
  await run(
    `INSERT INTO ktzi_documents
      (ktziId, documentType, documentNumber, documentDate, validUntil)
     VALUES (?, ?, ?, ?, ?)`,
    [
      ktziId,
      documentType,
      values.number || '',
      values.date || '',
      values.validUntil || '',
    ],
  );
};

export const syncKtziDocuments = async (ktziId, data) => {
  const categorization =
    firstNestedRecord(data.categorization, 'categorizationActDate') || data;
  const technicalTask = firstNestedRecord(data.technicalTask, 'taskDate') || data;
  const atestation =
    firstNestedRecord(data.atestation, 'attestationRegDate') || data;

  await Promise.all([
    syncDocument(ktziId, 'technicalTask', technicalTask),
    syncDocument(ktziId, 'categorization', categorization),
    syncDocument(ktziId, 'atestation', atestation),
  ]);
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
  if (!config || !ktziId) return;

  const [sourceTable, objectType, foreignKey] = config;
  const rows = await all(
    `SELECT categoryId, toolType, name, serialNumber, invertarNumber,
      releaseYear, manufacturerExploitationTerm, certificateInfo
     FROM ${sourceTable} WHERE ${foreignKey} = ?`,
    [objectId],
  );

  await run(
    'DELETE FROM protection_mean_assignments WHERE objectType = ? AND objectId = ?',
    [objectType, objectId],
  );

  for (const row of rows) {
    const identity = row.serialNumber || row.invertarNumber;
    let mean = identity
      ? await get(
          `SELECT * FROM protection_means
           WHERE ktziId = ? AND (serialNumber = ? OR invertarNumber = ?)
           LIMIT 1`,
          [ktziId, identity, identity],
        )
      : null;

    if (!mean) {
      const result = await run(
        `INSERT INTO protection_means
          (ktziId, categoryId, toolType, name, serialNumber, invertarNumber,
           releaseYear, manufacturerExploitationTerm, certificateInfo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
