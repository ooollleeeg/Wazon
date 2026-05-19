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
} from './utils/dbHelpers.js';

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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
            res.status(500).json({ error: err.message });
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
            res.status(500).json({ error: err.message });
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

export default router;
