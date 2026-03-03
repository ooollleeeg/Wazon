import { db } from '../database.js';

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
  return new Promise((resolve, reject) => {
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
            let nestedItems = data[nestedKey];

            // ✅ Перевіряємо чи це масив
            if (!Array.isArray(nestedItems)) {
              console.warn(`⚠️ ${nestedKey} is not an array, skipping`);
              continue;
            }

            if (nestedItems.length > 0) {
              console.log(`📦 Inserting ${nestedItems.length} ${nestedKey}`);

              for (const item of nestedItems) {
                // ✅ Пропускаємо порожні або невалідні записи
                if (!item || typeof item !== 'object') {
                  console.warn(`⚠️ Invalid nested item in ${nestedKey}`, item);
                  return;
                }

                const nestedFields = Object.keys(item).filter(
                  (f) => f !== 'id' && item[f] !== undefined,
                );
                const nestedValues = [
                  ...nestedFields.map((f) => {
                    const val = item[f];
                    // ✅ Конвертуємо об'єкти в string
                    if (val && typeof val === 'object') {
                      return JSON.stringify(val);
                    }
                    return val ?? null;
                  }),
                  id,
                ];
                const nestedPlaceholders = nestedFields
                  .map(() => '?')
                  .join(', ');

                const nestedQuery = `INSERT INTO ${nestedConfig.table} (${[...nestedFields, foreignKeyName].join(', ')}) VALUES (${nestedPlaceholders}, ?)`;

                console.log(`  ↳ ${nestedConfig.table}:`, nestedValues);

                db.run(nestedQuery, nestedValues, function (nestedErr) {
                  if (nestedErr) {
                    console.error(
                      `❌ Nested insert error (${nestedKey}):`,
                      nestedErr.message,
                    );
                    return reject(nestedErr);
                  }
                  console.log(
                    `✅ ${nestedKey} record created with ID: ${this.lastID}`,
                  );
                  // resolveNested();
                });
              }
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
  return new Promise((resolve, reject) => {
    const nestedKeys = Object.keys(config.nestedTables || {});
    const mainData = { ...data };

    // ✅ ВИДАЛІТЬ id і вложені ключі
    delete mainData.id;
    nestedKeys.forEach((key) => delete mainData[key]);

    const fields = Object.keys(mainData);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = [...Object.values(mainData), id];

    const query = `UPDATE ${config.table} SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

    console.log(`🔵 Updating in ${config.table}:`, { id, values });

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

        // Видаляємо старі записи
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
                  // ✅ Конвертуємо об'єкти в string
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
