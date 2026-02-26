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

    // Если есть вложенные таблицы, получить с ними
    if (req.objectConfig.nestedTables) {
      const rows = await getAllObjects(req.objectConfig.table, filters);
      const withNested = await Promise.all(
        rows.map((row) => getObjectWithNested(req.objectConfig, row.id)),
      );
      return res.json(withNested);
    }

    const rows = await getAllObjects(req.objectConfig.table, filters);
    res.json(rows);
  } catch (err) {
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
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/objects/:type - Создать новый объект
 */
router.post(
  '/objects/:type',
  validateObjectType,
  validateFields,
  async (req, res) => {
    try {
      let result;

      if (req.objectConfig.nestedTables) {
        result = await createObjectWithNested(req.objectConfig, req.body);
      } else {
        result = await createObject(req.objectConfig.table, req.body);
      }

      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * PUT /api/objects/:type/:id - Обновить объект
 */
router.put(
  '/objects/:type/:id',
  validateObjectType,
  validateFields,
  async (req, res) => {
    try {
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

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * DELETE /api/objects/:type/:id - Удалить объект
 */
router.delete('/objects/:type/:id', validateObjectType, async (req, res) => {
  try {
    await deleteObject(req.objectConfig.table, req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
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

export default router;
