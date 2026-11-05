import { db } from '../database.js';
import { checkProtectionMeanDuplicate } from './dbHelpers.js';

/**
 * Агреговане отримання всіх засобів ТЗІ з усіх джерел
 * Джерела: АС, СП, КРТ, ІКС, та таблиця на складі
 */
export function aggregateProtectionMeans(filters = {}, callback) {
  const { category, status, departmentType, search } = filters;
  const allMeans = [];
  let completedQueries = 0;
  const totalQueries = 4; // ІКС + КЗЗ від НСД + КТЗІ + склад

  // Хелпер функція для застосування фільтрів
  const applyFilters = (item) => {
    if (category && item.category !== category) return false;
    if (status && item.status !== status) return false;
    if (departmentType && item.departmentType !== departmentType) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        item.name?.toLowerCase().includes(searchLower) ||
        item.objectName?.toLowerCase().includes(searchLower) ||
        item.serialNumber?.toLowerCase().includes(searchLower) ||
        item.invertarNumber?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.certificateInfo?.toLowerCase().includes(searchLower) ||
        item.releaseYear?.toString().includes(searchLower) ||
        item.manufacturerExploitationTerm?.toString().includes(searchLower) ||
        item.inStockDate?.toString().includes(searchLower) ||
        item.notes?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  };

  // Функція для обробки завершення всіх запитів
  const checkCompletion = () => {
    completedQueries++;
    if (completedQueries === totalQueries) {
      // Сортування та фільтрація
      const filtered = allMeans.filter(applyFilters);
      const installedByIdentity = new Map();
      const uniqueMeans = [];

      filtered.forEach((item) => {
        if (item.status !== 'installed' || !item.ktziId) {
          uniqueMeans.push(item);
          return;
        }

        const physicalId = String(
          item.serialNumber || item.invertarNumber || '',
        )
          .trim()
          .toLocaleLowerCase('uk-UA');

        if (!physicalId) {
          uniqueMeans.push(item);
          return;
        }

        const key = `${item.ktziId}|${item.category}|${physicalId}`;
        const existing = installedByIdentity.get(key);
        const assignment = {
          objectId: item.objectId,
          objectName: item.objectName,
          objectType: item.objectType,
          objectAddress: item.objectAddress,
        };
        const assignments = item.assignedObjects?.length
          ? item.assignedObjects
          : [assignment];

        if (existing) {
          assignments.forEach((candidate) => {
            const alreadyAssigned = existing.assignedObjects.some(
              (current) =>
                String(current.objectId) === String(candidate.objectId) &&
                current.objectType === candidate.objectType,
            );
            if (!alreadyAssigned) existing.assignedObjects.push(candidate);
          });
          // The canonical KTZI record is the one used by assignment APIs.
          // Object-level rows can have a different ID for the same physical mean.
          if (item.objectType === 'KTZI') {
            existing.id = item.id;
          }
          return;
        }

        const uniqueItem = {
          ...item,
          assignedObjects: assignments,
        };
        installedByIdentity.set(key, uniqueItem);
        uniqueMeans.push(uniqueItem);
      });
      const categoryCounts = {};

      uniqueMeans.forEach((item) => {
        categoryCounts[item.category] =
          (categoryCounts[item.category] || 0) + 1;
      });

      callback(null, {
        items: uniqueMeans,
        stats: {
          total: uniqueMeans.length,
          installed: uniqueMeans.filter((m) => m.status === 'installed').length,
          inStock: uniqueMeans.filter((m) => m.status === 'in_stock').length,
          byCategory: categoryCounts,
        },
      });
    }
  };

  // 4️⃣ ІКС - protectionMeans
  db.all(
    `
    SELECT 
      i.id as objectId,
      i.systemName as objectName,
      null as objectAddress,
      i.subdivisionName,
      null as premisesNumber,
      i.subdivisionType as departmentType,
      'IKS' as objectType,
      pm.id as id,
      COALESCE(pm.toolType, 'Засоби захисту') as category,
      pm.name,
      pm.serialNumber,
      pm.invertarNumber,
      pm.releaseYear,
      pm.manufacturerExploitationTerm,
      pm.certificateInfo,
      pm.notes,
      'installed' as status,
      pm.createdAt
    FROM iks_protection_means pm
    JOIN iks i ON pm.iksId = i.id
    `,
    (err, rows) => {
      if (!err && rows) {
        allMeans.push(
          ...rows.map((row) => ({
            ...row,
            category: row.category || 'Інші вироби',
          })),
        );
      }
      checkCompletion();
    },
  );

  // 5️⃣ КЗЗ від НСД (з АС та ІКС)
  db.all(
    `
    SELECT 
      a.id as objectId,
      a.systemName as objectName,
      a.address as objectAddress,
      a.subdivisionName,
      a.premisesNumber,
      a.subdivisionType as departmentType,
      'AS' as objectType,
      COALESCE(a.systemClass, 'АС класу ?') as systemClass,
      'КЗЗ від НСД' as category,
      a.kzzName as name,
      a.kzzSerial as serialNumber,
      NULL as invertarNumber,
      NULL as releaseYear,
      a.kzzManufacturerExploitationTerm as manufacturerExploitationTerm,
      NULL as certificateInfo,
      a.kzzNotes as notes,
      'installed' as status,
      a.createdAt,
      ('AS-' || a.id || '-kzz') as id
    FROM class_a_systems a
    WHERE a.kzzName IS NOT NULL AND a.kzzName != ''
    
    UNION ALL
    
    SELECT 
      i.id as objectId,
      i.systemName as objectName,
      null as objectAddress,
      i.subdivisionName,
      null as premisesNumber,
      i.subdivisionType as departmentType,
      'IKS' as objectType,
      NULL as systemClass,
      'КЗЗ від НСД' as category,
      i.kzzName as name,
      i.kzzSerial as serialNumber,
      NULL as invertarNumber,
      NULL as releaseYear,
      i.kzzManufacturerExploitationTerm as manufacturerExploitationTerm,
      NULL as certificateInfo,
      i.kzzNotes as notes,
      'installed' as status,
      i.createdAt,
      ('IKS-' || i.id || '-kzz') as id
    FROM iks i
    WHERE i.kzzName IS NOT NULL AND i.kzzName != ''
    `,
    (err, rows) => {
      if (!err && rows) {
        allMeans.push(...rows);
      }
      checkCompletion();
    },
  );

  // 6️⃣ Засоби, встановлені на весь КТЗІ
  db.all(
    `
    SELECT
      pm.ktziId as objectId,
      ('КТЗІ: ' || COALESCE(k.address, 'Без адреси') || ', каб. ' ||
        COALESCE(k.premisesNumber, '—') || ' — ' ||
        COALESCE(k.subdivisionName, 'Без підрозділу')) as objectName,
      k.address as objectAddress,
      'ktzi' as departmentType,
      pm.ktziId,
      k.address as ktziAddress,
      k.premisesNumber as ktziPremisesNumber,
      k.subdivisionName as ktziSubdivisionName,
      'KTZI' as objectType,
      pm.id,
      pm.toolType as category,
      pm.name,
      pm.serialNumber,
      pm.invertarNumber,
      pm.releaseYear,
      pm.manufacturerExploitationTerm,
      pm.certificateInfo,
      pm.notes,
      'installed' as status,
      pm.createdAt
    FROM protection_means pm
    JOIN ktzi k ON k.id = pm.ktziId
    `,
    (err, rows) => {
      if (!err && rows) {
        allMeans.push(
          ...rows.map((row) => ({
            ...row,
            category: row.category || 'Інші вироби',
          })),
        );
      }
      checkCompletion();
    },
  );

  // 7️⃣ Засоби на складі (protection_means_inventory)
  db.all(
    `
    SELECT 
      NULL as objectId,
      'На складі' as objectName,
      NULL as objectAddress,
      'in_warehouse' as departmentType,
      'INVENTORY' as objectType,
      id,
      category,
      name,
      serialNumber,
      invertarNumber,
      releaseYear,
      manufacturerExploitationTerm,
      certificateInfo,
      inStockDate,
      notes,
      status,
      createdAt
    FROM protection_means_inventory
    `,
    (err, rows) => {
      if (!err && rows) {
        allMeans.push(...rows);
      }
      checkCompletion();
    },
  );
}

/**
 * Створити новий запис засобу на складі
 * ЦЕНТРАЛІЗОВАНА ПЕРЕВІРКА ДУБЛІВ ЧЕРЕЗ dbHelpers.js
 */
export function createInventoryItem(data, callback) {
  const {
    category,
    name,
    serialNumber,
    invertarNumber,
    releaseYear,
    manufacturerExploitationTerm,
    certificateInfo,
    inStockDate,
    notes,
  } = data;

  // Get categoryId first
  const categoryId = getCategoryIdFromCategory(category);
  if (!categoryId) {
    const err = new Error(`Невідома категорія: ${category}`);
    err.status = 400;
    return callback(err);
  }

  // Централізована перевірка дублів: тільки categoryId + serialNumber
  checkProtectionMeanDuplicate(categoryId, serialNumber)
    .then((result) => {
      if (result.isDuplicate && result.duplicateAt) {
        const duplicateLocation =
          result.duplicateAt.source === 'Inventory'
            ? 'вже перебуває на складі'
            : `вже встановлений на "${result.duplicateAt.objectName || "невідомому об'єкті"}"`;
        const displayCategory = category || 'Засіб ТЗІ';
        const displaySerial = serialNumber || '—';
        const message = `${displayCategory} "${name}" (S/N: ${displaySerial}) ${duplicateLocation}`;
        const duplicateError = new Error(message);
        duplicateError.status = 400;
        duplicateError.duplicateLocations = result.duplicateLocations;
        return callback(duplicateError);
      }

      // Якщо дублю немає - зберігаємо
      const sql = `
        INSERT INTO protection_means_inventory 
        (categoryId, category, name, serialNumber, invertarNumber, releaseYear, manufacturerExploitationTerm, certificateInfo, inStockDate, notes, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      db.run(
        sql,
        [
          categoryId,
          category,
          name,
          serialNumber,
          invertarNumber,
          releaseYear,
          manufacturerExploitationTerm,
          certificateInfo,
          inStockDate,
          notes,
          'in_stock',
        ],
        function (err) {
          if (err) {
            callback(err);
          } else {
            callback(null, { id: this.lastID, ...data });
          }
        },
      );
    })
    .catch((err) => {
      console.error('❌ Error checking duplicate:', err);
      callback(err);
    });
}

/**
 * Оновити запис засобу на складі
 * ЦЕНТРАЛІЗОВАНА ПЕРЕВІРКА ДУБЛІВ ЧЕРЕЗ dbHelpers.js
 */
export function updateInventoryItem(id, data, callback) {
  const {
    category,
    name,
    serialNumber,
    invertarNumber,
    releaseYear,
    manufacturerExploitationTerm,
    certificateInfo,
    inStockDate,
    notes,
    status,
  } = data;

  // Get categoryId first
  const categoryId = getCategoryIdFromCategory(category);
  if (!categoryId) {
    const err = new Error(`Невідома категорія: ${category}`);
    err.status = 400;
    return callback(err);
  }

  // Централізована перевірка дублів: тільки categoryId + serialNumber
  checkProtectionMeanDuplicate(categoryId, serialNumber, id)
    .then((result) => {
      // Дозволяємо дублікат, якщо це той самий запис (id)
      if (result.isDuplicate && result.duplicateAt) {
        const duplicateLocation =
          result.duplicateAt.source === 'Inventory'
            ? 'вже перебуває на складі'
            : `вже встановлений на "${result.duplicateAt.objectName || "невідомому об'єкті"}"`;
        const displayCategory = category || 'Засіб ТЗІ';
        const displaySerial = serialNumber || '—';
        const message = `${displayCategory} "${name}" (S/N: ${displaySerial}) ${duplicateLocation}`;
        const duplicateError = new Error(message);
        duplicateError.status = 400;
        duplicateError.duplicateLocations = result.duplicateLocations;
        return callback(duplicateError);
      }

      // Якщо дублю немає - оновлюємо
      const sql = `
        UPDATE protection_means_inventory
        SET categoryId = ?, category = ?, name = ?, serialNumber = ?, invertarNumber = ?, releaseYear = ?, manufacturerExploitationTerm = ?, certificateInfo = ?, inStockDate = ?, notes = ?, status = ?, updatedAt = datetime('now')
        WHERE id = ?
      `;

      db.run(
        sql,
        [
          categoryId,
          category,
          name,
          serialNumber,
          invertarNumber,
          releaseYear,
          manufacturerExploitationTerm,
          certificateInfo,
          inStockDate,
          notes,
          status,
          id,
        ],
        function (err) {
          if (err) {
            callback(err);
          } else {
            callback(null, { id, ...data });
          }
        },
      );
    })
    .catch((err) => {
      console.error('❌ Error checking duplicate:', err);
      callback(err);
    });
}

/**
 * Видалити запис засобу зі складу
 */
export function deleteInventoryItem(id, callback) {
  db.run(
    'DELETE FROM protection_means_inventory WHERE id = ?',
    [id],
    function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null, { success: true, id });
      }
    },
  );
}

/**
 * Повернути встановлений засіб ТЗІ на склад і видалити всі його прив’язки.
 */
function returnSourceMeanToInventory(
  sourceTable,
  foreignKey,
  sourceId,
  objectId,
  identity,
  callback,
) {
  db.get(
    `SELECT id, categoryId, toolType, name, serialNumber, invertarNumber,
      releaseYear, manufacturerExploitationTerm, certificateInfo, notes
     FROM ${sourceTable}
     WHERE ${foreignKey} = ?
       AND (
         id = ?
         OR (
           name = ?
           AND COALESCE(serialNumber, '') = COALESCE(?, '')
           AND COALESCE(invertarNumber, '') = COALESCE(?, '')
         )
       )`,
    [
      objectId,
      sourceId,
      identity?.name,
      identity?.serialNumber,
      identity?.invertarNumber,
    ],
    (selectError, mean) => {
      if (selectError) return callback(selectError);
      if (!mean) {
        const error = new Error('Засіб ТЗІ не знайдений');
        error.status = 404;
        return callback(error);
      }

      db.run(
        `INSERT INTO protection_means_inventory
          (categoryId, category, name, serialNumber, invertarNumber,
           releaseYear, manufacturerExploitationTerm, certificateInfo,
           status, inStockDate, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', date('now'),
           ?, datetime('now'), datetime('now'))`,
        [
          mean.categoryId,
          mean.toolType || 'Інші вироби',
          mean.name,
          mean.serialNumber,
          mean.invertarNumber,
          mean.releaseYear,
          mean.manufacturerExploitationTerm,
          mean.certificateInfo,
          mean.notes
            ? `${mean.notes}\nПовернуто зі встановлення на склад`
            : 'Повернуто зі встановлення на склад',
        ],
        (insertError) => {
          if (insertError) return callback(insertError);

          db.run(
            `DELETE FROM ${sourceTable} WHERE id = ? AND ${foreignKey} = ?`,
            [mean.id, objectId],
            (deleteError) => {
              if (deleteError) return callback(deleteError);
              callback(null, {
                success: true,
                protectionMeanId: sourceId,
                message: 'Засіб ТЗІ повернуто на склад',
              });
            },
          );
        },
      );
    },
  );
}

export function returnProtectionMeanToInventory(
  protectionMeanId,
  assignment,
  callback,
) {
  if (typeof assignment === 'function') {
    callback = assignment;
    assignment = {};
  }

  db.get(
    `SELECT categoryId, toolType, name, serialNumber, invertarNumber,
      releaseYear, manufacturerExploitationTerm, certificateInfo, notes
     FROM protection_means WHERE id = ?`,
    [protectionMeanId],
    (selectError, mean) => {
      if (selectError) return callback(selectError);
      if (!mean) {
        if (assignment?.objectType !== 'IKS' || !assignment?.objectId) {
          const error = new Error('Засіб ТЗІ не знайдений');
          error.status = 404;
          return callback(error);
        }

        return returnSourceMeanToInventory(
          'iks_protection_means',
          'iksId',
          protectionMeanId,
          assignment.objectId,
          assignment,
          callback,
        );
      }

      db.run(
        `INSERT INTO protection_means_inventory
          (categoryId, category, name, serialNumber, invertarNumber,
           releaseYear, manufacturerExploitationTerm, certificateInfo,
           status, inStockDate, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', date('now'),
           ?, datetime('now'), datetime('now'))`,
        [
          mean.categoryId,
          mean.toolType || 'Інші вироби',
          mean.name,
          mean.serialNumber,
          mean.invertarNumber,
          mean.releaseYear,
          mean.manufacturerExploitationTerm,
          mean.certificateInfo,
          mean.notes
            ? `${mean.notes}\nПовернуто зі встановлення на склад`
            : 'Повернуто зі встановлення на склад',
        ],
        (insertError) => {
          if (insertError) return callback(insertError);

          db.run(
            'DELETE FROM protection_means WHERE id = ?',
            [protectionMeanId],
            (deleteError) => {
              if (deleteError) return callback(deleteError);
              callback(null, {
                success: true,
                protectionMeanId,
                message: 'Засіб ТЗІ повернуто на склад',
              });
            },
          );
        },
      );
    },
  );
}

/**
 * Допоміжна функція для отримання categoryId за назвою категорії
 */
function getCategoryIdFromCategory(categoryName) {
  const categories = [
    { id: 1, name: 'Генератор радіочастотного зашумлення' },
    { id: 2, name: 'Фільтр електроживлення' },
    { id: 3, name: 'Мережевий трансформатор' },
    { id: 4, name: 'Генератор акустичного зашумлення' },
    { id: 5, name: 'Віброперетворювач' },
    { id: 6, name: 'Акустичний випромінювач' },
    { id: 7, name: 'Виріб типу "SRC-300"' },
    { id: 8, name: 'КЗЗ від НСД' },
    { id: 9, name: 'Інші вироби' },
  ];
  const cat = categories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
  );
  return cat ? cat.id : null;
}

/**
 * Встановити засіб ТЗІ з складу на КТЗІ (або КЗЗ від НСД / засіб ІКС на об'єкт)
 */
export function installProtectionMean(data, callback) {
  const { meanId, objectId, objectType, category } = data;

  // Перевірити вхідні дані
  if (!meanId || !objectId || !objectType) {
    const error = new Error("meanId, objectId, та objectType є обов'язковими");
    error.status = 400;
    return callback(error);
  }

  // 1. Спочатку отримати засіб з складу
  db.get(
    'SELECT * FROM protection_means_inventory WHERE id = ?',
    [meanId],
    (err, mean) => {
      if (err) {
        return callback(new Error(`Помилка при запиті засобу: ${err.message}`));
      }

      if (!mean) {
        const error = new Error('Засіб на складі не знайдений');
        error.status = 404;
        return callback(error);
      }

      // Визначити категорію засобу (використовуємо з параметру або з запису)
      const meanCategory = category || mean.category;

      // Спеціальна обробка для КЗЗ від НСД - перевіримо, чи вже встановлено
      if (meanCategory === 'КЗЗ від НСД') {
        let checkQuery;
        if (objectType === 'AS') {
          checkQuery = 'SELECT kzzName FROM class_a_systems WHERE id = ?';
        } else if (objectType === 'IKS') {
          checkQuery = 'SELECT kzzName FROM iks WHERE id = ?';
        }

        if (checkQuery) {
          db.get(checkQuery, [objectId], (err, existingObj) => {
            if (err) {
              return callback(
                new Error(
                  `Помилка при перевірці наявності КЗЗ: ${err.message}`,
                ),
              );
            }

            // Якщо вже встановлено КЗЗ від НСД, не дозволяємо встановлення нового
            if (
              existingObj &&
              existingObj.kzzName &&
              existingObj.kzzName.trim()
            ) {
              return callback(
                new Error(
                  "На цьому об'єкті вже встановлено Комплекс засобів захисту від несанкціонованого доступу. Може бути встановлено лише один КЗЗ від НСД на об'єкт.",
                ),
              );
            }

            // Якщо ОК, продовжуємо встановлення КЗЗ від НСД
            proceedWithInstall();
          });
          return;
        }
      }

      if (meanCategory === 'КЗЗ від НСД') {
        proceedWithInstall();
      } else {
        checkProtectionMeanDuplicate(
          mean.categoryId,
          mean.serialNumber,
          meanId,
        )
          .then((duplicateCheck) => {
            if (duplicateCheck.isDuplicate) {
              const error = new Error(
                'Цей засіб ТЗІ вже перебуває на складі або встановлений на іншому об’єкті',
              );
              error.status = 409;
              error.duplicateLocations =
                duplicateCheck.duplicateLocations ||
                (duplicateCheck.duplicateAt
                  ? [duplicateCheck.duplicateAt]
                  : []);
              return callback(error);
            }
            proceedWithInstall();
          })
          .catch(callback);
      }

      function proceedWithInstall() {
        let insertQuery, insertParams;

        // Перевірити чи це КЗЗ від НСД
        if (meanCategory === 'КЗЗ від НСД') {
          // КЗЗ від НСД - оновлення kzzName поле на об'єкті
          switch (objectType) {
            case 'AS': // АС класу 1,2,3
              insertQuery = `
                UPDATE class_a_systems 
                SET kzzName = ?, kzzSerial = ?, kzzExpertOpinionNumber = ?, 
                    kzzExpertOpinionDate = ?, kzzManufacturerExploitationTerm = ?, kzzCategoryId = ?, kzzNotes = ?
                WHERE id = ?
              `;
              insertParams = [
                mean.name,
                mean.serialNumber || '',
                mean.certificateInfo || '',
                mean.releaseYear || '',
                mean.manufacturerExploitationTerm || '',
                mean.categoryId,
                mean.notes || '',
                objectId,
              ];
              break;

            case 'IKS': // ІКС
              insertQuery = `
                UPDATE iks 
                SET kzzName = ?, kzzSerial = ?, kzzExpertOpinionNumber = ?, 
                    kzzExpertOpinionDate = ?, kzzManufacturerExploitationTerm = ?, kzzCategoryId = ?, kzzNotes = ?
                WHERE id = ?
              `;
              insertParams = [
                mean.name,
                mean.serialNumber || '',
                mean.certificateInfo || '',
                mean.releaseYear || '',
                mean.manufacturerExploitationTerm || '',
                mean.categoryId,
                mean.notes || '',
                objectId,
              ];
              break;

            default:
              return callback(
                new Error(
                  `КЗЗ від НСД може бути встановлена лише на AS або IKS`,
                ),
              );
          }
        } else {
          // Звичайні засоби ТЗІ - зберігаємо в таблиці protection_means
          switch (objectType) {
            case 'KTZI':
              insertQuery = `
                INSERT INTO protection_means
                (ktziId, categoryId, toolType, name, serialNumber, invertarNumber,
                 releaseYear, manufacturerExploitationTerm, certificateInfo, notes)
                SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ?
                FROM ktzi
                WHERE id = ?
              `;
              insertParams = [
                mean.categoryId,
                mean.category,
                mean.name,
                mean.serialNumber,
                mean.invertarNumber,
                mean.releaseYear,
                mean.manufacturerExploitationTerm,
                mean.certificateInfo,
                mean.notes,
                objectId,
              ];
              break;
            case 'IKS': // ІКС
              insertQuery = `
                INSERT INTO iks_protection_means 
                (iksId, categoryId, toolType, name, serialNumber, invertarNumber, releaseYear, manufacturerExploitationTerm, certificateInfo, notes, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
              `;
              insertParams = [
                objectId,
                mean.categoryId,
                mean.category,
                mean.name,
                mean.serialNumber,
                mean.invertarNumber,
                mean.releaseYear,
                mean.manufacturerExploitationTerm,
                mean.certificateInfo,
                mean.notes,
              ];
              break;

            default: {
              const error = new Error(
                objectType === 'AS' || objectType === 'SP' || objectType === 'KRT'
                  ? 'Засоби ТЗІ встановлюються лише на рівні КТЗІ'
                  : `Невідомий тип об'єкту: ${objectType}`,
              );
              error.status = 400;
              return callback(error);
            }
          }
        }

        // 3. Вставити або оновити засіб у об'єкті
        db.run(insertQuery, insertParams, function (err) {
          if (err) {
            return callback(
              new Error(`Помилка при встановленні засобу: ${err.message}`),
            );
          }

          // 4. Видалити засіб зі складу (або позначити як встановлено)
          // Видаляємо записи зі складу після встановлення
          db.run(
            'DELETE FROM protection_means_inventory WHERE id = ?',
            [meanId],
            (deleteErr) => {
              if (deleteErr) {
                console.warn(
                  `⚠️ Засіб встановлено але не видалено зі складу: ${deleteErr.message}`,
                );
              }

              const finishInstall = () => {
                callback(null, {
                  success: true,
                  meanId,
                  objectId,
                  objectType,
                  mean,
                  message: `Засіб "${mean.name}" успішно встановлено`,
                });
              };

              finishInstall();
            },
          );
        });
      }
    },
  );
}
