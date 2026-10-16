import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const databasePath = path.join(
  await fs.mkdtemp(path.join(os.tmpdir(), 'vazon-ktzi-')),
  'test.sqlite',
);
process.env.VAZON_DB_PATH = databasePath;

const { db } = await import('../database.js');
const {
  attachObjectToKtzi,
  ensureKtzi,
  syncKtziDocuments,
  syncKtziProtectionMeans,
} = await import('./ktzi.js');
const {
  installProtectionMean,
  returnProtectionMeanToInventory,
  aggregateProtectionMeans,
} = await import('./protectionMeansAggregator.js');
const { getObjectWithNested } = await import('./dbHelpers.js');

const run = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.run(query, params, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });

const aggregateMeans = () =>
  new Promise((resolve, reject) => {
    aggregateProtectionMeans({}, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

const get = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) reject(error);
      else resolve(row || null);
    });
  });

const install = (data) =>
  new Promise((resolve, reject) => {
    installProtectionMean(data, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

const returnToInventory = (meanId) =>
  new Promise((resolve, reject) => {
    returnProtectionMeanToInventory(meanId, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

const createRequiredTables = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS class_a_systems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      systemName TEXT,
      systemClass TEXT,
      address TEXT,
      premisesNumber TEXT,
      subdivisionName TEXT,
      subdivisionType TEXT,
      kzzName TEXT,
      ktziId INTEGER
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS class_a_systems_protection_means (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      systemId INTEGER,
      categoryId INTEGER,
      toolType TEXT,
      name TEXT,
      serialNumber TEXT,
      invertarNumber TEXT,
      releaseYear INTEGER,
      manufacturerExploitationTerm TEXT,
      certificateInfo TEXT,
      notes TEXT,
      createdAt TEXT
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS krt (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      systemName TEXT,
      address TEXT,
      premisesNumber TEXT,
      subdivisionName TEXT,
      subdivisionType TEXT,
      ktziId INTEGER
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS service_premises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serviceName TEXT,
      address TEXT,
      premisesNumber TEXT,
      subdivisionName TEXT,
      subdivisionType TEXT,
      ktziId INTEGER
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS protection_means_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoryId INTEGER,
      category TEXT,
      name TEXT,
      serialNumber TEXT,
      invertarNumber TEXT,
      releaseYear INTEGER,
      manufacturerExploitationTerm TEXT,
      certificateInfo TEXT,
      notes TEXT
    )
  `);
};

const seedObject = async (table, values) => {
  const columns = Object.keys(values);
  const result = await run(
    `INSERT INTO ${table} (${columns.join(', ')})
     VALUES (${columns.map(() => '?').join(', ')})`,
    columns.map((column) => values[column]),
  );
  return result.id;
};

before(async () => {
  await createRequiredTables();
});

after(async () => {
  await new Promise((resolve) => db.close(resolve));
  await fs.rm(path.dirname(databasePath), { recursive: true, force: true });
});

describe('KTZI grouping and shared documents', () => {
  it('reuses a KTZI for objects with the same normalized identity', async () => {
    const first = await attachObjectToKtzi('class_a_systems', {
      address: ' вул. Тестова  1 ',
      premisesNumber: ' 101 ',
      subdivisionName: ' Відділ А ',
    });
    const second = await attachObjectToKtzi('krt', {
      address: 'вул. Тестова 1',
      premisesNumber: '101',
      subdivisionName: 'Відділ А',
    });
    const differentRoom = await attachObjectToKtzi('krt', {
      address: 'вул. Тестова 1',
      premisesNumber: '102',
      subdivisionName: 'Відділ А',
    });

    assert.equal(first.ktziId, second.ktziId);
    assert.notEqual(first.ktziId, differentRoom.ktziId);
  });

  it('stores one shared document per KTZI and document type', async () => {
    const ktzi = await ensureKtzi({
      address: 'Документна 1',
      premisesNumber: '201',
      subdivisionName: 'Відділ Б',
    });
    const data = {
      categorizationActNumber: 'АКТ-1',
      categorizationActDate: '2026-01-01',
      categorizationValidUntil: '2027-01-01',
      attestationRegNumber: 'АТ-1',
      attestationRegDate: '2026-02-01',
      attestationValidUntil: '2027-02-01',
    };

    await syncKtziDocuments(ktzi.id, data);
    await syncKtziDocuments(ktzi.id, {
      ...data,
      categorizationActNumber: 'АКТ-2',
    });

    const rows = await new Promise((resolve, reject) => {
      db.all(
        'SELECT documentType, documentNumber FROM ktzi_documents WHERE ktziId = ?',
        [ktzi.id],
        (error, result) => (error ? reject(error) : resolve(result)),
      );
    });
    assert.equal(rows.length, 2);
    assert.equal(
      rows.find((row) => row.documentType === 'categorization').documentNumber,
      'АКТ-2',
    );
  });
});

describe('KTZI protection means', () => {
  it('synchronizes an object protection mean into the canonical KTZI model', async () => {
    const ktzi = await ensureKtzi({
      address: 'Засобова 1',
      premisesNumber: '301',
      subdivisionName: 'Відділ В',
    });
    const objectId = await seedObject('class_a_systems', {
      systemName: 'АС тестова',
      ktziId: ktzi.id,
    });
    await seedObject('class_a_systems_protection_means', {
      systemId: objectId,
      categoryId: 1,
      toolType: 'Фільтр',
      name: 'Засіб 1',
      serialNumber: 'SN-1',
    });

    await syncKtziProtectionMeans('class_a_systems', objectId, ktzi.id);
    const mean = await get(
      'SELECT * FROM protection_means WHERE ktziId = ?',
      [ktzi.id],
    );
    const assignment = await get(
      'SELECT * FROM protection_mean_assignments WHERE protectionMeanId = ?',
      [mean.id],
    );

    assert.equal(mean.name, 'Засіб 1');
    assert.deepEqual(
      { objectType: assignment.objectType, objectId: assignment.objectId },
      { objectType: 'AS', objectId },
    );
  });

  it('installs a protection mean on selected objects of one KTZI', async () => {
    const ktzi = await ensureKtzi({
      address: 'Вибіркова 1',
      premisesNumber: '401',
      subdivisionName: 'Відділ Г',
    });
    const firstObjectId = await seedObject('class_a_systems', {
      systemName: 'АС 1',
      ktziId: ktzi.id,
    });
    const secondObjectId = await seedObject('class_a_systems', {
      systemName: 'АС 2',
      ktziId: ktzi.id,
    });
    const inventoryId = await seedObject('protection_means_inventory', {
      categoryId: 1,
      category: 'Фільтр електроживлення',
      name: 'Засіб 2',
      serialNumber: 'SN-2',
    });

    await install({
      meanId: inventoryId,
      objectId: ktzi.id,
      objectType: 'KTZI',
      category: 'Фільтр електроживлення',
      assignments: [
        { objectType: 'AS', objectId: firstObjectId },
        { objectType: 'AS', objectId: secondObjectId },
      ],
    });

    const assignments = await new Promise((resolve, reject) => {
      db.all(
        `SELECT pma.objectType, pma.objectId
         FROM protection_mean_assignments pma
         JOIN protection_means pm ON pm.id = pma.protectionMeanId
         WHERE pm.ktziId = ?`,
        [ktzi.id],
        (error, rows) => (error ? reject(error) : resolve(rows)),
      );
    });
    assert.equal(assignments.length, 2);
    assert.deepEqual(
      assignments.map((row) => row.objectId).sort((a, b) => a - b),
      [firstObjectId, secondObjectId].sort((a, b) => a - b),
    );
  });

  it('returns target names and locations for shared KTZI assignments', async () => {
    const ktzi = await ensureKtzi({
      address: 'Агрегаційна 1',
      premisesNumber: '451',
      subdivisionName: 'Відділ Є',
      subdivisionType: 'apparatus',
    });
    const asId = await seedObject('class_a_systems', {
      systemName: 'АС агрегована',
      systemClass: '1',
      subdivisionName: 'Відділ Є',
      subdivisionType: 'apparatus',
      premisesNumber: '451',
      ktziId: ktzi.id,
    });
    const krtId = await seedObject('krt', {
      systemName: 'КРТ агрегована',
      subdivisionName: 'Відділ Є',
      subdivisionType: 'apparatus',
      premisesNumber: '451',
      ktziId: ktzi.id,
    });
    const mean = await run(
      `INSERT INTO protection_means
       (ktziId, categoryId, toolType, name, serialNumber, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ktzi.id,
        1,
        'Фільтр електроживлення',
        'Спільний засіб',
        'SN-SHARED',
        'Примітка до засобу',
      ],
    );
    await run(
      `INSERT INTO protection_mean_assignments
       (protectionMeanId, objectType, objectId)
       VALUES (?, ?, ?), (?, ?, ?)`,
      [mean.id, 'AS', asId, mean.id, 'KRT', krtId],
    );

    const objectCard = await getObjectWithNested(
      {
        table: 'class_a_systems',
        foreignKeyName: 'systemId',
        nestedTables: {
          protectionMeans: {
            table: 'class_a_systems_protection_means',
          },
        },
      },
      asId,
    );
    assert.deepEqual(
      objectCard.sharedProtectionMeans.map((item) => item.name),
      ['Спільний засіб'],
    );

    const result = await aggregateMeans();
    const sharedMean = result.items.find((item) => item.name === 'Спільний засіб');

    assert.equal(sharedMean.notes, 'Примітка до засобу');
    assert.deepEqual(
      sharedMean.assignedObjects.map((object) => ({
        objectName: object.objectName,
        objectType: object.objectType,
        premisesNumber: object.premisesNumber,
        subdivisionName: object.subdivisionName,
        departmentType: object.departmentType,
      })),
      [
        {
          objectName: 'АС агрегована',
          objectType: 'AS',
          premisesNumber: '451',
          subdivisionName: 'Відділ Є',
          departmentType: 'apparatus',
        },
        {
          objectName: 'КРТ агрегована',
          objectType: 'KRT',
          premisesNumber: '451',
          subdivisionName: 'Відділ Є',
          departmentType: 'apparatus',
        },
      ],
    );
  });

  it('installs a protection mean on an object without a KTZI', async () => {
    const objectId = await seedObject('class_a_systems', {
      systemName: 'АС без КТЗІ',
    });
    const inventoryId = await seedObject('protection_means_inventory', {
      categoryId: 1,
      category: 'Фільтр електроживлення',
      name: 'Засіб без КТЗІ',
      serialNumber: 'SN-NO-KTZI',
      notes: 'Зберегти примітку',
    });

    const result = await install({
      meanId: inventoryId,
      objectId,
      objectType: 'AS',
      category: 'Фільтр електроживлення',
    });

    const installedMean = await get(
      `SELECT name, serialNumber, notes FROM class_a_systems_protection_means
       WHERE systemId = ?`,
      [objectId],
    );
    assert.equal(result.success, true);
    assert.deepEqual(installedMean, {
      name: 'Засіб без КТЗІ',
      serialNumber: 'SN-NO-KTZI',
      notes: 'Зберегти примітку',
    });
    assert.equal(
      await get('SELECT id FROM protection_means_inventory WHERE id = ?', [
        inventoryId,
      ]),
      null,
    );
  });

  it('rejects an assignment to an object from another KTZI', async () => {
    const firstKtzi = await ensureKtzi({
      address: 'Перший 1',
      premisesNumber: '501',
      subdivisionName: 'Відділ Д',
    });
    const secondKtzi = await ensureKtzi({
      address: 'Другий 1',
      premisesNumber: '502',
      subdivisionName: 'Відділ Д',
    });
    const foreignObjectId = await seedObject('class_a_systems', {
      systemName: 'Чужа АС',
      ktziId: secondKtzi.id,
    });
    const inventoryId = await seedObject('protection_means_inventory', {
      categoryId: 1,
      category: 'Фільтр електроживлення',
      name: 'Засіб 3',
      serialNumber: 'SN-3',
    });

    await assert.rejects(
      install({
        meanId: inventoryId,
        objectId: firstKtzi.id,
        objectType: 'KTZI',
        assignments: [{ objectType: 'AS', objectId: foreignObjectId }],
      }),
      (error) => error.message.includes('іншого КТЗІ') && error.status === 400,
    );
  });

  it('returns the installed mean to inventory and clears its assignments', async () => {
    const ktzi = await ensureKtzi({
      address: 'Видалення 1',
      premisesNumber: '601',
      subdivisionName: 'Відділ Е',
    });
    const mean = await run(
      `INSERT INTO protection_means
       (ktziId, categoryId, name, serialNumber, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [ktzi.id, 1, 'Засіб 4', 'SN-4', 'Вихідна примітка'],
    );
    const objectId = await seedObject('class_a_systems', {
      systemName: 'АС 4',
      ktziId: ktzi.id,
    });
    await run(
      `INSERT INTO protection_mean_assignments
       (protectionMeanId, objectType, objectId)
       VALUES (?, ?, ?)`,
      [mean.id, 'AS', objectId],
    );

    await returnToInventory(mean.id);

    assert.equal(
      await get('SELECT id FROM protection_means WHERE id = ?', [mean.id]),
      null,
    );
    const inventoryMean = await get(
      `SELECT categoryId, category, name, serialNumber, status, notes
       FROM protection_means_inventory WHERE serialNumber = ?`,
      ['SN-4'],
    );
    assert.deepEqual(inventoryMean, {
      categoryId: 1,
      category: 'Інші вироби',
      name: 'Засіб 4',
      serialNumber: 'SN-4',
      status: 'in_stock',
      notes: 'Вихідна примітка\nПовернуто зі встановлення на склад',
    });
  });

});
