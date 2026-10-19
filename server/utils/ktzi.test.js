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
} = await import('./ktzi.js');
const {
  installProtectionMean,
  returnProtectionMeanToInventory,
  aggregateProtectionMeans,
} = await import('./protectionMeansAggregator.js');

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

const returnToInventory = (meanId, target) =>
  new Promise((resolve, reject) => {
    returnProtectionMeanToInventory(meanId, target, (error, result) => {
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
      kzzSerial TEXT,
      kzzManufacturerExploitationTerm TEXT,
      kzzNotes TEXT,
      createdAt TEXT,
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

describe('Protection means on individual objects', () => {
  it('installs on one object even when it belongs to a KTZI', async () => {
    const ktzi = await ensureKtzi({
      address: 'Засобова 1',
      premisesNumber: '301',
      subdivisionName: 'Відділ В',
    });
    const objectId = await seedObject('class_a_systems', {
      systemName: 'АС у КТЗІ',
      ktziId: ktzi.id,
    });
    const inventoryId = await seedObject('protection_means_inventory', {
      categoryId: 1,
      category: 'Фільтр електроживлення',
      name: 'Засіб на одній АС',
      serialNumber: 'SN-SINGLE-AS',
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
    const aggregated = await aggregateMeans();
    assert.equal(result.success, true);
    assert.deepEqual(installedMean, {
      name: 'Засіб на одній АС',
      serialNumber: 'SN-SINGLE-AS',
      notes: 'Зберегти примітку',
    });
    assert.equal(
      aggregated.items.find((item) => item.serialNumber === 'SN-SINGLE-AS')
        .objectId,
      objectId,
    );
    assert.equal(
      await get('SELECT id FROM protection_means_inventory WHERE id = ?', [
        inventoryId,
      ]),
      null,
    );
  });

  it('returns an object-installed mean to inventory', async () => {
    const ktzi = await ensureKtzi({
      address: 'Видалення 1',
      premisesNumber: '601',
      subdivisionName: 'Відділ Е',
    });
    const objectId = await seedObject('class_a_systems', {
      systemName: 'АС 4',
      ktziId: ktzi.id,
    });
    const mean = await run(
      `INSERT INTO class_a_systems_protection_means
       (systemId, categoryId, toolType, name, serialNumber, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        objectId,
        1,
        'Фільтр електроживлення',
        'Засіб 4',
        'SN-4',
        'Вихідна примітка',
      ],
    );

    await returnToInventory(mean.id, { objectType: 'AS', objectId });

    assert.equal(
      await get(
        'SELECT id FROM class_a_systems_protection_means WHERE id = ?',
        [mean.id],
      ),
      null,
    );
    const inventoryMean = await get(
      `SELECT categoryId, category, name, serialNumber, status, notes
       FROM protection_means_inventory WHERE serialNumber = ?`,
      ['SN-4'],
    );
    assert.deepEqual(inventoryMean, {
      categoryId: 1,
      category: 'Фільтр електроживлення',
      name: 'Засіб 4',
      serialNumber: 'SN-4',
      status: 'in_stock',
      notes: 'Вихідна примітка\nПовернуто зі встановлення на склад',
    });
  });

});
