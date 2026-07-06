import { db } from '../database.js';

const getObjectDisplayName = (data) => {
  return (
    data.systemName ||
    data.subdivisionName ||
    data.serviceName ||
    data.premisesNumber ||
    data.systemClass ||
    'об’єкт'
  );
};

const getProtectionMeanKey = (item) => {
  // Don't lowercase - for consistency with database comparisons
  // This is important for Cyrillic text where JavaScript toLowerCase() doesn't work reliably
  const category = (item.category || item.toolType || '').toString().trim();
  const name = (item.name || '').toString().trim();
  const serialNumber = (item.serialNumber || '').toString().trim();
  return `${category}|${name}|${serialNumber}`;
};

const validateProtectionMeansArray = (items, objectName) => {
  const seen = new Set();
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const key = getProtectionMeanKey(item);
    if (!key) continue;
    if (seen.has(key)) {
      const category = item.category || item.toolType || 'Засіб ТЗІ';
      const name = item.name || '—';
      const serial = item.serialNumber || '—';
      const err = new Error(
        `${category} ${name} ${serial} вже встановлений на ${objectName}`,
      );
      err.status = 400;
      throw err;
    }
    seen.add(key);
  }
};

const isProtectionMeansTable = (nestedKey, nestedConfig) => {
  return (
    nestedKey === 'protectionMeans' ||
    nestedConfig?.table?.toString().toLowerCase().endsWith('_protection_means')
  );
};

const getProtectionMeanLookupParams = (item) => {
  // Don't lowercase - SQL will use COLLATE NOCASE for case-insensitive comparison
  // This is important for Cyrillic text where JavaScript toLowerCase() doesn't work reliably
  const category = (item.category || item.toolType || '').toString().trim();
  const name = (item.name || '').toString().trim();
  const serialNumber = (item.serialNumber || '').toString().trim();
  return { category, name, serialNumber };
};

const findExistingProtectionMean = (categoryId, serialNumber) => {
  return new Promise((resolve, reject) => {
    // Duplicate check: categoryId + serialNumber must both match
    // Empty serial number is NOT a match (multiple items can have empty S/N)
    const trimmedSerial = (serialNumber || '').trim();

    if (!trimmedSerial) {
      console.log(
        `  ℹ️  Skipping duplicate check: empty serial number (categoryId=${categoryId})`,
      );
      return resolve(null);
    }

    // NOTE: Do NOT use .toLowerCase() for Cyrillic! JavaScript's toLowerCase() doesn't work properly with Ukrainian characters.
    // Instead, use COLLATE NOCASE in SQL for case-insensitive comparison
    const sql = `
      SELECT 'AS' AS source, pm.systemId AS objectId, a.systemName AS objectName
      FROM class_a_systems_protection_means pm
      JOIN class_a_systems a ON pm.systemId = a.id
      WHERE pm.categoryId = ? AND COALESCE(pm.serialNumber, '') COLLATE NOCASE = ? COLLATE NOCASE
      UNION ALL
      SELECT 'SP' AS source, pm.premisesId AS objectId, sp.subdivisionName AS objectName
      FROM service_premises_protection_means pm
      JOIN service_premises sp ON pm.premisesId = sp.id
      WHERE pm.categoryId = ? AND COALESCE(pm.serialNumber, '') COLLATE NOCASE = ? COLLATE NOCASE
      UNION ALL
      SELECT 'KRT' AS source, pm.krtId AS objectId, k.systemName AS objectName
      FROM krt_protection_means pm
      JOIN krt k ON pm.krtId = k.id
      WHERE pm.categoryId = ? AND COALESCE(pm.serialNumber, '') COLLATE NOCASE = ? COLLATE NOCASE
      UNION ALL
      SELECT 'IKS' AS source, pm.iksId AS objectId, i.systemName AS objectName
      FROM iks_protection_means pm
      JOIN iks i ON pm.iksId = i.id
      WHERE pm.categoryId = ? AND COALESCE(pm.serialNumber, '') COLLATE NOCASE = ? COLLATE NOCASE
      UNION ALL
      SELECT 'Inventory' AS source, NULL AS objectId, 'На складі' AS objectName
      FROM protection_means_inventory pi
      WHERE pi.categoryId = ? AND COALESCE(pi.serialNumber, '') COLLATE NOCASE = ? COLLATE NOCASE
    `;

    const params = [
      categoryId,
      trimmedSerial,
      categoryId,
      trimmedSerial,
      categoryId,
      trimmedSerial,
      categoryId,
      trimmedSerial,
      categoryId,
      trimmedSerial,
    ];

    console.log(
      `  🔎 Checking duplicate: categoryId=${categoryId}, serial="${trimmedSerial}"`,
    );

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error(`    ❌ SQL Error:`, err.message);
        return reject(err);
      }
      console.log(
        `    📊 Query returned ${rows?.length || 0} rows`,
        rows?.length > 0 ? `(${rows[0].source})` : '',
      );
      if (!rows?.length) return resolve(null);
      resolve(rows[0]);
    });
  });
};

const getProtectionMeanSource = (tableName) => {
  const lower = tableName?.toString().toLowerCase();
  // Map main table names to source types
  if (lower === 'class_a_systems') return 'AS';
  if (lower === 'service_premises') return 'SP';
  if (lower === 'krt') return 'KRT';
  if (lower === 'iks') return 'IKS';
  // Fallback for nested table names
  if (lower.includes('class_a_systems')) return 'AS';
  if (lower.includes('service_premises')) return 'SP';
  if (lower.includes('krt')) return 'KRT';
  if (lower.includes('iks')) return 'IKS';
  return null;
};

const validateProtectionMeansAgainstExisting = async (
  nestedItems,
  objectName,
  currentSource,
  currentId,
) => {
  if (!Array.isArray(nestedItems)) return;

  validateProtectionMeansArray(nestedItems, objectName);

  console.log(
    `🔍 validateProtectionMeansAgainstExisting: checking ${nestedItems.length} items for object "${objectName}" (source: ${currentSource}, id: ${currentId})`,
  );

  for (const item of nestedItems) {
    if (!item || typeof item !== 'object') continue;

    // Use categoryId if available, otherwise use category field
    const categoryId = item.categoryId;
    const serialNumber = (item.serialNumber || '').toString().trim();

    console.log(
      `  📍 Checking item: categoryId=${categoryId}, S/N="${serialNumber}"`,
    );

    if (!categoryId) {
      console.log(`  ⏭️  Skipping - missing categoryId`);
      continue;
    }

    // Empty serial number is never a duplicate
    if (!serialNumber) {
      console.log(`  ℹ️  Empty serial number - not checking for duplicates`);
      continue;
    }

    const existing = await findExistingProtectionMean(categoryId, serialNumber);

    console.log(
      `  📡 Query result:`,
      existing
        ? `found on ${existing.objectName} (${existing.source})`
        : 'not found',
    );

    if (
      existing &&
      !(
        currentSource &&
        currentId &&
        existing.source === currentSource &&
        existing.objectId === Number(currentId)
      )
    ) {
      const displayCategory = item.category || 'Засіб ТЗІ';
      const displayName = item.name || '—';
      const displaySerial = item.serialNumber || '—';
      console.log(`  ❌ DUPLICATE FOUND! Throwing error...`);
      const err = new Error(
        `${displayCategory} "${displayName}" (S/N: ${displaySerial}) вже встановлений на "${existing.objectName}"`,
      );
      err.status = 400;
      throw err;
    }
  }
};

/**
 * Получить все объекты из таблицы
 */
export const getAllObjects = (table, filters = {}) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${table} ORDER BY id DESC`;
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

/**
 * Получить один объект по ID
 */
export const getObjectById = (table, id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${table} WHERE id = ?`;
    db.get(query, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
};

/**
 * Создать объект
 */
export const createObject = (table, data) => {
  return new Promise((resolve, reject) => {
    // ✅ ВИДАЛІТЬ id при вставці
    const mainData = { ...data };
    delete mainData.id;

    const fields = Object.keys(mainData);
    const placeholders = fields.map(() => '?').join(',');
    const columns = fields.join(',');
    const values = Object.values(mainData);

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

    db.run(query, values, function (err) {
      if (err) reject(new Error(err.message));
      else resolve({ id: this.lastID, ...mainData });
    });
  });
};

/**
 * Обновити объект
 */
export const updateObject = (table, id, data) => {
  return new Promise((resolve, reject) => {
    // ✅ ВИДАЛІТЬ id з даних
    const updateData = { ...data };
    delete updateData.id;

    const fields = Object.keys(updateData);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = [...Object.values(updateData), id];

    const query = `UPDATE ${table} SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(query, values, function (err) {
      if (err) reject(new Error(err.message));
      else resolve({ id, ...updateData });
    });
  });
};

/**
 * Удалити объект
 */
export const deleteObject = (table, id) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    db.run(query, [id], function (err) {
      if (err) reject(new Error(err.message));
      else resolve({ id, deleted: true });
    });
  });
};

/**
 * Получить объект со всеми вложенными данными
 */
export const getObjectWithNested = (config, id) => {
  return new Promise((resolve, reject) => {
    getObjectById(config.table, id)
      .then((mainRecord) => {
        if (!mainRecord) return resolve(null);

        const result = { ...mainRecord };

        if (!config.nestedTables) {
          return resolve(result);
        }

        let completed = 0;
        const nestedKeys = Object.keys(config.nestedTables);

        nestedKeys.forEach((nestedKey) => {
          const nestedConfig = config.nestedTables[nestedKey];
          const foreignKeyName =
            config.foreignKeyName || `${config.table.slice(0, -1)}Id`;

          db.all(
            `SELECT * FROM ${nestedConfig.table} WHERE ${foreignKeyName} = ?`,
            [id],
            (err, rows) => {
              if (!err) {
                result[nestedKey] = rows || [];
              }
              completed++;
              if (completed === nestedKeys.length) {
                resolve(result);
              }
            },
          );
        });
      })
      .catch(reject);
  });
};

/**
 * Создать объект со всеми вложенными данными
 */
export const createObjectWithNested = (config, data) => {
  return new Promise(async (resolve, reject) => {
    const { table, nestedTables, foreignKeyName } = config;

    // ✅ ВИДАЛІТЬ id і вложені таблиці з основних даних
    const mainData = { ...data };
    delete mainData.id;
    const nestedKeys = Object.keys(nestedTables || {});
    nestedKeys.forEach((key) => delete mainData[key]);

    const fields = Object.keys(mainData);
    const placeholders = fields.map(() => '?').join(',');
    const columns = fields.join(',');
    const values = Object.values(mainData);
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

    console.log(`🔵 Creating in ${table}:`, { columns, values });

    const objectName = getObjectDisplayName(mainData);
    try {
      if (nestedTables && nestedKeys.length > 0) {
        console.log(
          `🔐 Pre-insert validation: checking ${nestedKeys.length} nested table types (table: ${table})`,
        );
        const currentSource = getProtectionMeanSource(table);
        console.log(`  📍 Detected source: ${currentSource}`);
        for (const nestedKey of nestedKeys) {
          const nestedConfig = nestedTables[nestedKey];
          const nestedItems = data[nestedKey];
          console.log(
            `  🗂️  ${nestedKey}: isProtectionMeansTable=${isProtectionMeansTable(nestedKey, nestedConfig)}, isArray=${Array.isArray(nestedItems)}, length=${Array.isArray(nestedItems) ? nestedItems.length : 'N/A'}`,
          );
          if (
            isProtectionMeansTable(nestedKey, nestedConfig) &&
            Array.isArray(nestedItems)
          ) {
            console.log(
              `  🔍 Validating protection means for ${nestedKey} (new object, no ID exclusion)...`,
            );
            await validateProtectionMeansAgainstExisting(
              nestedItems,
              objectName,
              currentSource,
              null,
            );
          }
        }
      }
    } catch (validationError) {
      console.error(
        `❌ PRE-INSERT VALIDATION FAILED:`,
        validationError.message,
      );
      return reject(validationError);
    }

    db.run(query, values, async function (err) {
      if (err) {
        console.error(`❌ Insert error:`, err.message);
        return reject(new Error(err.message));
      }

      const id = this.lastID;
      console.log(`✅ Main record created with ID: ${id}`);

      try {
        // Зберігаємо вложені дані
        if (nestedTables && nestedKeys.length > 0) {
          for (const nestedKey of nestedKeys) {
            const nestedConfig = nestedTables[nestedKey];
            const nestedItems = data[nestedKey];

            if (!Array.isArray(nestedItems)) {
              console.warn(`⚠️ ${nestedKey} is not an array, skipping`);
              continue;
            }

            if (nestedItems.length === 0) {
              continue;
            }

            console.log(`📦 Inserting ${nestedItems.length} ${nestedKey}`);

            for (const item of nestedItems) {
              if (!item || typeof item !== 'object') {
                console.warn(`⚠️ Invalid nested item in ${nestedKey}`, item);
                continue;
              }

              const nestedFields = Object.keys(item).filter(
                (f) => f !== 'id' && item[f] !== undefined && item[f] !== '',
              );

              if (nestedFields.length === 0) {
                console.warn(`⚠️ No valid fields in nested item`, item);
                continue;
              }

              const nestedValues = nestedFields.map((f) => {
                const val = item[f];
                if (val && typeof val === 'object') {
                  return JSON.stringify(val);
                }
                return val ?? null;
              });

              const allFields = [...nestedFields, foreignKeyName];
              const allValues = [...nestedValues, id];
              const nestedPlaceholders = allFields.map(() => '?').join(', ');
              const nestedQuery = `INSERT INTO ${nestedConfig.table} (${allFields.join(', ')}) VALUES (${nestedPlaceholders})`;

              console.log(`  ↳ ${nestedConfig.table}:`, {
                fields: allFields,
                values: allValues,
              });

              await new Promise((resolveNested, rejectNested) => {
                db.run(nestedQuery, allValues, function (nestedErr) {
                  if (nestedErr) {
                    console.error(
                      `❌ Nested insert error (${nestedKey}):`,
                      nestedErr.message,
                    );
                    return rejectNested(nestedErr);
                  }
                  console.log(
                    `✅ ${nestedKey} record created with ID: ${this.lastID}`,
                  );
                  resolveNested();
                });
              });
            }
          }
        }

        console.log(`✅ All nested data inserted successfully`);
        resolve({ id, ...data });
      } catch (nestedErr) {
        console.error(`❌ Nested error:`, nestedErr);
        reject(nestedErr);
      }
    });
  });
};

/**
 * Обновити объект со всеми вложенными данными
 */
export const updateObjectWithNested = (config, id, data) => {
  return new Promise(async (resolve, reject) => {
    const nestedKeys = Object.keys(config.nestedTables || {});
    const mainData = { ...data };

    // ✅ ВИДАЛІТЬ id і вложені ключі
    delete mainData.id;
    nestedKeys.forEach((key) => delete mainData[key]);

    const fields = Object.keys(mainData);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = [...Object.values(mainData), id];
    const query = fields.length
      ? `UPDATE ${config.table} SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      : `UPDATE ${config.table} SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

    console.log(`🔵 Updating in ${config.table}:`, { id, values });

    const objectName = getObjectDisplayName(mainData);
    const currentSource = getProtectionMeanSource(config.table);

    try {
      if (nestedKeys.length > 0) {
        console.log(
          `🔐 PRE-UPDATE VALIDATION: checking ${nestedKeys.length} nested table types (table: ${config.table}, source: ${currentSource}, id: ${id})`,
        );
        for (const nestedKey of nestedKeys) {
          const nestedConfig = config.nestedTables[nestedKey];
          const nestedItems = data[nestedKey] || [];
          console.log(
            `  🗂️  ${nestedKey}: isProtectionMeansTable=${isProtectionMeansTable(nestedKey, nestedConfig)}, length=${nestedItems.length}`,
          );
          if (
            isProtectionMeansTable(nestedKey, nestedConfig) &&
            Array.isArray(nestedItems)
          ) {
            console.log(
              `  🔍 Validating protection means for ${nestedKey} with global check (excluding ${currentSource}#${id})...`,
            );
            await validateProtectionMeansAgainstExisting(
              nestedItems,
              objectName,
              currentSource,
              id,
            );
          }
        }
      }
    } catch (validationError) {
      console.error(
        `❌ PRE-UPDATE VALIDATION FAILED:`,
        validationError.message,
      );
      return reject(validationError);
    }

    db.run(query, values, function (err) {
      if (err) {
        console.error(`❌ Update error:`, err.message);
        return reject(new Error(err.message));
      }

      console.log(`✅ Main record updated`);
      let result = { id, ...mainData };

      if (nestedKeys.length === 0) {
        return resolve(result);
      }

      let completed = 0;

      nestedKeys.forEach((nestedKey) => {
        const nestedConfig = config.nestedTables[nestedKey];
        const nestedItems = data[nestedKey] || [];
        const foreignKeyName =
          config.foreignKeyName || `${config.table.slice(0, -1)}Id`;

        db.run(
          `DELETE FROM ${nestedConfig.table} WHERE ${foreignKeyName} = ?`,
          [id],
          (delErr) => {
            if (delErr) {
              console.error(
                `❌ Delete nested error (${nestedKey}):`,
                delErr.message,
              );
            }

            result[nestedKey] = [];

            if (nestedItems.length === 0) {
              completed++;
              if (completed === nestedKeys.length) {
                console.log(`✅ All nested data updated successfully`);
                resolve(result);
              }
              return;
            }

            let itemCompleted = 0;

            nestedItems.forEach((item) => {
              const nestedFields = Object.keys(item).filter(
                (f) => f !== 'id' && item[f] !== undefined,
              );
              const nestedValues = [
                ...nestedFields.map((f) => {
                  const val = item[f];
                  if (val && typeof val === 'object') {
                    return JSON.stringify(val);
                  }
                  return val ?? null;
                }),
                id,
              ];
              const nestedPlaceholders = nestedFields.map(() => '?').join(', ');
              const nestedQuery = `INSERT INTO ${nestedConfig.table} (${[...nestedFields, foreignKeyName].join(', ')}) VALUES (${nestedPlaceholders}, ?)`;

              db.run(nestedQuery, nestedValues, function (insertErr) {
                if (insertErr) {
                  console.error(
                    `❌ Insert nested error (${nestedKey}):`,
                    insertErr.message,
                  );
                } else {
                  result[nestedKey].push({ id: this.lastID, ...item });
                }
                itemCompleted++;
                if (itemCompleted === nestedItems.length) {
                  completed++;
                  if (completed === nestedKeys.length) {
                    console.log(`✅ All nested data updated successfully`);
                    resolve(result);
                  }
                }
              });
            });
          },
        );
      });
    });
  });
};

/**
 * Удалити вложений елемент
 */
export const deleteNestedItem = (
  nestedTable,
  itemId,
  foreignKeyName,
  parentId,
) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM ${nestedTable} WHERE id = ? AND ${foreignKeyName} = ?`;
    db.run(query, [itemId, parentId], function (err) {
      if (err) reject(new Error(err.message));
      else resolve({ id: itemId, deleted: true });
    });
  });
};

/**
 * Перевірити дублікат засобу ТЗІ
 * Вход: categoryId, name, serialNumber
 * Выход: { isDuplicate: boolean, duplicateAt?: { source, objectName, objectId } }
 */
export const checkProtectionMeanDuplicate = async (
  categoryId,
  serialNumber,
) => {
  try {
    const existing = await findExistingProtectionMean(categoryId, serialNumber);
    if (existing) {
      return {
        isDuplicate: true,
        duplicateAt: {
          source: existing.source,
          objectName: existing.objectName,
          objectId: existing.objectId,
        },
      };
    }
    return { isDuplicate: false };
  } catch (err) {
    console.error('❌ Error checking duplicate:', err.message);
    throw err;
  }
};
