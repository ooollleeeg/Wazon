import { db } from '../database.js';

/**
 * Агреговане отримання всіх засобів ТЗІ з усіх джерел
 * Джерела: АС, СП, КРТ, ІКС, та таблиця на складі
 */
export function aggregateProtectionMeans(filters = {}, callback) {
  const { category, status, departmentType, search } = filters;
  const allMeans = [];
  let completedQueries = 0;
  const totalQueries = 6; // 5 об'єктів + 1 таблиця на складі

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
        item.serialNumber?.toLowerCase().includes(searchLower)
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
      const categoryCounts = {};

      filtered.forEach((item) => {
        categoryCounts[item.category] =
          (categoryCounts[item.category] || 0) + 1;
      });

      callback(null, {
        items: filtered,
        stats: {
          total: filtered.length,
          installed: filtered.filter((m) => m.status === 'installed').length,
          inStock: filtered.filter((m) => m.status === 'in_stock').length,
          byCategory: categoryCounts,
        },
      });
    }
  };

  // 1️⃣ АС класу 1,2,3 - protectionMeans
  db.all(
    `
    SELECT 
      a.id as objectId,
      a.systemName as objectName,
      a.address as objectAddress,
      a.subdivisionType as departmentType,
      'AS' as objectType,
      pm.id as id,
      pm.toolType as category,
      pm.name,
      pm.serialNumber,
      pm.invertarNumber,
      pm.releaseYear,
      pm.manufacturerExploitationTerm,
      pm.certificateInfo,
      'installed' as status,
      pm.createdAt
    FROM class_a_systems_protection_means pm
    JOIN class_a_systems a ON pm.systemId = a.id
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

  // 2️⃣ Службові приміщення - protectionMeans
  db.all(
    `
    SELECT 
      sp.id as objectId,
      sp.subdivisionName as objectName,
      sp.address as objectAddress,
      sp.subdivisionType as departmentType,
      'SP' as objectType,
      pm.id as id,
      pm.toolType as category,
      pm.name,
      pm.serialNumber,
      pm.invertarNumber,
      pm.releaseYear,
      pm.manufacturerExploitationTerm,
      pm.certificateInfo,
      'installed' as status,
      pm.createdAt
    FROM service_premises_protection_means pm
    JOIN service_premises sp ON pm.premisesId = sp.id
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

  // 3️⃣ КРТ - protectionMeans
  db.all(
    `
    SELECT 
      k.id as objectId,
      k.systemName as objectName,
      k.address as objectAddress,
      k.subdivisionType as departmentType,
      'KRT' as objectType,
      pm.id as id,
      pm.toolType as category,
      pm.name,
      pm.serialNumber,
      pm.invertarNumber,
      pm.releaseYear,
      pm.manufacturerExploitationTerm,
      pm.certificateInfo,
      'installed' as status,
      pm.createdAt
    FROM krt_protection_means pm
    JOIN krt k ON pm.krtId = k.id
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

  // 4️⃣ ІКС - protectionMeans
  db.all(
    `
    SELECT 
      i.id as objectId,
      i.systemName as objectName,
      null as objectAddress,
      'territorial' as departmentType,
      'IKS' as objectType,
      pm.id as id,
      COALESCE(pm.toolType, 'Засоби захисту') as category,
      pm.name,
      pm.serialNumber,
      pm.invertarNumber,
      pm.releaseYear,
      pm.manufacturerExploitationTerm,
      pm.certificateInfo,
      'installed' as status,
      pm.createdAt
    FROM iks_protection_means pm
    JOIN iks i ON pm.iksId = i.id
    `,
    (err, rows) => {
      console.log(`🔵 IKS query result:`, {
        err: err?.message,
        count: rows?.length || 0,
        rows: rows?.slice(0, 2),
      });
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
      a.subdivisionType as departmentType,
      'AS' as objectType,
      'КЗЗ від НСД' as category,
      a.kzzName as name,
      a.kzzSerial as serialNumber,
      NULL as invertarNumber,
      NULL as releaseYear,
      a.kzzManufacturerExploitationTerm as manufacturerExploitationTerm,
      NULL as certificateInfo,
      'installed' as status,
      a.createdAt
    FROM class_a_systems a
    WHERE a.kzzName IS NOT NULL AND a.kzzName != ''
    
    UNION ALL
    
    SELECT 
      i.id as objectId,
      i.systemName as objectName,
      null as objectAddress,
      'territorial' as departmentType,
      'IKS' as objectType,
      'КЗЗ від НСД' as category,
      i.kzzName as name,
      i.kzzSerial as serialNumber,
      NULL as invertarNumber,
      NULL as releaseYear,
      i.kzzManufacturerExploitationTerm as manufacturerExploitationTerm,
      NULL as certificateInfo,
      'installed' as status,
      i.createdAt
    FROM iks i
    WHERE i.kzzName IS NOT NULL AND i.kzzName != ''
    `,
    (err, rows) => {
      console.log(`🔵 КЗЗ від НСД query result:`, {
        err: err?.message,
        count: rows?.length || 0,
      });
      if (!err && rows) {
        allMeans.push(
          ...rows.map((row) => ({
            ...row,
            id: row.objectId + '-' + row.objectType + '-kzz', // унікальний ID для КЗЗ
          })),
        );
      }
      checkCompletion();
    },
  );

  // 6️⃣ Засоби на складі (protection_means_inventory)
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

  const sql = `
    INSERT INTO protection_means_inventory 
    (category, name, serialNumber, invertarNumber, releaseYear, manufacturerExploitationTerm, certificateInfo, inStockDate, notes, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `;

  db.run(
    sql,
    [
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
}

/**
 * Оновити запис засобу на складі
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

  const sql = `
    UPDATE protection_means_inventory
    SET category = ?, name = ?, serialNumber = ?, invertarNumber = ?, releaseYear = ?, manufacturerExploitationTerm = ?, certificateInfo = ?, inStockDate = ?, notes = ?, status = ?, updatedAt = datetime('now')
    WHERE id = ?
  `;

  db.run(
    sql,
    [
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
