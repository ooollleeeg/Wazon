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
} from './utils/dbHelpers.js';
import { db } from './database.js';

const router = express.Router();

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

    console.log(`📥 GET /api/objects/${req.params.type}`);

    // Если есть вложенные таблицы, получить с ними
    if (req.objectConfig.nestedTables) {
      const rows = await getAllObjects(req.objectConfig.table, filters);
      const withNested = await Promise.all(
        rows.map((row) => getObjectWithNested(req.objectConfig, row.id)),
      );
      console.log(`✅ Retrieved ${withNested.length} objects with nested data`);
      return res.json(withNested);
    }

    const rows = await getAllObjects(req.objectConfig.table, filters);
    console.log(`✅ Retrieved ${rows.length} objects`);
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
    console.log(`📥 GET /api/objects/${req.params.type}/${req.params.id}`);

    let row;

    if (req.objectConfig.nestedTables) {
      row = await getObjectWithNested(req.objectConfig, req.params.id);
    } else {
      row = await getObjectById(req.objectConfig.table, req.params.id);
    }

    if (!row) {
      console.log(`⚠️ Object not found`);
      return res.status(404).json({ error: "Об'єкт не знайдено" });
    }
    console.log(`✅ Object retrieved`);
    res.json(row);
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
    console.log(`📝 POST /api/objects/${req.params.type}`);
    console.log(`📦 Payload:`, req.body);

    let result;

    if (req.objectConfig.nestedTables) {
      result = await createObjectWithNested(req.objectConfig, req.body);
    } else {
      result = await createObject(req.objectConfig.table, req.body);
    }

    console.log(`✅ Object created with ID:`, result.id);
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
    console.log(`📝 PUT /api/objects/${req.params.type}/${req.params.id}`);
    console.log(`📦 Payload:`, req.body);

    let result;

    if (req.objectConfig.nestedTables) {
      result = await updateObjectWithNested(
        req.objectConfig,
        req.params.id,
        req.body,
      );
    } else {
      result = await updateObject(
        req.objectConfig.table,
        req.params.id,
        req.body,
      );
    }

    console.log(`✅ Object updated`);
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
    console.log(`🗑️ DELETE /api/objects/${req.params.type}/${req.params.id}`);

    await deleteObject(req.objectConfig.table, req.params.id);

    console.log(`✅ Object deleted`);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error(`❌ Error in DELETE /objects:`, err);
    res.status(500).json({ error: err.message });
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
        console.log('📝 POST /api/protection-means/inventory', req.body);
        createInventoryItem(req.body, (err, result) => {
          if (err) {
            console.error('❌ Error creating inventory item:', err);
            const status = err.status || 500;
            res.status(status).json({ error: err.message });
          } else {
            console.log('✅ Inventory item created');
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
        console.log('✏️ PUT /api/protection-means/inventory/:id', req.body);
        updateInventoryItem(req.params.id, req.body, (err, result) => {
          if (err) {
            console.error('❌ Error updating inventory item:', err);
            const status = err.status || 500;
            res.status(status).json({ error: err.message });
          } else {
            console.log('✅ Inventory item updated');
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
        console.log('🗑️ DELETE /api/protection-means/inventory/:id');
        deleteInventoryItem(req.params.id, (err, result) => {
          if (err) {
            console.error('❌ Error deleting inventory item:', err);
            res.status(500).json({ error: err.message });
          } else {
            console.log('✅ Inventory item deleted');
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
 * Очікує: { categoryId: number, serialNumber?: string }
 * Дублікат = categoryId + serialNumber обидва збігаються, S/N не порожній
 * Возвращает: { isDuplicate: boolean, duplicateAt?: { source, objectName, objectId } }
 */
router.post('/protection-means/check-duplicate', async (req, res) => {
  try {
    const { categoryId, serialNumber } = req.body;

    console.log('🔍 POST /api/protection-means/check-duplicate', {
      categoryId,
      serialNumber,
    });

    if (!categoryId) {
      return res.status(400).json({
        error: "categoryId обов'язковий",
      });
    }

    const result = await checkProtectionMeanDuplicate(
      categoryId,
      serialNumber || '',
    );

    console.log('✅ Check completed:', result);
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
        console.log('🔧 POST /api/protection-means/install', req.body);
        installProtectionMean(req.body, (err, result) => {
          if (err) {
            console.error('❌ Error installing protection mean:', err);
            res.status(500).json({ error: err.message });
          } else {
            console.log('✅ Protection mean installed successfully');
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
            console.log(
              `✅ Fetching verifications for equipment ${equipment.id}`,
            );
            db.all(
              'SELECT * FROM search_control_equipment_verification WHERE equipmentId = ? ORDER BY verificationDate DESC',
              [equipment.id],
              (verifyErr, verifications) => {
                console.log(
                  `  Verifications for ID ${equipment.id}:`,
                  verifications,
                );
                equipmentWithVerifications[index] = {
                  ...equipment,
                  verifications: verifications || [],
                };
                completed++;
                console.log(`  Completed: ${completed}/${rows.length}`);

                if (completed === rows.length) {
                  console.log(
                    '✅ All verifications loaded, returning response',
                  );
                  // Отримати статистику
                  db.all(
                    `SELECT 
                      COUNT(*) as total,
                      SUM(CASE WHEN category = 'Спеціальна пошукова техніка' THEN 1 ELSE 0 END) as specialSearch,
                      SUM(CASE WHEN category = 'Контрольно-вимірювальна техніка' THEN 1 ELSE 0 END) as measurementControl
                    FROM search_control_equipment`,
                    (statsErr, statsRows) => {
                      const stats = statsErr ? null : statsRows[0];
                      console.log(
                        '📤 Response items:',
                        equipmentWithVerifications.length,
                      );
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

    console.log('📝 PUT /search-control-equipment/:id');
    console.log('  Equipment ID:', id);
    console.log('  Body keys:', Object.keys(req.body));
    console.log('  Verifications received:', verifications?.length || 0);

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

  console.log(
    `🔄 Додавання ${newVerifications.length} нових повірок для техніки ID ${equipmentId}`,
  );

  // Якщо немає нових повірок - готово
  if (newVerifications.length === 0) {
    console.log('✅ Нових повірок немає');
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
        } else {
          console.log(`  ✅ Повірка додана (${deviceName})`);
        }

        // Коли всі операції додавання завершені
        if (addedCount === newVerifications.length) {
          if (hasError) {
            callback(new Error('Error adding some verifications'));
          } else {
            console.log(
              `✅ Усі ${newVerifications.length} нові повірки успішно додані`,
            );
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

    console.log('📝 POST /search-control-equipment/:id/verification');
    console.log('  equipmentId:', id);
    console.log('  deviceName:', deviceName, '(type:', typeof deviceName, ')');
    console.log(
      '  serialNumber:',
      serialNumber,
      '(type:',
      typeof serialNumber,
      ')',
    );
    console.log('  certificateRegNumber:', certificateRegNumber);
    console.log('  verificationDate:', verificationDate);
    console.log('  validUntil:', validUntil);
    console.log('  verificationCost:', verificationCost);

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
          console.log(
            '✅ Verification created successfully with ID:',
            this.lastID,
          );
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

export default router;
