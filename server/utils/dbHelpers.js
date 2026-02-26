import db from '../database.js';

/**
 * Динамично создаёт SQL WHERE условие и параметры
 */
export const buildWhereClause = (filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return { clause: '', params: [] };
  }

  const conditions = Object.entries(filters)
    .map(([key]) => `${key} = ?`)
    .join(' AND ');

  const params = Object.values(filters);
  return { clause: ` WHERE ${conditions}`, params };
};

/**
 * Получить все объекты определённого типа
 */
export const getAllObjects = (table, filters = {}) => {
  return new Promise((resolve, reject) => {
    const { clause, params } = buildWhereClause(filters);
    const query = `SELECT * FROM ${table}${clause} ORDER BY createdAt DESC`;

    db.all(query, params, (err, rows) => {
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
    db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

/**
 * Создать новый объект
 */
export const createObject = (table, data) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;

    db.run(query, values, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...data, createdAt: new Date() });
    });
  });
};

/**
 * Обновить объект
 */
export const updateObject = (table, id, data) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(data);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const query = `UPDATE ${table} SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(query, values, function (err) {
      if (err) reject(err);
      else resolve({ id, ...data, updatedAt: new Date() });
    });
  });
};

/**
 * Удалить объект
 */
export const deleteObject = (table, id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve({ deleted: true, id });
    });
  });
};

/**
 * Обновить объект со всеми вложенными данными
 */
export const updateObjectWithNested = (config, id, data) => {
  return new Promise((resolve, reject) => {
    const nestedKeys = Object.keys(config.nestedTables || {});
    const mainData = { ...data };

    nestedKeys.forEach((key) => {
      delete mainData[key];
    });

    const fields = Object.keys(mainData);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = [...Object.values(mainData), id];

    const query = `UPDATE ${config.table} SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(query, values, function (err) {
      if (err) return reject(err);

      let result = { id, ...mainData };

      if (nestedKeys.length === 0) {
        return resolve(result);
      }

      let completed = 0;

      nestedKeys.forEach((nestedKey) => {
        const nestedConfig = config.nestedTables[nestedKey];
        const nestedItems = data[nestedKey] || [];
        // ✅ ИСПОЛЬЗУЕМ foreignKeyName из конфига
        const foreignKeyName =
          config.foreignKeyName || `${config.table.slice(0, -1)}Id`;

        db.run(
          `DELETE FROM ${nestedConfig.table} WHERE ${foreignKeyName} = ?`,
          [id],
          (delErr) => {
            if (delErr) return reject(delErr);

            result[nestedKey] = [];

            if (nestedItems.length === 0) {
              completed++;
              if (completed === nestedKeys.length) {
                resolve(result);
              }
              return;
            }

            let itemCompleted = 0;

            nestedItems.forEach((item) => {
              const nestedFields = Object.keys(item).filter(
                (f) => item[f] !== undefined && f !== 'id',
              );
              const nestedPlaceholders = nestedFields.map(() => '?').join(', ');
              const nestedValues = [...nestedFields.map((f) => item[f]), id];

              const nestedQuery = `INSERT INTO ${nestedConfig.table} (${[...nestedFields, foreignKeyName].join(', ')}) VALUES (${nestedPlaceholders}, ?)`;

              db.run(nestedQuery, nestedValues, function (insertErr) {
                if (!insertErr) {
                  result[nestedKey].push({ id: this.lastID, ...item });
                }
                itemCompleted++;
                if (itemCompleted === nestedItems.length) {
                  completed++;
                  if (completed === nestedKeys.length) {
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
 * Создать объект со всеми вложенными данными
 */
export const createObjectWithNested = (config, data) => {
  return new Promise((resolve, reject) => {
    const nestedKeys = Object.keys(config.nestedTables || {});
    const mainData = { ...data };

    nestedKeys.forEach((key) => {
      delete mainData[key];
    });

    const fields = Object.keys(mainData);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(mainData);

    const query = `INSERT INTO ${config.table} (${fields.join(', ')}) VALUES (${placeholders})`;

    db.run(query, values, function (err) {
      if (err) return reject(err);

      const mainId = this.lastID;
      let result = { id: mainId, ...mainData };

      if (nestedKeys.length === 0) {
        return resolve(result);
      }

      let completed = 0;

      nestedKeys.forEach((nestedKey) => {
        result[nestedKey] = [];
        const nestedConfig = config.nestedTables[nestedKey];
        const nestedItems = data[nestedKey] || [];
        // ✅ ИСПОЛЬЗУЕМ foreignKeyName из конфига
        const foreignKeyName =
          config.foreignKeyName || `${config.table.slice(0, -1)}Id`;

        if (nestedItems.length === 0) {
          completed++;
          if (completed === nestedKeys.length) {
            resolve(result);
          }
          return;
        }

        let itemCompleted = 0;

        nestedItems.forEach((item) => {
          const nestedFields = Object.keys(item).filter(
            (f) => item[f] !== undefined,
          );
          const nestedPlaceholders = nestedFields.map(() => '?').join(', ');
          const nestedValues = [...nestedFields.map((f) => item[f]), mainId];

          const nestedQuery = `INSERT INTO ${nestedConfig.table} (${[...nestedFields, foreignKeyName].join(', ')}) VALUES (${nestedPlaceholders}, ?)`;

          db.run(nestedQuery, nestedValues, function (insertErr) {
            if (!insertErr) {
              result[nestedKey].push({ id: this.lastID, ...item });
            }
            itemCompleted++;
            if (itemCompleted === nestedItems.length) {
              completed++;
              if (completed === nestedKeys.length) {
                resolve(result);
              }
            }
          });
        });
      });
    });
  });
};

/**
 * Получить объект со всеми вложенными данными
 */
export const getObjectWithNested = (config, id) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM ${config.table} WHERE id = ?`,
      [id],
      (err, mainRow) => {
        if (err) return reject(err);
        if (!mainRow) return resolve(null);

        let result = { ...mainRow };
        const nestedKeys = Object.keys(config.nestedTables || {});

        if (nestedKeys.length === 0) {
          return resolve(result);
        }

        let completed = 0;

        nestedKeys.forEach((nestedKey) => {
          const nestedConfig = config.nestedTables[nestedKey];
          // ✅ ИСПОЛЬЗУЕМ foreignKeyName из конфига
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
      },
    );
  });
};

/**
 * Удалить вложенный элемент
 */
export const deleteNestedItem = (table, id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve({ deleted: true, id });
    });
  });
};
