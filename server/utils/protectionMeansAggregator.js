import { db } from '../database.js';
import { checkProtectionMeanDuplicate } from './dbHelpers.js';

/**
 * Агреговане отримання всіх засобів ТЗІ з усіх джерел
 * Звичайні засоби беруться з КТЗІ та складу, КЗЗ від НСД — з АС/ІКС.
 */
export function aggregateProtectionMeans(filters = {}, callback) {
  const { category, status, departmentType, search } = filters;
  const allMeans = [];
  let completedQueries = 0;
  let queryError = null;
  const totalQueries = 3; // КЗЗ від НСД + КТЗІ + склад

  const normalizeDepartmentType = (value) => {
    const normalized = String(value || '')
      .trim()
      .toLocaleLowerCase('uk-UA');
    if (normalized === 'apparatus' || normalized.includes('апарат')) {
      return 'apparatus';
    }
    if (normalized === 'territorial' || normalized.includes('територіал')) {
      return 'territorial';
    }
    if (normalized === 'in_warehouse' || normalized.includes('склад')) {
      return 'in_warehouse';
    }
    return value || '';
  };

  // Хелпер функція для застосування фільтрів
  const applyFilters = (item) => {
    if (category && item.category !== category) return false;
    if (status && item.status !== status) return false;
    if (
      departmentType &&
      normalizeDepartmentType(item.departmentType) !== departmentType
    ) {
      return false;
    }
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
  const checkCompletion = (error) => {
    if (error && !queryError) queryError = error;
    completedQueries++;
    if (completedQueries === totalQueries) {
      if (queryError) {
        callback(queryError);
        return;
      }

      // Сортування та фільтрація
      const filtered = allMeans
        .map((item) => ({
          ...item,
          departmentType: normalizeDepartmentType(item.departmentType),
        }))
        .filter(applyFilters);
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

  // КЗЗ від НСД (з АС та ІКС)
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
      a.kzzExpertOpinionDate as releaseYear,
      a.kzzManufacturerExploitationTerm as manufacturerExploitationTerm,
      a.kzzExpertOpinionNumber as certificateInfo,
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
      i.kzzExpertOpinionDate as releaseYear,
      i.kzzManufacturerExploitationTerm as manufacturerExploitationTerm,
      i.kzzExpertOpinionNumber as certificateInfo,
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
      checkCompletion(err);
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
      COALESCE(
        NULLIF(k.subdivisionType, ''),
        (SELECT NULLIF(a.subdivisionType, '')
         FROM class_a_systems a WHERE a.ktziId = k.id LIMIT 1),
        (SELECT NULLIF(r.subdivisionType, '')
         FROM krt r WHERE r.ktziId = k.id LIMIT 1),
        (SELECT NULLIF(s.subdivisionType, '')
         FROM service_premises s WHERE s.ktziId = k.id LIMIT 1),
        ''
      ) as departmentType,
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
      checkCompletion(err);
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
      checkCompletion(err);
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

export function returnProtectionMeanToInventory(
  protectionMeanId,
  assignment,
  callback,
) {
  if (typeof assignment === 'function') {
    callback = assignment;
    assignment = null;
  }

  db.get(
    `SELECT ktziId, categoryId, toolType, name, serialNumber, invertarNumber,
      releaseYear, manufacturerExploitationTerm, certificateInfo, notes
     FROM protection_means WHERE id = ?`,
    [protectionMeanId],
    (selectError, mean) => {
      if (selectError) return callback(selectError);
      if (!mean) {
        const error = new Error('Засіб ТЗІ не знайдений');
        error.status = 404;
        return callback(error);
      }

      if (
        assignment?.objectType !== 'KTZI' ||
        String(assignment.objectId) !== String(mean.ktziId)
      ) {
        const error = new Error('Вкажіть КТЗІ, до якого прив’язаний засіб');
        error.status = 400;
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
 * Встановити звичайний засіб ТЗІ на КТЗІ або КЗЗ від НСД на АС/ІКС
 */
export function installProtectionMean(data, callback) {
  const { meanId, objectId, objectType } = data;

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

      // The inventory record is authoritative; never let the client change a mean's type.
      const meanCategory =
        Number(mean.categoryId) === 8 ||
        (mean.categoryId == null && mean.category === 'КЗЗ від НСД')
          ? 'КЗЗ від НСД'
          : mean.category;

      // Спеціальна обробка для КЗЗ від НСД - перевіримо, чи вже встановлено
      if (meanCategory === 'КЗЗ від НСД') {
        if (!['AS', 'IKS'].includes(objectType)) {
          const error = new Error(
            'КЗЗ від НСД може бути встановлена лише на AS або IKS',
          );
          error.status = 400;
          return callback(error);
        }

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
            if (!existingObj) {
              const error = new Error("Об'єкт для встановлення КЗЗ не знайдено");
              error.status = 404;
              return callback(error);
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
      } else if (objectType !== 'KTZI') {
        const error = new Error(
          'Звичайні засоби ТЗІ встановлюються лише на рівні КТЗІ',
        );
        error.status = 400;
        callback(error);
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

        db.run('BEGIN IMMEDIATE', (beginError) => {
          if (beginError) return callback(beginError);

          const rollback = (error) => {
            db.run('ROLLBACK', (rollbackError) => {
              if (rollbackError) {
                console.error('Failed to rollback protection mean install:', rollbackError);
              }
              callback(error);
            });
          };

          db.run(insertQuery, insertParams, function (err) {
            if (err) {
              return rollback(
                new Error(`Помилка при встановленні засобу: ${err.message}`),
              );
            }
            if (this.changes !== 1) {
              const error = new Error("Об'єкт для встановлення засобу не знайдено");
              error.status = 404;
              return rollback(error);
            }

            db.run(
              'DELETE FROM protection_means_inventory WHERE id = ?',
              [meanId],
              function (deleteError) {
                if (deleteError) return rollback(deleteError);
                if (this.changes !== 1) {
                  return rollback(new Error('Засіб більше не перебуває на складі'));
                }

                db.run('COMMIT', (commitError) => {
                  if (commitError) return rollback(commitError);
                  callback(null, {
                    success: true,
                    meanId,
                    objectId,
                    objectType,
                    mean,
                    message: `Засіб "${mean.name}" успішно встановлено`,
                  });
                });
              },
            );
          });
        });
      }
    },
  );
}
