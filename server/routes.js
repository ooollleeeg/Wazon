import express from 'express';
import {
  objectTypes,
  isValidObjectType,
  getObjectType,
} from './config/objectTypes.js';
import {
  getAllObjects,
  getObjectById,
  createObject,
  updateObject,
  deleteObject,
  getObjectWithNested,
  createObjectWithNested,
  updateObjectWithNested,
  deleteNestedItem,
  checkProtectionMeanDuplicate,
  getAntivirusData,
  updateAntivirusOnAllObjects,
} from './utils/dbHelpers.js';
import { db } from './database.js';
import {
  attachObjectToKtzi,
  getKtziObjects,
  getKtziDocumentData,
  saveKtziDocumentData,
  syncKtziComplianceDocuments,
  updateKtziMainInfo,
  getKtziProtectionMeans,
  isKtziTable,
} from './utils/ktzi.js';

const router = express.Router();

const queryAll = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });

const queryOne = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) reject(error);
      else resolve(row || null);
    });
  });

const addKtziInformationToObject = async (object, cache = new Map()) => {
  if (!object?.ktziId) return object;
  const ktziId = String(object.ktziId);
  if (!cache.has(ktziId)) {
    cache.set(
      ktziId,
      Promise.all([
        queryOne('SELECT * FROM ktzi WHERE id = ?', [object.ktziId]),
        getKtziDocumentData(object.ktziId),
        getKtziProtectionMeans(object.ktziId),
      ]),
    );
  }
  const [ktzi, documentData, protectionMeans] = await cache.get(ktziId);
  const { documents } = documentData;
  return {
    ...object,
    ktziInfo: ktzi
      ? {
          ...ktzi,
          documents,
          documentVersions: documentData.documentVersions,
          migrationConflicts: documentData.migrationConflicts,
          protectionMeans,
        }
      : null,
    ktziDocuments: documents,
    technicalTask: documents.technicalTask
      ? [documents.technicalTask]
      : object.technicalTask,
    categorization: documents.categorization
      ? [documents.categorization]
      : object.categorization,
    atestation: documents.atestation
      ? [documents.atestation]
      : object.atestation,
    specialCheck: documents.ksp ? [documents.ksp] : object.specialCheck,
    passportNumber:
      documents.passport?.passportNumber ?? object.passportNumber,
    passportDate: documents.passport?.passportDate ?? object.passportDate,
    kspActNumber: documents.ksp?.checkNumber ?? object.kspActNumber,
    kspActDate: documents.ksp?.checkDate ?? object.kspActDate,
  };
};

const sharedKtziObjectFields = new Set([
  'categorization',
  'technicalTask',
  'atestation',
  'passportNumber',
  'passportDate',
  'kspActNumber',
  'kspActDate',
  'categorizationActDate',
  'categorizationActNumber',
  'attestationRegDate',
  'attestationRegNumber',
  'attestationDsszziDate',
  'attestationDsszziNumber',
  'attestationValidUntil',
  'taskDate',
  'taskNumber',
  'taskClearance',
  'ktziDocuments',
  'specialCheck',
]);

const removeSharedKtziObjectFields = (data) =>
  Object.fromEntries(
    Object.entries(data).filter(([field]) => !sharedKtziObjectFields.has(field)),
  );

// КТЗІ без об'єктів і засобів ТЗІ видаляється разом із документами
const removeEmptyKtzi = (ktziId) =>
  new Promise((resolve, reject) => {
    if (!ktziId) return resolve();
    db.run(
      `DELETE FROM ktzi
       WHERE id = ?
         AND NOT EXISTS (SELECT 1 FROM class_a_systems WHERE ktziId = ?)
         AND NOT EXISTS (SELECT 1 FROM krt WHERE ktziId = ?)
         AND NOT EXISTS (SELECT 1 FROM service_premises WHERE ktziId = ?)
         AND NOT EXISTS (SELECT 1 FROM protection_means WHERE ktziId = ?)`,
      [ktziId, ktziId, ktziId, ktziId, ktziId],
      (error) => (error ? reject(error) : resolve()),
    );
  });

router.get('/ktzi', async (_req, res) => {
  try {
    const ktzis = await queryAll(
      'SELECT * FROM ktzi ORDER BY address, premisesNumber, subdivisionName',
    );
    const result = await Promise.all(
      ktzis.map(async (ktzi) => {
        const [objects, documentData, protectionMeans] = await Promise.all([
          getKtziObjects(ktzi.id),
          getKtziDocumentData(ktzi.id),
          getKtziProtectionMeans(ktzi.id),
        ]);
        return { ...ktzi, objects, ...documentData, protectionMeans };
      }),
    );
    res.json(result);
  } catch (err) {
    console.error('Помилка отримання КТЗІ:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/ktzi/:id', async (req, res) => {
  try {
    const ktzi = await updateKtziMainInfo(req.params.id, req.body);
    res.json(ktzi);
  } catch (err) {
    console.error('Помилка збереження основної інформації КТЗІ:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/ktzi/:id', async (req, res) => {
  try {
    const ktzi = await queryOne('SELECT id FROM ktzi WHERE id = ?', [
      req.params.id,
    ]);
    if (!ktzi) {
      return res.status(404).json({ error: 'КТЗІ не знайдено' });
    }
    const [objects, protectionMeans] = await Promise.all([
      getKtziObjects(ktzi.id),
      getKtziProtectionMeans(ktzi.id),
    ]);
    if (objects.length || protectionMeans.length) {
      return res.status(409).json({
        error:
          'Не можна видалити КТЗІ, до складу якого входять об’єкти або встановлені засоби ТЗІ',
      });
    }
    await removeEmptyKtzi(ktzi.id);
    res.json({ success: true, id: ktzi.id });
  } catch (err) {
    console.error('Помилка видалення КТЗІ:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/ktzi/:id/documents', async (req, res) => {
  try {
    const ktzi = await queryOne('SELECT id FROM ktzi WHERE id = ?', [
      req.params.id,
    ]);
    if (!ktzi) {
      return res.status(404).json({ error: 'КТЗІ не знайдено' });
    }
    const result = await saveKtziDocumentData(ktzi.id, req.body.documents);
    res.json(result);
  } catch (err) {
    console.error('Помилка збереження документів КТЗІ:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

const countOidObjects = async ({
  table,
  categorizationTable,
  foreignKey,
  subdivision,
  category,
  objectType,
  uniqueAct,
  objectCategoryField,
}) => {
  const categoryExpression = objectCategoryField
    ? `COALESCE(NULLIF(o.${objectCategoryField}, ''), c.categorizationRank)`
    : 'c.categorizationRank';
  const conditions = [
    `LOWER(COALESCE(o.subdivisionType, '')) LIKE ?`,
    `${categoryExpression} = ?`,
  ];
  const params = [`%${subdivision}%`, category];

  if (objectType) {
    conditions.push(`o.objectType = ?`);
    params.push(objectType);
  }

  const row = await queryOne(
    `SELECT COUNT(DISTINCT ${
      uniqueAct
        ? `CASE
             WHEN ${
               objectCategoryField
                 ? `o.${objectCategoryField} = 'IV'`
                 : '0'
             } THEN 'object:' || o.id
             WHEN o.ktziId IS NOT NULL THEN 'ktzi:' || o.ktziId
             ELSE 'act:' ||
               COALESCE(c.categorizationActNumber, '') || '|' ||
               COALESCE(c.categorizationActDate, '') || '|' ||
               COALESCE(c.categorizationValidUntil, '')
           END`
        : 'o.id'
    }) AS count
     FROM ${table} o
     LEFT JOIN ${categorizationTable} c ON c.${foreignKey} = o.id
     WHERE ${conditions.join(' AND ')}`,
    params,
  );
  return Number(row?.count || 0);
};

const countOidAttested = async ({
  table,
  categorizationTable,
  foreignKey,
  attestationTable,
  attestationForeignKey,
  complianceTable,
  complianceForeignKey,
  subdivision,
  category,
  objectType,
  objectCategoryField,
}) => {
  const categoryExpression = objectCategoryField
    ? `COALESCE(NULLIF(o.${objectCategoryField}, ''), c.categorizationRank)`
    : 'c.categorizationRank';
  const conditions = [
    `LOWER(COALESCE(o.subdivisionType, '')) LIKE ?`,
    `${categoryExpression} = ?`,
  ];
  const params = [`%${subdivision}%`, category];

  if (objectType) {
    conditions.push(`o.objectType = ?`);
    params.push(objectType);
  }

  if (category === 'IV') {
    const localComplianceCondition = complianceTable
      ? `(d.dsszzіNumber IS NOT NULL AND
          TRIM(d.dsszzіNumber) <> '' AND
          d.documentType IN (?, ?, ?, ?))`
      : '0';
    const sharedComplianceCondition = objectCategoryField
      ? `(COALESCE(TRIM(o.${objectCategoryField}), '') = '' AND EXISTS (
          SELECT 1
          FROM ktzi_documents kd
          WHERE kd.ktziId = o.ktziId
            AND TRIM(COALESCE(kd.documentNumber, '')) <> ''
            AND kd.documentType IN (?, ?, ?, ?)
        ))`
      : `EXISTS (
          SELECT 1
          FROM ktzi_documents kd
          WHERE kd.ktziId = o.ktziId
            AND TRIM(COALESCE(kd.documentNumber, '')) <> ''
            AND kd.documentType IN (?, ?, ?, ?)
        )`;
    conditions.push(`(${localComplianceCondition} OR ${sharedComplianceCondition})`);
    const documentTypes = [
      'Атестат відповідності',
      'Акт завершення робіт',
      'Декларація про відповідність вимогам нормативних документів',
      'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
    ];
    params.push(...(complianceTable ? [...documentTypes, ...documentTypes] : documentTypes));
  } else {
    conditions.push(
      `a.attestationDsszziNumber IS NOT NULL`,
      `TRIM(a.attestationDsszziNumber) <> ''`,
    );
  }

  const join = category === 'IV'
    ? complianceTable
      ? `LEFT JOIN ${complianceTable} d ON d.${complianceForeignKey} = o.id`
      : ''
    : `JOIN ${attestationTable} a ON a.${attestationForeignKey} = o.id`;
  const uniqueKey = category === 'IV'
    ? `CASE
         WHEN ${
           objectCategoryField ? `o.${objectCategoryField} = 'IV'` : '0'
         } THEN 'object:' || o.id
         WHEN o.ktziId IS NOT NULL THEN 'ktzi:' || o.ktziId
         ELSE ${
           complianceTable
             ? `'document:' || COALESCE(d.dsszzіNumber, '') || '|' ||
                COALESCE(d.dsszzіDate, '')`
             : `'document:' || o.id`
         }
       END`
    : `CASE
         WHEN o.ktziId IS NOT NULL THEN 'ktzi:' || o.ktziId
         ELSE 'attestation:' || COALESCE(a.attestationDsszziNumber, '') || '|' ||
           COALESCE(a.attestationDsszziDate, '')
       END`;

  const row = await queryOne(
    `SELECT COUNT(DISTINCT ${uniqueKey}) AS count
     FROM ${table} o
     LEFT JOIN ${categorizationTable} c ON c.${foreignKey} = o.id
     ${join}
     WHERE ${conditions.join(' AND ')}`,
    params,
  );
  return Number(row?.count || 0);
};

const countOidEquipped = async ({
  table,
  categorizationTable,
  foreignKey,
  subdivision,
  category,
  objectType,
  objectCategoryField,
}) => {
  const categoryExpression = objectCategoryField
    ? `COALESCE(NULLIF(o.${objectCategoryField}, ''), c.categorizationRank)`
    : 'c.categorizationRank';
  const conditions = [
    `LOWER(COALESCE(o.subdivisionType, '')) LIKE ?`,
    `${categoryExpression} = ?`,
  ];
  const params = [`%${subdivision}%`, category];

  if (objectType) {
    conditions.push(`o.objectType = ?`);
    params.push(objectType);
  }

  const meansCondition = category === 'IV'
    ? '0'
    : `EXISTS (
        SELECT 1
        FROM protection_means ktziMeans
        WHERE ktziMeans.ktziId = o.ktziId
      )`;
  const isNonIvCategory = category === 'IV' ? 0 : 1;

  const row = await queryOne(
    `SELECT COUNT(DISTINCT CASE
       WHEN ${isNonIvCategory} = 1 AND o.ktziId IS NOT NULL
         THEN 'ktzi:' || o.ktziId
       ELSE 'object:' || o.id
     END) AS count
     FROM ${table} o
     LEFT JOIN ${categorizationTable} c ON c.${foreignKey} = o.id
     WHERE ${conditions.join(' AND ')}
       AND ${meansCondition}`,
    params,
  );
  return Number(row?.count || 0);
};

const countCurrentComplianceDocuments = async ({
  subdivision,
  category,
  documentType,
  validityField,
}) => {
  const categoryExpression =
    `COALESCE(NULLIF(o.informationCategory, ''), c.categorizationRank)`;
  const row = await queryOne(
    `SELECT COUNT(DISTINCT o.id) AS count
     FROM class_a_systems o
     LEFT JOIN class_a_systems_categorization c ON c.systemId = o.id
     JOIN class_a_systems_compliance_documents d ON d.systemId = o.id
     WHERE LOWER(COALESCE(o.subdivisionType, '')) LIKE ?
       AND ${categoryExpression} = ?
       AND d.documentType = ?
       AND TRIM(COALESCE(d.dsszzіNumber, '')) <> ''
       AND d.dsszzіDate IS NOT NULL
       AND TRIM(d.dsszzіDate) <> ''
       AND d.${validityField} IS NOT NULL
       AND TRIM(d.${validityField}) <> ''
       AND date(d.${validityField}) >= date('now')`,
    [`%${subdivision}%`, category, documentType],
  );
  return Number(row?.count || 0);
};

router.get('/oid-report', async (req, res) => {
  try {
    const categories = ['II', 'III', 'IV'];
    const subdivisions = [
      { key: 'apparatus', pattern: 'апарат' },
      { key: 'territorial', pattern: 'територіал' },
    ];
    const sources = [
      {
        key: 'servicePremises',
        table: 'service_premises',
        categorizationTable: 'service_premises_categorization',
        foreignKey: 'premisesId',
        attestationTable: 'service_premises_atestation',
        attestationForeignKey: 'premisesId',
        objectCategoryField: 'informationCategory',
      },
      {
        key: 'electronicComputers',
        table: 'class_a_systems',
        categorizationTable: 'class_a_systems_categorization',
        foreignKey: 'systemId',
        objectType: "об'єкт ЕОТ",
        uniqueAct: true,
        objectCategoryField: 'informationCategory',
        attestationTable: 'class_a_systems_atestation',
        attestationForeignKey: 'systemId',
        complianceTable: 'class_a_systems_compliance_documents',
        complianceForeignKey: 'systemId',
      },
      {
        key: 'combined',
        table: 'class_a_systems',
        categorizationTable: 'class_a_systems_categorization',
        foreignKey: 'systemId',
        objectType: 'комбінований ОІД',
        uniqueAct: true,
        objectCategoryField: 'informationCategory',
        attestationTable: 'class_a_systems_atestation',
        attestationForeignKey: 'systemId',
        complianceTable: 'class_a_systems_compliance_documents',
        complianceForeignKey: 'systemId',
      },
      {
        key: 'copyingEquipment',
        table: 'krt',
        categorizationTable: 'krt_categorization',
        foreignKey: 'krtId',
        uniqueAct: true,
        objectCategoryField: 'informationCategory',
        attestationTable: 'krt_atestation',
        attestationForeignKey: 'krtId',
      },
    ];

    const buildRows = (counter) => Promise.all(
      sources.map(async (source) => {
        const values = {};
        for (const subdivision of subdivisions) {
          values[subdivision.key] = {};
          for (const category of categories) {
            values[subdivision.key][category] = await counter({
              ...source,
              subdivision: subdivision.pattern,
              category,
            });
          }
        }
        return { key: source.key, values };
      }),
    );
    const rows = await buildRows(countOidObjects);
    const attestedRows = await buildRows(countOidAttested);
    const equippedRows = await buildRows(countOidEquipped);
    const complianceDocumentTypes = [
      {
        key: 'certificates',
        documentType: 'Атестат відповідності',
        validityField: 'validUntil',
      },
      {
        key: 'declarations',
        documentType:
          'Декларація про відповідність вимогам нормативних документів',
        validityField: 'validUntil',
      },
      {
        key: 'completionActs',
        documentType: 'Акт завершення робіт',
        validityField: 'validUntil',
      },
      {
        key: 'authorizationNotices',
        documentType:
          'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
        validityField: 'nextAuthorizationDeadline',
      },
    ];
    const complianceRows = await Promise.all(
      complianceDocumentTypes.map(async (document) => {
        const values = {};
        for (const subdivision of subdivisions) {
          values[subdivision.key] = {};
          for (const category of categories) {
            values[subdivision.key][category] =
              await countCurrentComplianceDocuments({
                subdivision: subdivision.pattern,
                category,
                ...document,
              });
          }
        }
        return { key: document.key, values };
      }),
    );

    res.json({
      categories,
      subdivisions: subdivisions.map(({ key }) => key),
      rows,
      attestedRows,
      equippedRows,
      complianceRows,
    });
  } catch (err) {
    console.error('❌ Error in GET /oid-report:', err);
    res.status(500).json({ error: 'Не вдалося сформувати відомості про ОІД' });
  }
});

/**
 * Middleware для валидации типа объекта
 */
const validateObjectType = (req, res, next) => {
  const { type } = req.params;
  if (!isValidObjectType(type)) {
    return res.status(400).json({
      error: `Невідомий тип об'єкту: ${type}`,
    });
  }
  req.objectConfig = getObjectType(type);
  next();
};

/**
 * Middleware для валидации полей
 */
const validateFields = (req, res, next) => {
  const { body } = req;
  const { fields } = req.objectConfig;
  const errors = {};

  fields.forEach((field) => {
    if (field.required && !body[field.name]) {
      errors[field.name] = `${field.label} обов'язкове поле`;
    }
  });

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// ===== GENERIC CRUD ENDPOINTS =====

/**
 * GET /api/objects/:type - Получить все объекты типа
 */
router.get('/objects/:type', validateObjectType, async (req, res) => {
  try {
    const { query } = req;
    const filters = query.filter ? JSON.parse(query.filter) : {};

    // Если есть вложенные таблицы, получить с ними
    if (req.objectConfig.nestedTables) {
      const rows = await getAllObjects(req.objectConfig.table, filters);
      const withNested = await Promise.all(
        rows.map((row) => getObjectWithNested(req.objectConfig, row.id)),
      );
      const ktziCache = new Map();
      return res.json(
        await Promise.all(
          withNested.map((object) =>
            addKtziInformationToObject(object, ktziCache),
          ),
        ),
      );
    }

    const rows = await getAllObjects(req.objectConfig.table, filters);
    res.json(rows);
  } catch (err) {
    console.error(`❌ Error in GET /objects:`, err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/objects/:type/:id - Получить один объект
 */
router.get('/objects/:type/:id', validateObjectType, async (req, res) => {
  try {
    let row;

    if (req.objectConfig.nestedTables) {
      row = await getObjectWithNested(req.objectConfig, req.params.id);
    } else {
      row = await getObjectById(req.objectConfig.table, req.params.id);
    }

    if (!row) {
      return res.status(404).json({ error: "Об'єкт не знайдено" });
    }
    res.json(await addKtziInformationToObject(row));
  } catch (err) {
    console.error(`❌ Error in GET /objects/:id:`, err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/objects/:type - Создать новый объект
 */
router.post('/objects/:type', validateObjectType, async (req, res) => {
  try {
    const requestData = isKtziTable(req.objectConfig.table)
      ? removeSharedKtziObjectFields(req.body)
      : req.body;
    const objectData = await attachObjectToKtzi(
      req.objectConfig.table,
      requestData,
    );
    let result;

    if (req.objectConfig.nestedTables) {
      result = await createObjectWithNested(req.objectConfig, objectData);
    } else {
      result = await createObject(req.objectConfig.table, objectData);
    }

    if (isKtziTable(req.objectConfig.table)) {
      await syncKtziComplianceDocuments(
        result.ktziId,
        objectData.complianceDocuments,
      );
    }

    res.status(201).json(result);
  } catch (err) {
    console.error(`❌ Error in POST /objects:`, err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PUT /api/objects/:type/:id - Обновить объект
 */
router.put('/objects/:type/:id', validateObjectType, async (req, res) => {
  try {
    const loadedCurrentObject =
      isKtziTable(req.objectConfig.table) && req.objectConfig.nestedTables
        ? await getObjectWithNested(req.objectConfig, req.params.id)
        : await getObjectById(req.objectConfig.table, req.params.id);
    const currentObject = loadedCurrentObject ? { ...loadedCurrentObject } : null;
    const requestData = isKtziTable(req.objectConfig.table)
      ? removeSharedKtziObjectFields(req.body)
      : req.body;
    const objectData = await attachObjectToKtzi(
      req.objectConfig.table,
      { ...currentObject, ...requestData },
    );
    let result;

    if (req.objectConfig.nestedTables) {
      result = await updateObjectWithNested(
        req.objectConfig,
        req.params.id,
        objectData,
      );
    } else {
      result = await updateObject(
        req.objectConfig.table,
        req.params.id,
        objectData,
      );
    }

    if (isKtziTable(req.objectConfig.table)) {
      await syncKtziComplianceDocuments(
        objectData.ktziId,
        objectData.complianceDocuments,
      );
      result = { ...result, ktziId: objectData.ktziId };
      await removeEmptyKtzi(currentObject?.ktziId);
    }

    res.json(result);
  } catch (err) {
    console.error(`❌ Error in PUT /objects:`, err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * DELETE /api/objects/:type/:id - Удалить объект
 */
router.delete('/objects/:type/:id', validateObjectType, async (req, res) => {
  try {
    const object = await getObjectById(
      req.objectConfig.table,
      req.params.id,
    );
    if (!object) {
      return res.status(404).json({ error: "Об'єкт не знайдено" });
    }

    const objectType = {
      class_a_systems: 'AS',
      krt: 'KRT',
      service_premises: 'SP',
      iks: 'IKS',
    }[req.objectConfig.table];
    const { protectionMeansAction } = req.body || {};

    if (
      objectType === 'IKS' &&
      ['return', 'remove'].includes(protectionMeansAction)
    ) {
      if (protectionMeansAction === 'return') {
        const { returnProtectionMeanToInventory } = await import(
          './utils/protectionMeansAggregator.js'
        );
        const localMeans = await queryAll(
          'SELECT id FROM iks_protection_means WHERE iksId = ?',
          [req.params.id],
        );
        for (const mean of localMeans) {
          await new Promise((resolve, reject) => {
            returnProtectionMeanToInventory(
              mean.id,
              { objectType, objectId: req.params.id },
              (error, result) => (error ? reject(error) : resolve(result)),
            );
          });
        }
      } else {
        await new Promise((resolve, reject) => {
          db.run(
            'DELETE FROM iks_protection_means WHERE iksId = ?',
            [req.params.id],
            (error) => (error ? reject(error) : resolve()),
          );
        });
      }
    }

    await deleteObject(req.objectConfig.table, req.params.id);

    if (isKtziTable(req.objectConfig.table)) {
      await removeEmptyKtzi(object?.ktziId);
    }

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error(`❌ Error in DELETE /objects:`, err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/objects/:type/:id - Частично обновить объект (только переданные поля)
 */
router.patch('/objects/:type/:id', validateObjectType, async (req, res) => {
  try {
    const currentObject = await getObjectById(
      req.objectConfig.table,
      req.params.id,
    );
    const objectData = await attachObjectToKtzi(
      req.objectConfig.table,
      { ...currentObject, ...req.body },
    );
    let result;

    if (req.objectConfig.nestedTables) {
      result = await updateObjectWithNested(
        req.objectConfig,
        req.params.id,
        objectData,
      );
    } else {
      result = await updateObject(
        req.objectConfig.table,
        req.params.id,
        objectData,
      );
    }

    if (isKtziTable(req.objectConfig.table)) {
      await syncKtziComplianceDocuments(
        objectData.ktziId,
        objectData.complianceDocuments,
      );
      result = { ...result, ktziId: objectData.ktziId };
      await removeEmptyKtzi(currentObject?.ktziId);
    }

    res.json(result);
  } catch (err) {
    console.error(`❌ Error in PATCH /objects:`, err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * DELETE /api/objects/:type/:id/nested/:nestedType/:nestedId - Удалить вложенный элемент
 */
router.delete(
  '/objects/:type/:id/nested/:nestedType/:nestedId',
  validateObjectType,
  async (req, res) => {
    try {
      const { nestedType, nestedId } = req.params;
      const nestedConfig = req.objectConfig.nestedTables?.[nestedType];

      if (!nestedConfig) {
        return res.status(400).json({ error: 'Невідомий тип вкладених даних' });
      }

      await deleteNestedItem(nestedConfig.table, nestedId);
      res.json({ success: true, id: nestedId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * GET /api/types - Получить конфиги всех типов (для UI)
 */
router.get('/types', (req, res) => {
  res.json(objectTypes);
});

const ktziObjectTypeLabels = { AS: 'АС', SP: 'СП', KRT: 'КРТ' };

router.get('/ktzi/documents', async (req, res) => {
  try {
    const ktzis = await queryAll('SELECT id FROM ktzi');
    const currentDocumentIds = new Set();
    for (const { id: ktziId } of ktzis) {
      const { documentVersions } = await getKtziDocumentData(ktziId);
      ['categorization', 'atestation'].forEach((documentType) => {
        documentVersions[documentType]
          ?.filter(({ isCurrent }) => isCurrent)
          .forEach(({ id }) => currentDocumentIds.add(id));
      });
    }

    const documents = await new Promise((resolve, reject) => {
      db.all(
        `SELECT d.*, k.address, k.premisesNumber, k.subdivisionName
         FROM ktzi_documents d
         JOIN ktzi k ON k.id = d.ktziId
         WHERE d.validUntil IS NOT NULL AND d.validUntil != ''
         ORDER BY d.validUntil`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        },
      );
    });

    const result = [];
    for (const document of documents) {
      if (
        ['categorization', 'atestation'].includes(document.documentType) &&
        !currentDocumentIds.has(document.id)
      ) {
        continue;
      }
      const objects = await getKtziObjects(document.ktziId);
      const object = objects[0];
      if (!object) continue;

      const ktziObjectTypes = ['AS', 'SP', 'KRT']
        .filter((type) => objects.some((item) => item.objectType === type))
        .map((type) => ktziObjectTypeLabels[type]);
      const tabId = {
        AS: 'class-a',
        KRT: 'krt',
        SP: 'service-premises',
      }[object.objectType];

      result.push({
        id: `ktzi-${document.ktziId}-${document.documentType}`,
        ktziId: document.ktziId,
        parentId: object.id,
        parentName: `${document.subdivisionName || 'Без підрозділу'}, прим. № ${
          document.premisesNumber || '—'
        }`,
        tabId,
        tabLabel: `КТЗІ (${ktziObjectTypes.join(', ')})`,
        documentType: document.documentType,
        fieldName: 'validUntil',
        fieldLabel:
          document.documentType === 'categorization'
            ? 'Акт категоріювання дійсний до'
            : 'Атестація дійсна до',
        expirationDate: document.validUntil,
        objectType: object.objectType,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('❌ Error in GET /ktzi/documents:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DEBUG: GET /api/debug/iks-protection - Check raw IKS protection means data
 */
router.get('/debug/iks-protection', (req, res) => {
  db.all(
    `SELECT pm.*, i.systemName FROM iks_protection_means pm JOIN iks i ON pm.iksId = i.id`,
    (err, rows) => {
      if (err) {
        res.json({ error: err.message });
      } else {
        res.json({ count: rows?.length || 0, rows: rows || [] });
      }
    },
  );
});

/**
 * GET /api/protection-means/all - Агреговане отримання всіх засобів ТЗІ
 * Фільтри: ?category=...&status=...&departmentType=...&search=...
 */
router.get('/protection-means/all', (req, res) => {
  import('./utils/protectionMeansAggregator.js')
    .then(({ aggregateProtectionMeans }) => {
      try {
        const { category, status, departmentType, search } = req.query;
        const filters = { category, status, departmentType, search };

        aggregateProtectionMeans(filters, (err, data) => {
          if (err) {
            console.error('❌ Error aggregating protection means:', err);
            res.status(500).json({ error: err.message });
          } else {
            res.json(data);
          }
        });
      } catch (err) {
        console.error('❌ Error in GET /protection-means/all:', err);
        res.status(500).json({ error: err.message });
      }
    })
    .catch((err) => {
      console.error('❌ Failed to load aggregator:', err);
      res.status(500).json({ error: 'Aggregator module not found' });
    });
});

/**
 * POST /api/protection-means/inventory - Створити новий запис засобу на складі
 */
router.post('/protection-means/inventory', (req, res) => {
  import('./utils/protectionMeansAggregator.js').then(
    ({ createInventoryItem }) => {
      try {
        createInventoryItem(req.body, (err, result) => {
          if (err) {
            console.error('❌ Error creating inventory item:', err);
            const status = err.status || 500;
            res.status(status).json({
              error: err.message,
              duplicateLocations: err.duplicateLocations,
            });
          } else {
            res.json(result);
          }
        });
      } catch (err) {
        console.error('❌ Error in POST /protection-means/inventory:', err);
        res.status(500).json({ error: err.message });
      }
    },
  );
});

/**
 * PUT /api/protection-means/inventory/:id - Оновити запис засобу на складі
 */
router.put('/protection-means/inventory/:id', (req, res) => {
  import('./utils/protectionMeansAggregator.js').then(
    ({ updateInventoryItem }) => {
      try {
        updateInventoryItem(req.params.id, req.body, (err, result) => {
          if (err) {
            console.error('❌ Error updating inventory item:', err);
            const status = err.status || 500;
            res.status(status).json({
              error: err.message,
              duplicateLocations: err.duplicateLocations,
            });
          } else {
            res.json(result);
          }
        });
      } catch (err) {
        console.error('❌ Error in PUT /protection-means/inventory:', err);
        res.status(500).json({ error: err.message });
      }
    },
  );
});

/**
 * DELETE /api/protection-means/inventory/:id - Видалити запис засобу зі складу
 */
router.delete('/protection-means/inventory/:id', (req, res) => {
  import('./utils/protectionMeansAggregator.js').then(
    ({ deleteInventoryItem }) => {
      try {
        deleteInventoryItem(req.params.id, (err, result) => {
          if (err) {
            console.error('❌ Error deleting inventory item:', err);
            res.status(500).json({ error: err.message });
          } else {
            res.json(result);
          }
        });
      } catch (err) {
        console.error('❌ Error in DELETE /protection-means/inventory:', err);
        res.status(500).json({ error: err.message });
      }
    },
  );
});

/**
 * POST /api/protection-means/check-duplicate - Перевірити дублікат засобу ТЗІ
 * Очікує: { categoryId: number, serialNumber?: string, excludeInventoryId?: string }
 * Дублікат = categoryId + serialNumber обидва збігаються, S/N не порожній
 * Возвращает: { isDuplicate: boolean, duplicateAt?: { source, objectName, objectId } }
 */
router.post('/protection-means/check-duplicate', async (req, res) => {
  try {
    const { categoryId, serialNumber, excludeInventoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        error: "categoryId обов'язковий",
      });
    }

    const result = await checkProtectionMeanDuplicate(
      categoryId,
      serialNumber || '',
      excludeInventoryId || null,
    );

    res.json(result);
  } catch (err) {
    console.error('❌ Error checking duplicate:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/protection-means/install - Встановити засіб ТЗІ з складу на об'єкт
 * Очікує: { meanId: string, objectId: string, objectType: 'AS'|'SP'|'KRT'|'IKS', category?: string }
 * Для КЗЗ від НСД: зберігає в полі kzzName, дозволено тільки AS та IKS
 * Для інших засобів: зберігає в таблиці *_protection_means
 */
router.post('/protection-means/install', (req, res) => {
  import('./utils/protectionMeansAggregator.js').then(
    ({ installProtectionMean }) => {
      try {
        installProtectionMean(req.body, (err, result) => {
          if (err) {
            console.error('❌ Error installing protection mean:', err);
            res.status(err.status || 500).json({
              error: err.message,
              duplicateLocations: err.duplicateLocations,
            });
          } else {
            res.json(result);
          }
        });
      } catch (err) {
        console.error('❌ Error in POST /protection-means/install:', err);
        res.status(500).json({ error: err.message });
      }
    },
  );
});

router.delete('/protection-means/:id/assignments', (req, res) => {
  import('./utils/protectionMeansAggregator.js').then(
    ({ returnProtectionMeanToInventory }) => {
      const { objectType, objectId, name, serialNumber, invertarNumber } =
        req.body || {};
      returnProtectionMeanToInventory(
        req.params.id,
        { objectType, objectId, name, serialNumber, invertarNumber },
        (error, result) => {
        if (error) {
          console.error('❌ Error returning protection mean to inventory:', error);
          return res.status(error.status || 500).json({ error: error.message });
        }
        res.json(result);
        },
      );
    },
  );
});

// ===== SEARCH CONTROL EQUIPMENT ENDPOINTS =====

/**
 * GET /api/search-control-equipment - Отримати список пошукової/вимірювальної техніки з фільтрацією
 */
router.get('/search-control-equipment', (req, res) => {
  try {
    const { search, category, technicalCondition } = req.query;
    let query = 'SELECT * FROM search_control_equipment WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (technicalCondition) {
      query += ' AND technicalCondition = ?';
      params.push(technicalCondition);
    }

    if (search) {
      query += ` AND (
        name LIKE ? OR 
        serialNumber LIKE ? OR 
        invertarNumber LIKE ? OR 
        releaseYear LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY createdAt DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('❌ Error fetching search control equipment:', err);
        res.status(500).json({ error: err.message });
      } else {
        // ✅ Завантажити верифікації для кожної техніки
        const equipmentWithVerifications = [];
        let completed = 0;

        if (!rows || rows.length === 0) {
          // Отримати статистику
          db.all(
            `SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN category = 'Спеціальна пошукова техніка' THEN 1 ELSE 0 END) as specialSearch,
              SUM(CASE WHEN category = 'Контрольно-вимірювальна техніка' THEN 1 ELSE 0 END) as measurementControl
            FROM search_control_equipment`,
            (statsErr, statsRows) => {
              const stats = statsErr ? null : statsRows[0];
              res.json({ items: [], stats });
            },
          );
        } else {
          rows.forEach((equipment, index) => {
            db.all(
              'SELECT * FROM search_control_equipment_verification WHERE equipmentId = ? ORDER BY verificationDate DESC',
              [equipment.id],
              (verifyErr, verifications) => {
                equipmentWithVerifications[index] = {
                  ...equipment,
                  verifications: verifications || [],
                };
                completed++;
                if (completed === rows.length) {
                  // Отримати статистику
                  db.all(
                    `SELECT 
                      COUNT(*) as total,
                      SUM(CASE WHEN category = 'Спеціальна пошукова техніка' THEN 1 ELSE 0 END) as specialSearch,
                      SUM(CASE WHEN category = 'Контрольно-вимірювальна техніка' THEN 1 ELSE 0 END) as measurementControl
                    FROM search_control_equipment`,
                    (statsErr, statsRows) => {
                      const stats = statsErr ? null : statsRows[0];
                      res.json({ items: equipmentWithVerifications, stats });
                    },
                  );
                }
              },
            );
          });
        }
      }
    });
  } catch (err) {
    console.error('❌ Error in GET /search-control-equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/search-control-equipment/:id - Отримати одиницю техніки з її повіркою
 */
router.get('/search-control-equipment/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.get(
      'SELECT * FROM search_control_equipment WHERE id = ?',
      [id],
      (err, equipment) => {
        if (err) {
          console.error('❌ Error fetching equipment:', err);
          res.status(500).json({ error: err.message });
        } else if (!equipment) {
          res.status(404).json({ error: 'Equipment not found' });
        } else {
          // Отримати повірки
          db.all(
            'SELECT * FROM search_control_equipment_verification WHERE equipmentId = ? ORDER BY verificationDate DESC',
            [id],
            (verifyErr, verifications) => {
              if (verifyErr) {
                console.error('❌ Error fetching verifications:', verifyErr);
              }
              res.json({ ...equipment, verifications: verifications || [] });
            },
          );
        }
      },
    );
  } catch (err) {
    console.error('❌ Error in GET /search-control-equipment/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/search-control-equipment - Створити нову одиницю техніки
 */
router.post('/search-control-equipment', (req, res) => {
  try {
    const {
      category,
      name,
      serialNumber,
      invertarNumber,
      releaseYear,
      technicalCondition,
      pricePerUnit,
      notes,
      verifications,
    } = req.body;

    if (!category || !name || !technicalCondition) {
      return res.status(400).json({
        error: 'Missing required fields: category, name, technicalCondition',
      });
    }

    db.run(
      `INSERT INTO search_control_equipment (category, name, serialNumber, invertarNumber, releaseYear, technicalCondition, pricePerUnit, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category,
        name,
        serialNumber,
        invertarNumber,
        releaseYear,
        technicalCondition,
        pricePerUnit,
        notes,
      ],
      function (err) {
        if (err) {
          console.error('❌ Error creating equipment:', err);
          res.status(500).json({ error: err.message });
        } else {
          const equipmentId = this.lastID;

          // Якщо передані повірки, додати їх
          if (Array.isArray(verifications) && verifications.length > 0) {
            verifications.forEach((v) => {
              db.run(
                `INSERT INTO search_control_equipment_verification (equipmentId, deviceName, serialNumber, certificateRegNumber, verificationDate, validUntil, verificationCost)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  equipmentId,
                  v.deviceName || null,
                  v.serialNumber || null,
                  v.certificateRegNumber || null,
                  v.verificationDate,
                  v.validUntil,
                  v.verificationCost || 0,
                ],
              );
            });
          }

          res.json({
            id: equipmentId,
            message: 'Equipment created successfully',
          });
        }
      },
    );
  } catch (err) {
    console.error('❌ Error in POST /search-control-equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/search-control-equipment/:id - Редагувати одиницю техніки
 */
router.put('/search-control-equipment/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      category,
      name,
      serialNumber,
      invertarNumber,
      releaseYear,
      technicalCondition,
      pricePerUnit,
      notes,
      verifications = [],
    } = req.body;

    if (!category || !name) {
      console.error('❌ Missing required fields: category or name');
      return res.status(400).json({ error: 'Category and name are required' });
    }

    db.run(
      `UPDATE search_control_equipment 
       SET category = ?, name = ?, serialNumber = ?, invertarNumber = ?, releaseYear = ?, technicalCondition = ?, pricePerUnit = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        category,
        name,
        serialNumber,
        invertarNumber,
        releaseYear,
        technicalCondition,
        pricePerUnit,
        notes,
        id,
      ],
      function (err) {
        if (err) {
          console.error('❌ Error updating equipment:', err);
          res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
          res.status(404).json({ error: 'Equipment not found' });
        } else {
          // Обробити повірки, якщо вони передані
          if (verifications && verifications.length > 0) {
            processVerifications(id, verifications, (verErr) => {
              if (verErr) {
                console.error('❌ Error processing verifications:', verErr);
                res.status(500).json({ error: verErr.message });
              } else {
                res.json({ message: 'Equipment updated successfully' });
              }
            });
          } else {
            res.json({ message: 'Equipment updated successfully' });
          }
        }
      },
    );
  } catch (err) {
    console.error('❌ Error in PUT /search-control-equipment/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Допоміжна функція для обробки повірок
 */
function processVerifications(equipmentId, verifications, callback) {
  // Отримаємо всі існуючі повірки
  db.all(
    'SELECT id FROM search_control_equipment_verification WHERE equipmentId = ?',
    [equipmentId],
    (err, existingVerifications) => {
      if (err) return callback(err);

      const existingIds = new Set(existingVerifications.map((v) => v.id));
      const incomingIds = new Set(
        verifications.filter((v) => v.id && v.id > 0).map((v) => v.id),
      );

      // Знайти які повірки видалили (існують, але не у новому масиві)
      const toDelete = [];
      existingIds.forEach((id) => {
        if (!incomingIds.has(id)) {
          toDelete.push(id);
        }
      });

      // Видалити повірки
      let deleteCount = 0;
      if (toDelete.length > 0) {
        toDelete.forEach((verificationId) => {
          db.run(
            'DELETE FROM search_control_equipment_verification WHERE id = ?',
            [verificationId],
            (delErr) => {
              deleteCount++;
              if (deleteCount === toDelete.length) {
                // Всі видалення завершені, тепер додаємо нові
                addNewVerifications(equipmentId, verifications, callback);
              }
            },
          );
        });
      } else {
        // Немає чого видаляти, одразу додаємо нові
        addNewVerifications(equipmentId, verifications, callback);
      }
    },
  );
}

/**
 * Допоміжна функція для додавання нових повірок
 */
function addNewVerifications(equipmentId, verifications, callback) {
  // Отримаємо лише нові повірки (id = 0 або не визначено)
  const newVerifications = verifications.filter((v) => !v.id || v.id <= 0);

  // Якщо немає нових повірок - готово
  if (newVerifications.length === 0) {
    return callback(null);
  }

  // Додаємо кожну нову повірку
  let addedCount = 0;
  let hasError = false;

  newVerifications.forEach((verification) => {
    const {
      deviceName,
      serialNumber,
      certificateRegNumber,
      verificationDate,
      validUntil,
      verificationCost,
    } = verification;

    db.run(
      `INSERT INTO search_control_equipment_verification (equipmentId, deviceName, serialNumber, certificateRegNumber, verificationDate, validUntil, verificationCost)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        equipmentId,
        deviceName || null,
        serialNumber || null,
        certificateRegNumber || null,
        verificationDate,
        validUntil,
        verificationCost || 0,
      ],
      function (err) {
        addedCount++;
        if (err) {
          console.error(
            `❌ Error adding verification for equipment ${equipmentId}:`,
            err,
          );
          hasError = true;
        }

        // Коли всі операції додавання завершені
        if (addedCount === newVerifications.length) {
          if (hasError) {
            callback(new Error('Error adding some verifications'));
          } else {
            callback(null);
          }
        }
      },
    );
  });
}

/**
 * DELETE /api/search-control-equipment/:id - Видалити одиницю техніки
 */
router.delete('/search-control-equipment/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.run(
      'DELETE FROM search_control_equipment WHERE id = ?',
      [id],
      function (err) {
        if (err) {
          console.error('❌ Error deleting equipment:', err);
          res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
          res.status(404).json({ error: 'Equipment not found' });
        } else {
          res.json({ message: 'Equipment deleted successfully' });
        }
      },
    );
  } catch (err) {
    console.error('❌ Error in DELETE /search-control-equipment/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/search-control-equipment/:id/verification - Додати метрологічну повірку
 */
router.post('/search-control-equipment/:id/verification', (req, res) => {
  try {
    const { id } = req.params;
    const {
      deviceName,
      serialNumber,
      certificateRegNumber,
      verificationDate,
      validUntil,
      verificationCost,
    } = req.body;

    if (!deviceName || !serialNumber || !verificationDate || !validUntil) {
      return res.status(400).json({
        error:
          'Missing required fields: deviceName, serialNumber, verificationDate, validUntil',
      });
    }

    db.run(
      `INSERT INTO search_control_equipment_verification (equipmentId, deviceName, serialNumber, certificateRegNumber, verificationDate, validUntil, verificationCost)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        deviceName,
        serialNumber,
        certificateRegNumber,
        verificationDate,
        validUntil,
        verificationCost,
      ],
      function (err) {
        if (err) {
          console.error('❌ Error creating verification:', err);
          res.status(500).json({ error: err.message });
        } else {
          res.json({
            id: this.lastID,
            message: 'Verification created successfully',
          });
        }
      },
    );
  } catch (err) {
    console.error(
      '❌ Error in POST /search-control-equipment/:id/verification:',
      err,
    );
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/search-control-equipment/:id/verification/:verificationId - Видалити повірку
 */
router.delete(
  '/search-control-equipment/:id/verification/:verificationId',
  (req, res) => {
    try {
      const { verificationId } = req.params;
      db.run(
        'DELETE FROM search_control_equipment_verification WHERE id = ?',
        [verificationId],
        function (err) {
          if (err) {
            console.error('❌ Error deleting verification:', err);
            res.status(500).json({ error: err.message });
          } else if (this.changes === 0) {
            res.status(404).json({ error: 'Verification not found' });
          } else {
            res.json({ message: 'Verification deleted successfully' });
          }
        },
      );
    } catch (err) {
      console.error(
        '❌ Error in DELETE /search-control-equipment/:id/verification/:verificationId:',
        err,
      );
      res.status(500).json({ error: err.message });
    }
  },
);

// ===== ANTIVIRUS DATA ENDPOINTS =====

/**
 * GET /api/antivirus - Отримати всі записи про встановлені антивіруси
 * Агрегує дані з class_a_systems та iks таблиць
 * Повертає масив об'єктів з інформацією про антивіруса та системи
 */
router.get('/antivirus', async (req, res) => {
  try {
    const data = await getAntivirusData();

    // Обчислити статистику
    const stats = {
      total: data.length,
      byClass: {
        'АС класу 1': 0,
        'АС класу 2': 0,
        'АС класу 3': 0,
        'ІКС класу 1': 0,
        'ІКС класу 2': 0,
        'ІКС класу 3': 0,
      },
      byDepartmentType: {
        'підрозділ апарату': 0,
        'територіальний підрозділ': 0,
      },
      uniqueAntivirus: new Set(),
    };

    data.forEach((item) => {
      if (stats.byClass[item.systemClass] !== undefined) {
        stats.byClass[item.systemClass]++;
      }
      if (stats.byDepartmentType[item.subdivisionType] !== undefined) {
        stats.byDepartmentType[item.subdivisionType]++;
      }
      if (item.antivirus) {
        stats.uniqueAntivirus.add(item.antivirus);
      }
    });

    stats.uniqueAntivirus = Array.from(stats.uniqueAntivirus);

    res.json({ items: data, stats });
  } catch (err) {
    console.error('❌ Error in GET /api/antivirus:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/antivirus/update-opinion - Оновити експертний висновок для всіх об'єктів з конкретним антивіруса
 * Очікує: { antivirusName, opinionNumber, opinionDate }
 * Оновлює поля antivirusOpinionNumber та antivirusOpinionDate на всіх дотичних об'єктах
 */
router.put('/antivirus/update-opinion', async (req, res) => {
  try {
    const { antivirusName, opinionNumber, opinionDate } = req.body;

    if (!antivirusName) {
      return res.status(400).json({
        error: "Назва антивіруса обов'язкова",
      });
    }

    const result = await updateAntivirusOnAllObjects(
      antivirusName,
      opinionNumber,
      opinionDate,
    );

    res.json({
      success: true,
      message: `Експертний висновок для "${antivirusName}" успішно оновлено`,
      updated: {
        classA: result.classA,
        iks: result.iks,
        total: result.classA + result.iks,
      },
    });
  } catch (err) {
    console.error('❌ Error in PUT /api/antivirus/update-opinion:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== GUNP RESEARCH REPORT ENDPOINT =====

/**
 * GET /api/gunp-research-report - Отримати звіт про інструментальні дослідження ГУНП
 * Query params: dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 * Групує дані по: дата + підрозділ + виконавець
 * Повертає таблицю з рядків, кожна - це комбінація: дата + підрозділ + виконавець
 */
router.get('/gunp-research-report', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        error: 'Вимагаються параметри dateFrom та dateTo (YYYY-MM-DD)',
      });
    }

    // Використовуємо Promise.all для паралельного отримання даних з 5 таблиць
    const [
      spResults,
      asSpecialResults,
      asInstrResults,
      krtInstrResults,
      asSpecialCheckResults,
    ] = await Promise.all([
      // 1. Service Premises Instrumental Control
      new Promise((resolve, reject) => {
        db.all(
          `SELECT sp.subdivisionName, spic.controlPerformer as performer, 
                    spic.controlEventDate as eventDate, COUNT(*) as count
             FROM service_premises_instrumental_control spic
             JOIN service_premises sp ON spic.premisesId = sp.id
             WHERE spic.controlEventDate BETWEEN ? AND ?
             GROUP BY spic.controlEventDate, sp.subdivisionName, spic.controlPerformer`,
          [dateFrom, dateTo],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          },
        );
      }),
      // 2. Class A Systems Special Research
      new Promise((resolve, reject) => {
        db.all(
          `SELECT cas.subdivisionName, casr.performer, casr.eventDate,
                    COUNT(*) as count
             FROM class_a_systems_special_research casr
             JOIN class_a_systems cas ON casr.systemId = cas.id
             WHERE casr.eventDate BETWEEN ? AND ?
             GROUP BY casr.eventDate, cas.subdivisionName, casr.performer`,
          [dateFrom, dateTo],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          },
        );
      }),
      // 3. Class A Systems Instrumental Control
      new Promise((resolve, reject) => {
        db.all(
          `SELECT cas.subdivisionName, caic.controlPerformer as performer,
                    caic.controlEventDate as eventDate, COUNT(*) as count
             FROM class_a_systems_instrumental_control caic
             JOIN class_a_systems cas ON caic.systemId = cas.id
             WHERE caic.controlEventDate BETWEEN ? AND ?
             GROUP BY caic.controlEventDate, cas.subdivisionName, caic.controlPerformer`,
          [dateFrom, dateTo],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          },
        );
      }),
      // 4. KRT Instrumental Control
      new Promise((resolve, reject) => {
        db.all(
          `SELECT k.subdivisionName, kic.controlPerformer as performer,
                    kic.controlEventDate as eventDate, COUNT(*) as count
             FROM krt_instrumental_control kic
             JOIN krt k ON kic.krtId = k.id
             WHERE kic.controlEventDate BETWEEN ? AND ?
             GROUP BY kic.controlEventDate, k.subdivisionName, kic.controlPerformer`,
          [dateFrom, dateTo],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          },
        );
      }),
      // 5. KTZI special checks
      new Promise((resolve, reject) => {
        db.all(
          `SELECT k.subdivisionName,
                    json_extract(kd.documentData, '$.checkPerformer') as performer,
                    json_extract(kd.documentData, '$.checkEventDate') as eventDate,
                    COUNT(*) as count
             FROM ktzi_documents kd
             JOIN ktzi k ON kd.ktziId = k.id
             WHERE kd.documentType = 'ksp'
               AND json_extract(kd.documentData, '$.checkEventDate') BETWEEN ? AND ?
             GROUP BY eventDate, k.subdivisionName, performer`,
          [dateFrom, dateTo],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          },
        );
      }),
    ]);

    // Структура для групування: { "YYYY-MM-DD|subdivisionName|performer": { counts } }
    const groupedData = {};

    // Функція для додання даних до групування
    const addToGrouped = (results, typeKey) => {
      results.forEach((row) => {
        const key = `${row.eventDate}|${row.subdivisionName}|${row.performer || ''}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            eventDate: row.eventDate,
            subdivisionName: row.subdivisionName,
            performer: row.performer || 'Не вказано',
            sp_instrumental: 0,
            as_special_research: 0,
            as_instrumental: 0,
            krt_instrumental: 0,
            as_special_check: 0,
          };
        }
        groupedData[key][typeKey] = row.count;
      });
    };

    addToGrouped(spResults, 'sp_instrumental');
    addToGrouped(asSpecialResults, 'as_special_research');
    addToGrouped(asInstrResults, 'as_instrumental');
    addToGrouped(krtInstrResults, 'krt_instrumental');
    addToGrouped(asSpecialCheckResults, 'as_special_check');

    // Конвертуємо в масив та сортуємо по eventDate
    const reportData = Object.values(groupedData).sort(
      (a, b) => new Date(a.eventDate) - new Date(b.eventDate),
    );

    // Додаємо номери з/п та рядок підсумків
    const reportWithNumbers = reportData.map((row, index) => ({
      ...row,
      rowNumber: index + 1,
    }));

    // Рядок підсумків
    const totalsRow = {
      rowNumber: '∑',
      eventDate: 'ПІДСУМОК',
      subdivisionName: '',
      performer: '',
      sp_instrumental: reportData.reduce(
        (sum, r) => sum + r.sp_instrumental,
        0,
      ),
      as_special_research: reportData.reduce(
        (sum, r) => sum + r.as_special_research,
        0,
      ),
      as_instrumental: reportData.reduce(
        (sum, r) => sum + r.as_instrumental,
        0,
      ),
      krt_instrumental: reportData.reduce(
        (sum, r) => sum + r.krt_instrumental,
        0,
      ),
      as_special_check: reportData.reduce(
        (sum, r) => sum + r.as_special_check,
        0,
      ),
    };

    res.json({
      success: true,
      dateFrom,
      dateTo,
      rows: reportWithNumbers,
      totals: totalsRow,
    });
  } catch (err) {
    console.error('❌ Error in GET /api/gunp-research-report:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== DOCUMENTS REPORT ENDPOINT =====

/**
 * GET /api/documents-report - Звіт про підготовлені документи з ТЗІ
 * Query params: dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 */
router.get('/documents-report', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (
      typeof dateFrom !== 'string' ||
      typeof dateTo !== 'string' ||
      !datePattern.test(dateFrom) ||
      !datePattern.test(dateTo) ||
      dateFrom > dateTo
    ) {
      return res.status(400).json({
        error:
          'Потрібні коректні параметри dateFrom та dateTo у форматі YYYY-MM-DD',
      });
    }

    const subdivisionCase = `
      CASE
        WHEN lower(COALESCE(subdivisionType, '')) LIKE '%територ%'
          THEN 'territorial'
        ELSE 'apparatus'
      END
    `;

    const [ktziDocuments, classAComplianceDocuments] = await Promise.all([
      queryAll(
        `SELECT documentType, ${subdivisionCase} AS subdivision,
                documentNumber, documentDate
         FROM ktzi
         JOIN ktzi_documents ON ktzi_documents.ktziId = ktzi.id
         WHERE documentType IN (
           'technicalTask',
           'atestation',
           'Акт завершення робіт',
           'Декларація про відповідність вимогам нормативних документів',
           'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки',
           'Атестат відповідності'
         )
           AND documentDate BETWEEN ? AND ?
         `,
        [dateFrom, dateTo],
      ),
      queryAll(
        `SELECT docs.documentType, ${subdivisionCase} AS subdivision,
                docs.dsszzіNumber AS documentNumber,
                docs.dsszzіDate AS documentDate
         FROM class_a_systems_compliance_documents docs
         JOIN class_a_systems cas ON docs.systemId = cas.id
         WHERE docs.dsszzіDate BETWEEN ? AND ?`,
        [dateFrom, dateTo],
      ),
    ]);

    const reportTypeByStoredType = {
      'Акт завершення робіт': 'completionAct',
      'Акт про завершення робіт': 'completionAct',
      'Декларація про відповідність вимогам нормативних документів':
        'declaration',
      'Повідомлення про включення автоматизованої системи до переліку авторизованих систем з безпеки':
        'authorizationNotice',
      'Повідомлення про включення АС до переліку авторизованих систем безпеки':
        'authorizationNotice',
      'Атестат відповідності': 'certificate',
    };
    const counts = new Map();
    const documentKeys = new Set();
    const addCounts = (rows) => {
      rows.forEach((row) => {
        const documentType =
          row.documentType === 'technicalTask'
            ? 'technicalTask'
            : row.documentType === 'atestation'
              ? 'atestation'
              : reportTypeByStoredType[row.documentType];
        if (!documentType) return;

        const documentKey = [
          documentType,
          row.subdivision,
          row.documentNumber || '',
          row.documentDate || '',
        ].join('|');
        if (documentKeys.has(documentKey)) return;
        documentKeys.add(documentKey);

        const countKey = `${documentType}:${row.subdivision}`;
        counts.set(
          countKey,
          (counts.get(countKey) || 0) + 1,
        );
      });
    };

    addCounts(ktziDocuments);
    addCounts(classAComplianceDocuments);

    const getCount = (documentType, subdivision) =>
      counts.get(`${documentType}:${subdivision}`) || 0;
    const documentTypes = [
      ['technicalTask', 'Технічні завдання, погоджені з ДРТЗІ НПУ'],
      ['atestation', 'Акти атестації, зареєстровані в ДССЗЗІ України'],
      ['completionAct', 'Акти про завершення робіт, зареєстровані в ДССЗЗІ України'],
      [
        'declaration',
        'Декларації про відповідність вимогам нормативних документів з ТЗІ, зареєстровані в ДССЗЗІ України',
      ],
      [
        'authorizationNotice',
        'Повідомлення про включення АС до переліку авторизованих систем безпеки, зареєстровані в ДССЗЗІ України',
      ],
      ['certificate', 'Атестати відповідності, зареєстровані в ДССЗЗІ України'],
    ];

    const rows = documentTypes.map(([documentType, label], index) => {
      const apparatus = getCount(documentType, 'apparatus');
      const territorial = getCount(documentType, 'territorial');
      return {
        rowNumber: index + 1,
        category: label,
        apparatus,
        territorial,
        total: apparatus + territorial,
      };
    });

    res.json({
      success: true,
      dateFrom,
      dateTo,
      rows,
      totals: {
        apparatus: rows.reduce((sum, row) => sum + row.apparatus, 0),
        territorial: rows.reduce((sum, row) => sum + row.territorial, 0),
        total: rows.reduce((sum, row) => sum + row.total, 0),
      },
    });
  } catch (err) {
    console.error('❌ Error in GET /api/documents-report:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// NPU RESEARCH ENDPOINTS
// ============================================================================

/**
 * GET /api/npu-research - Отримати записи про дослідження НПУ за період
 */
router.get('/npu-research', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;



    let query = 'SELECT * FROM npu_research';
    const params = [];

    if (dateFrom && dateTo) {
      query += ' WHERE (startDate BETWEEN ? AND ? OR endDate BETWEEN ? AND ?)';
      params.push(dateFrom, dateTo, dateFrom, dateTo);
    }

    query += ' ORDER BY startDate ASC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('❌ Error in GET /api/npu-research:', err);
        return res.status(500).json({ error: err.message });
      }

      // Обробка рядків з додаванням номерів
      const rowsWithNumbers = (rows || []).map((row, index) => ({
        ...row,
        rowNumber: index + 1,
      }));

      // Рядок підсумків
      const totalsRow = {
        rowNumber: '∑',
        organName: 'ПІДСУМОК',
        spInstrumental: rowsWithNumbers.reduce(
          (sum, r) => sum + (r.spInstrumental || 0),
          0,
        ),
        specialResearch: rowsWithNumbers.reduce(
          (sum, r) => sum + (r.specialResearch || 0),
          0,
        ),
        peomInstrumental: rowsWithNumbers.reduce(
          (sum, r) => sum + (r.peomInstrumental || 0),
          0,
        ),
        krtInstrumental: rowsWithNumbers.reduce(
          (sum, r) => sum + (r.krtInstrumental || 0),
          0,
        ),
        ksp: rowsWithNumbers.reduce((sum, r) => sum + (r.ksp || 0), 0),
        attestationActs: rowsWithNumbers.reduce(
          (sum, r) => sum + (r.attestationActs || 0),
          0,
        ),
      };

      res.json({
        success: true,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        rows: rowsWithNumbers,
        totals: totalsRow,
      });
    });
  } catch (err) {
    console.error('❌ Error in GET /api/npu-research:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/npu-research - Додати новий запис про дослідження НПУ
 */
router.post('/npu-research', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      organName,
      orderNumber,
      orderDate,
      spInstrumental,
      specialResearch,
      peomInstrumental,
      krtInstrumental,
      ksp,
      attestationActs,
    } = req.body;

    if (!startDate || !endDate || !organName) {
      return res.status(400).json({
        error: "Обов'язкові поля: startDate, endDate, organName",
      });
    }

    db.run(
      `INSERT INTO npu_research (
        startDate, endDate, organName, orderNumber, orderDate,
        spInstrumental, specialResearch, peomInstrumental, krtInstrumental, ksp, attestationActs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        startDate,
        endDate,
        organName,
        orderNumber || null,
        orderDate || null,
        spInstrumental || 0,
        specialResearch || 0,
        peomInstrumental || 0,
        krtInstrumental || 0,
        ksp || 0,
        attestationActs || 0,
      ],
      function (err) {
        if (err) {
          console.error('❌ Error in POST /api/npu-research:', err);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          success: true,
          id: this.lastID,
          message: 'Запис успішно додано',
        });
      },
    );
  } catch (err) {
    console.error('❌ Error in POST /api/npu-research:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/npu-research/:id - Оновити запис про дослідження НПУ
 */
router.put('/npu-research/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      organName,
      orderNumber,
      orderDate,
      spInstrumental,
      specialResearch,
      peomInstrumental,
      krtInstrumental,
      ksp,
      attestationActs,
    } = req.body;

    if (!startDate || !endDate || !organName) {
      return res.status(400).json({
        error: "Обов'язкові поля: startDate, endDate, organName",
      });
    }

    db.run(
      `UPDATE npu_research SET
        startDate = ?, endDate = ?, organName = ?, orderNumber = ?, orderDate = ?,
        spInstrumental = ?, specialResearch = ?, peomInstrumental = ?, krtInstrumental = ?, ksp = ?, attestationActs = ?,
        updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        startDate,
        endDate,
        organName,
        orderNumber || null,
        orderDate || null,
        spInstrumental || 0,
        specialResearch || 0,
        peomInstrumental || 0,
        krtInstrumental || 0,
        ksp || 0,
        attestationActs || 0,
        id,
      ],
      function (err) {
        if (err) {
          console.error('❌ Error in PUT /api/npu-research/:id:', err);
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Запис не знайдено' });
        }

        res.json({
          success: true,
          message: 'Запис успішно оновлено',
        });
      },
    );
  } catch (err) {
    console.error('❌ Error in PUT /api/npu-research/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/npu-research/:id - Видалити запис про дослідження НПУ
 */
router.delete('/npu-research/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.run('DELETE FROM npu_research WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('❌ Error in DELETE /api/npu-research/:id:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Запис не знайдено' });
      }

      res.json({
        success: true,
        message: 'Запис успішно видалено',
      });
    });
  } catch (err) {
    console.error('❌ Error in DELETE /api/npu-research/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// TZI CHECK ENDPOINTS
// ============================================================================

/**
 * GET /api/tzi-check - Отримати записи про перевірки ТЗІ за період
 */
router.get('/tzi-check', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    let query = 'SELECT * FROM tzi_check';
    const params = [];

    if (dateFrom && dateTo) {
      query += ' WHERE (startDate BETWEEN ? AND ? OR endDate BETWEEN ? AND ?)';
      params.push(dateFrom, dateTo, dateFrom, dateTo);
    }

    query += ' ORDER BY startDate ASC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('❌ Error in GET /api/tzi-check:', err);
        return res.status(500).json({ error: err.message });
      }

      // Обробка рядків з додаванням номерів
      const rowsWithNumbers = (rows || []).map((row, index) => ({
        ...row,
        rowNumber: index + 1,
      }));

      // Рядок підсумків
      const totalsRow = {
        rowNumber: '∑',
        organName: 'ПІДСУМОК',
        violationFirstCategory: rowsWithNumbers.reduce(
          (sum, r) => sum + (r.violationFirstCategory || 0),
          0,
        ),
        violationSecondCategory: rowsWithNumbers.reduce(
          (sum, r) => sum + (r.violationSecondCategory || 0),
          0,
        ),
        violationThirdCategory: rowsWithNumbers.reduce(
          (sum, r) => sum + (r.violationThirdCategory || 0),
          0,
        ),
      };

      res.json({
        success: true,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        rows: rowsWithNumbers,
        totals: totalsRow,
      });
    });
  } catch (err) {
    console.error('❌ Error in GET /api/tzi-check:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/tzi-check - Додати новий запис про перевірку ТЗІ
 */
router.post('/tzi-check', async (req, res) => {
  try {
    const {
      checkType,
      checkOrganName,
      organName,
      startDate,
      endDate,
      violationFirstCategory,
      violationSecondCategory,
      violationThirdCategory,
      detailsViolation,
      holdAccountable,
    } = req.body;

    if (!startDate || !endDate || !organName) {
      return res.status(400).json({
        error: "Обов'язкові поля: startDate, endDate, organName",
      });
    }

    db.run(
      `INSERT INTO tzi_check (
      checkType,
      checkOrganName,
      organName,
      startDate,
      endDate,
      violationFirstCategory,
      violationSecondCategory,
      violationThirdCategory,
      detailsViolation,
      holdAccountable
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        checkType || null,
        checkOrganName || null,
        organName,
        startDate,
        endDate,
        violationFirstCategory || 0,
        violationSecondCategory || 0,
        violationThirdCategory || 0,
        detailsViolation || null,
        holdAccountable || null,
      ],
      function (err) {
        if (err) {
          console.error('❌ Error in POST /api/tzi-check:', err);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          success: true,
          id: this.lastID,
          message: 'Запис успішно додано',
        });
      },
    );
  } catch (err) {
    console.error('❌ Error in POST /api/tzi-check:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/tzi-check/:id - Оновити запис про перевірку ТЗІ
 */
router.put('/tzi-check/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      checkType,
      checkOrganName,
      organName,
      startDate,
      endDate,
      violationFirstCategory,
      violationSecondCategory,
      violationThirdCategory,
      detailsViolation,
      holdAccountable,
    } = req.body;

    if (!startDate || !endDate || !organName) {
      return res.status(400).json({
        error: "Обов'язкові поля: organName, startDate, endDate",
      });
    }

    db.run(
      `UPDATE tzi_check SET
        checkType = ?, checkOrganName = ?, organName = ?, startDate = ?, endDate = ?,  violationFirstCategory = ?, violationSecondCategory = ?, violationThirdCategory = ?, detailsViolation = ?, holdAccountable = ?,
        updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        checkType || null,
        checkOrganName || null,
        organName,
        startDate,
        endDate,
        violationFirstCategory || 0,
        violationSecondCategory || 0,
        violationThirdCategory || 0,
        detailsViolation || null,
        holdAccountable || null,
        id,
      ],
      function (err) {
        if (err) {
          console.error('❌ Error in PUT /api/tzi-check/:id:', err);
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Запис не знайдено' });
        }

        res.json({
          success: true,
          message: 'Запис успішно оновлено',
        });
      },
    );
  } catch (err) {
    console.error('❌ Error in PUT /api/tzi-check/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/tzi-check/:id - Видалити запис про перевірку ТЗІ
 */
router.delete('/tzi-check/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.run('DELETE FROM tzi_check WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('❌ Error in DELETE /api/tzi-check/:id:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Запис не знайдено' });
      }

      res.json({
        success: true,
        message: 'Запис успішно видалено',
      });
    });
  } catch (err) {
    console.error('❌ Error in DELETE /api/tzi-check/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// RADIO MONITORING ENDPOINTS
// ============================================================================

const RADIO_MONITORING_TYPES = [
  'контрольованої території під час проведення закритих нарад (бесід)',
  'під час зустрічей іноземних делегацій, груп та окремих іноземців',
  'плановий р/м контрольованої території',
  "приміщень урядового та спеціального зв'язку",
];

function formatUADate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

/**
 * GET /api/radio-monitoring - Отримати записи або звіт щодо радіомоніторингу
 */
router.get('/radio-monitoring', async (req, res) => {
  try {
    const { dateFrom, dateTo, mode } = req.query;

    let query = 'SELECT * FROM radio_monitoring';
    const params = [];

    if (dateFrom && dateTo) {
      query += ' WHERE eventDate BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    }

    query += ' ORDER BY eventDate ASC, id ASC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('❌ Error in GET /api/radio-monitoring:', err);
        return res.status(500).json({ error: err.message });
      }

      const rowsWithNumbers = (rows || []).map((row, index) => {
        const totalMinutes =
          Number(row.durationHours || 0) * 60 +
          Number(row.durationMinutes || 0);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const durationFormatted = `${h} год ${m < 10 ? '0' : ''}${m} хв`;

        return {
          ...row,
          rowNumber: index + 1,
          totalMinutes,
          durationFormatted,
          formattedDate: formatUADate(row.eventDate),
        };
      });

      // Формування 4 рядків звіту за фіксованими видами
      const reportRows = RADIO_MONITORING_TYPES.map((type, index) => {
        const matchingRecords = rowsWithNumbers.filter(
          (r) => r.monitoringType === type,
        );

        const sortedDates = matchingRecords
          .map((r) => r.eventDate)
          .sort()
          .map(formatUADate);

        const totalMinutes = matchingRecords.reduce(
          (sum, r) => sum + r.totalMinutes,
          0,
        );
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const durationFormatted = `${h} год ${m < 10 ? '0' : ''}${m} хв`;

        const datesFormatted =
          matchingRecords.length === 0
            ? '0'
            : `${matchingRecords.length} (${sortedDates.join(', ')})`;

        const uniqueDepts =
          Array.from(
            new Set(
              matchingRecords
                .map((r) => (r.department || '').trim())
                .filter(Boolean),
            ),
          ).join(', ') || '—';

        const uniqueEquipment =
          Array.from(
            new Set(
              matchingRecords
                .map((r) => (r.equipment || '').trim())
                .filter(Boolean),
            ),
          ).join(', ') || '—';

        return {
          rowNumber: index + 1,
          monitoringType: type,
          eventsCount: matchingRecords.length,
          datesFormatted,
          totalMinutes,
          durationFormatted,
          departments: uniqueDepts,
          equipment: uniqueEquipment,
          records: matchingRecords,
        };
      });

      const totalEvents = rowsWithNumbers.length;
      const totalMinutesAll = rowsWithNumbers.reduce(
        (sum, r) => sum + r.totalMinutes,
        0,
      );
      const totalH = Math.floor(totalMinutesAll / 60);
      const totalM = totalMinutesAll % 60;
      const totalDurationFormatted = `${totalH} год ${totalM < 10 ? '0' : ''}${totalM} хв`;

      const totals = {
        rowNumber: '∑',
        monitoringType: 'ПІДСУМОК',
        eventsCount: totalEvents,
        datesFormatted: `${totalEvents}`,
        totalMinutes: totalMinutesAll,
        durationFormatted: totalDurationFormatted,
        departments: '—',
        equipment: '—',
      };

      res.json({
        success: true,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        rows: rowsWithNumbers,
        report: reportRows,
        totals,
      });
    });
  } catch (err) {
    console.error('❌ Error in GET /api/radio-monitoring:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/radio-monitoring - Додати запис про радіомоніторинг
 */
router.post('/radio-monitoring', async (req, res) => {
  try {
    const {
      monitoringType,
      eventDate,
      durationHours,
      durationMinutes,
      department,
      equipment,
    } = req.body;

    if (!monitoringType || !eventDate || !department || !equipment) {
      return res.status(400).json({
        error:
          "Обов'язкові поля: monitoringType, eventDate, department, equipment",
      });
    }

    db.run(
      `INSERT INTO radio_monitoring (
        monitoringType, eventDate, durationHours, durationMinutes, department, equipment
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        monitoringType,
        eventDate,
        parseInt(durationHours, 10) || 0,
        parseInt(durationMinutes, 10) || 0,
        department.trim(),
        equipment.trim(),
      ],
      function (err) {
        if (err) {
          console.error('❌ Error in POST /api/radio-monitoring:', err);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          success: true,
          id: this.lastID,
          message: 'Запис успішно додано',
        });
      },
    );
  } catch (err) {
    console.error('❌ Error in POST /api/radio-monitoring:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/radio-monitoring/:id - Оновити запис про радіомоніторинг
 */
router.put('/radio-monitoring/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      monitoringType,
      eventDate,
      durationHours,
      durationMinutes,
      department,
      equipment,
    } = req.body;

    if (!monitoringType || !eventDate || !department || !equipment) {
      return res.status(400).json({
        error:
          "Обов'язкові поля: monitoringType, eventDate, department, equipment",
      });
    }

    db.run(
      `UPDATE radio_monitoring SET
        monitoringType = ?,
        eventDate = ?,
        durationHours = ?,
        durationMinutes = ?,
        department = ?,
        equipment = ?,
        updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        monitoringType,
        eventDate,
        parseInt(durationHours, 10) || 0,
        parseInt(durationMinutes, 10) || 0,
        department.trim(),
        equipment.trim(),
        id,
      ],
      function (err) {
        if (err) {
          console.error('❌ Error in PUT /api/radio-monitoring/:id:', err);
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Запис не знайдено' });
        }

        res.json({
          success: true,
          message: 'Запис успішно оновлено',
        });
      },
    );
  } catch (err) {
    console.error('❌ Error in PUT /api/radio-monitoring/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/radio-monitoring/:id - Видалити запис про радіомоніторинг
 */
router.delete('/radio-monitoring/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.run('DELETE FROM radio_monitoring WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('❌ Error in DELETE /api/radio-monitoring/:id:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Запис не знайдено' });
      }

      res.json({
        success: true,
        message: 'Запис успішно видалено',
      });
    });
  } catch (err) {
    console.error('❌ Error in DELETE /api/radio-monitoring/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
