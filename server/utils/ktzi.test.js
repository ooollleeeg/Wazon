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
  getKtziDocumentData,
  getKtziProtectionMeans,
  saveKtziDocumentData,
  updateKtziMainInfo,
} = await import('./ktzi.js');
const { installProtectionMean, returnProtectionMeanToInventory } =
  await import('./protectionMeansAggregator.js');
const { createObjectWithNested } = await import('./dbHelpers.js');

const run = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.run(query, params, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
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
      passportNumber TEXT,
      passportDate TEXT,
      kspActNumber TEXT,
      kspActDate TEXT,
      kzzName TEXT,
      kzzSerial TEXT,
      kzzManufacturerExploitationTerm TEXT,
      kzzNotes TEXT,
      kzzExpertOpinionNumber TEXT,
      kzzExpertOpinionDate TEXT,
      kzzCategoryId INTEGER,
      createdAt TEXT,
      serviceName TEXT,
      updatedAt TEXT,
      ktziId INTEGER
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS class_a_systems_technical_task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      systemId INTEGER,
      taskDate TEXT,
      taskNumber TEXT,
      taskClearance TEXT
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS class_a_systems_special_check (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      systemId INTEGER,
      checkNumber TEXT,
      checkDate TEXT,
      checkPerformer TEXT,
      checkEventDate TEXT,
      checkPermissionPerformer TEXT
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS krt_special_check (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      krtId INTEGER,
      checkNumber TEXT,
      checkDate TEXT,
      checkPerformer TEXT,
      checkEventDate TEXT,
      checkPermissionPerformer TEXT
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS service_premises_special_check (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      premisesId INTEGER,
      checkNumber TEXT,
      checkDate TEXT,
      checkPerformer TEXT,
      checkEventDate TEXT,
      checkPermissionPerformer TEXT
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
      informationCategory: 'II',
    });
    const second = await attachObjectToKtzi('krt', {
      address: 'вул. Тестова 1',
      premisesNumber: '101',
      subdivisionName: 'Відділ А',
      informationCategory: 'III',
    });
    const differentRoom = await attachObjectToKtzi('krt', {
      address: 'вул. Тестова 1',
      premisesNumber: '102',
      subdivisionName: 'Відділ А',
      informationCategory: 'II',
    });

    assert.equal(first.ktziId, second.ktziId);
    assert.notEqual(first.ktziId, differentRoom.ktziId);
  });

  it('does not create a KTZI for category IV objects', async () => {
    const result = await attachObjectToKtzi('service_premises', {
      address: 'вул. Четверта 4',
      premisesNumber: '4',
      subdivisionName: 'Відділ IV',
      informationCategory: 'IV',
    });

    assert.equal(result.ktziId, null);
    assert.equal(result.address, 'вул. Четверта 4');
    assert.equal(
      await get('SELECT id FROM ktzi WHERE address = ?', ['вул. Четверта 4']),
      null,
    );
  });

  it('takes the main info of an object from its existing KTZI', async () => {
    const ktzi = await ensureKtzi({
      address: 'Головна 1',
      premisesNumber: '10',
      subdivisionName: 'Відділ Основний',
    });

    const result = await attachObjectToKtzi('krt', {
      ktziId: ktzi.id,
      address: 'Інша адреса',
      premisesNumber: '99',
      subdivisionName: 'Інший підрозділ',
      informationCategory: 'II',
    });

    assert.equal(result.ktziId, ktzi.id);
    assert.equal(result.address, 'Головна 1');
    assert.equal(result.premisesNumber, '10');
    assert.equal(result.subdivisionName, 'Відділ Основний');
  });

  it('saves the full set of shared KTZI document fields', async () => {
    const ktzi = await ensureKtzi({
      address: 'Спільна 2',
      premisesNumber: '202',
      subdivisionName: 'Відділ В',
    });
    const input = {
      passport: { passportNumber: 'П-1', passportDate: '2026-03-01' },
      ksp: {
        checkNumber: 'КСП-1',
        checkDate: '2026-03-02',
        checkPerformer: 'Виконавець',
        checkEventDate: '2026-03-03',
        checkPermissionPerformer: 'Дозвіл',
      },
      technicalTask: {
        taskNumber: 'ТЗ-1',
        taskDate: '2026-03-03',
        taskClearance: '2026-03-04',
      },
      categorization: {
        categorizationActNumber: 'КАТ-1',
        categorizationActDate: '2026-03-05',
        categorizationRank: 'II',
      },
      atestation: {
        attestationRegNumber: 'АТ-1',
        attestationRegDate: '2026-03-06',
        attestationDsszziNumber: 'ДС-1',
      },
    };

    await saveKtziDocumentData(ktzi.id, input);
    const { documents } = await getKtziDocumentData(ktzi.id);

    assert.deepEqual(documents.passport, {
      passportNumber: 'П-1',
      passportDate: '2026-03-01',
    });
    assert.deepEqual(documents.ksp, {
      checkNumber: 'КСП-1',
      checkDate: '2026-03-02',
      checkPerformer: 'Виконавець',
      checkEventDate: '2026-03-03',
      checkPermissionPerformer: 'Дозвіл',
    });
    assert.equal(documents.technicalTask.taskDate, '2026-03-03');
    assert.equal(documents.categorization.categorizationRank, 'II');
    assert.equal(documents.atestation.attestationDsszziNumber, 'ДС-1');
  });

  it('imports legacy object documents once and then uses the shared record', async () => {
    const ktzi = await ensureKtzi({
      address: 'Спільна 3',
      premisesNumber: '203',
      subdivisionName: 'Відділ Г',
    });
    const systemId = await seedObject('class_a_systems', {
      systemName: 'АС для міграції',
      address: 'Спільна 3',
      premisesNumber: '203',
      subdivisionName: 'Відділ Г',
      ktziId: ktzi.id,
      passportNumber: 'ПАСП-legacy',
      passportDate: '2026-04-01',
      kspActNumber: 'КСП-legacy',
      kspActDate: '2026-04-02',
    });
    await seedObject('class_a_systems_technical_task', {
      systemId,
      taskNumber: 'ТЗ-legacy',
      taskDate: '2026-04-03',
      taskClearance: '2026-04-04',
    });
    await seedObject('class_a_systems_special_check', {
      systemId,
      checkNumber: 'КСП-legacy',
      checkDate: '2026-04-02',
      checkPerformer: 'Виконавець legacy',
      checkEventDate: '2026-04-05',
      checkPermissionPerformer: 'Дозвіл legacy',
    });

    const { documents: imported } = await getKtziDocumentData(ktzi.id);
    assert.equal(imported.passport.passportNumber, 'ПАСП-legacy');
    assert.equal(imported.ksp.checkNumber, 'КСП-legacy');
    assert.equal(imported.ksp.checkDate, '2026-04-02');
    assert.equal(imported.ksp.checkPerformer, 'Виконавець legacy');
    assert.equal(imported.ksp.checkEventDate, '2026-04-05');
    assert.equal(
      imported.ksp.checkPermissionPerformer,
      'Дозвіл legacy',
    );
    assert.equal(imported.technicalTask.taskDate, '2026-04-03');

    await run(
      'UPDATE class_a_systems_technical_task SET taskNumber = ? WHERE systemId = ?',
      ['ТЗ-змінене', systemId],
    );
    const { documents: shared } = await getKtziDocumentData(ktzi.id);
    assert.equal(shared.technicalTask.taskNumber, 'ТЗ-legacy');
  });

  it('hydrates legacy KSP document aliases to the full special-check fields', async () => {
    const ktzi = await ensureKtzi({
      address: 'Спільна 6',
      premisesNumber: '206',
      subdivisionName: 'Відділ Ж',
    });
    await run(
      `INSERT INTO ktzi_documents
         (ktziId, documentType, documentNumber, documentDate, documentData)
       VALUES (?, 'ksp', ?, ?, ?)`,
      [
        ktzi.id,
        'КСП-json-legacy',
        '2026-06-02',
        JSON.stringify({
          kspActNumber: 'КСП-json-legacy',
          kspActDate: '2026-06-02',
        }),
      ],
    );

    const { documents } = await getKtziDocumentData(ktzi.id);
    assert.deepEqual(documents.ksp, {
      checkNumber: 'КСП-json-legacy',
      checkDate: '2026-06-02',
      checkPerformer: '',
      checkEventDate: '',
      checkPermissionPerformer: '',
    });
  });

  it('does not choose between conflicting legacy documents automatically', async () => {
    const ktzi = await ensureKtzi({
      address: 'Спільна 4',
      premisesNumber: '204',
      subdivisionName: 'Відділ Д',
    });
    const firstSystemId = await seedObject('class_a_systems', {
      systemName: 'АС перша',
      ktziId: ktzi.id,
    });
    const secondSystemId = await seedObject('class_a_systems', {
      systemName: 'АС друга',
      ktziId: ktzi.id,
    });
    await seedObject('class_a_systems_technical_task', {
      systemId: firstSystemId,
      taskNumber: 'ТЗ-А',
      taskDate: '2026-05-01',
    });
    await seedObject('class_a_systems_technical_task', {
      systemId: secondSystemId,
      taskNumber: 'ТЗ-Б',
      taskDate: '2026-05-02',
    });

    const result = await getKtziDocumentData(ktzi.id);
    assert.equal(result.documents.technicalTask, undefined);
    assert.equal(
      result.migrationConflicts.some(
        (conflict) => conflict.documentType === 'technicalTask',
      ),
      true,
    );
    assert.equal(
      await get(
        'SELECT id FROM ktzi_documents WHERE ktziId = ? AND documentType = ?',
        [ktzi.id, 'technicalTask'],
      ),
      null,
    );
  });

  it('surfaces conflicting legacy special checks from objects in one KTZI', async () => {
    const ktzi = await ensureKtzi({
      address: 'Спільна 5',
      premisesNumber: '205',
      subdivisionName: 'Відділ Е',
    });
    const firstSystemId = await seedObject('class_a_systems', {
      systemName: 'АС перевірки перша',
      ktziId: ktzi.id,
    });
    const secondSystemId = await seedObject('class_a_systems', {
      systemName: 'АС перевірки друга',
      ktziId: ktzi.id,
    });
    await seedObject('class_a_systems_special_check', {
      systemId: firstSystemId,
      checkNumber: 'КСП-А',
    });
    await seedObject('class_a_systems_special_check', {
      systemId: secondSystemId,
      checkNumber: 'КСП-Б',
    });

    const result = await getKtziDocumentData(ktzi.id);
    assert.equal(result.documents.ksp, undefined);
    const conflict = result.migrationConflicts.find(
      ({ documentType }) => documentType === 'ksp',
    );
    assert.ok(conflict);
    assert.equal(conflict.candidates.length, 2);
    assert.equal(
      await get(
        'SELECT id FROM ktzi_documents WHERE ktziId = ? AND documentType = ?',
        [ktzi.id, 'ksp'],
      ),
      null,
    );
  });
});

describe('KTZI main info', () => {
  it('updates the KTZI and propagates main info to its objects', async () => {
    const ktzi = await ensureKtzi({
      address: 'Стара 1',
      premisesNumber: '301',
      subdivisionName: 'Відділ Старий',
    });
    const systemId = await seedObject('class_a_systems', {
      systemName: 'АС main',
      ktziId: ktzi.id,
    });
    const krtId = await seedObject('krt', {
      systemName: 'КРТ main',
      subdivisionName: 'Відділ Старий',
      ktziId: ktzi.id,
    });

    const updated = await updateKtziMainInfo(ktzi.id, {
      address: ' Нова 2 ',
      premisesNumber: '302',
      subdivisionName: 'Відділ Новий',
      subdivisionType: 'apparatus',
    });

    assert.equal(updated.address, 'Нова 2');
    assert.equal(updated.premisesNumber, '302');
    for (const [table, id] of [
      ['class_a_systems', systemId],
      ['krt', krtId],
    ]) {
      const row = await get(
        `SELECT address, premisesNumber, subdivisionName, subdivisionType
         FROM ${table} WHERE id = ?`,
        [id],
      );
      assert.deepEqual(row, {
        address: 'Нова 2',
        premisesNumber: '302',
        subdivisionName: 'Відділ Новий',
        subdivisionType: 'apparatus',
      });
    }
  });

  it('rejects main info that duplicates another KTZI', async () => {
    await ensureKtzi({
      address: 'Дубль 1',
      premisesNumber: '1',
      subdivisionName: 'Відділ Дубль',
    });
    const other = await ensureKtzi({
      address: 'Дубль 2',
      premisesNumber: '2',
      subdivisionName: 'Відділ Дубль',
    });

    await assert.rejects(
      updateKtziMainInfo(other.id, {
        address: 'Дубль 1',
        premisesNumber: '1',
        subdivisionName: 'Відділ Дубль',
      }),
      (error) => error.status === 409,
    );
    await assert.rejects(
      updateKtziMainInfo(other.id, { subdivisionName: '  ' }),
      (error) => error.status === 400,
    );
  });
});

describe('KTZI protection means', () => {
  it('installs an inventory mean on a KTZI and returns it to inventory', async () => {
    const ktzi = await ensureKtzi({
      address: 'Засобова 1',
      premisesNumber: '401',
      subdivisionName: 'Відділ Засобів',
    });
    const inventoryId = await seedObject('protection_means_inventory', {
      categoryId: 2,
      category: 'Фільтр електроживлення',
      name: 'Фільтр КТЗІ',
      serialNumber: 'SN-KTZI-1',
      notes: 'Примітка',
    });

    await install({
      meanId: inventoryId,
      objectId: ktzi.id,
      objectType: 'KTZI',
      category: 'Фільтр електроживлення',
    });

    const installed = await getKtziProtectionMeans(ktzi.id);
    assert.equal(installed.length, 1);
    assert.equal(installed[0].serialNumber, 'SN-KTZI-1');
    assert.equal(
      await get('SELECT id FROM protection_means_inventory WHERE id = ?', [
        inventoryId,
      ]),
      null,
    );

    await returnToInventory(installed[0].id);

    assert.deepEqual(await getKtziProtectionMeans(ktzi.id), []);
    const inventoryMean = await get(
      `SELECT name, status, notes FROM protection_means_inventory
       WHERE serialNumber = ?`,
      ['SN-KTZI-1'],
    );
    assert.deepEqual(inventoryMean, {
      name: 'Фільтр КТЗІ',
      status: 'in_stock',
      notes: 'Примітка\nПовернуто зі встановлення на склад',
    });
  });

  it('rejects installing a non-KZZ mean directly on an object', async () => {
    const objectId = await seedObject('class_a_systems', {
      systemName: 'АС без прямих засобів',
    });
    const inventoryId = await seedObject('protection_means_inventory', {
      categoryId: 2,
      category: 'Фільтр електроживлення',
      name: 'Фільтр для АС',
      serialNumber: 'SN-OBJECT-REJECT',
    });

    await assert.rejects(
      install({
        meanId: inventoryId,
        objectId,
        objectType: 'AS',
        category: 'Фільтр електроживлення',
      }),
      (error) => error.status === 400,
    );
    assert.ok(
      await get('SELECT id FROM protection_means_inventory WHERE id = ?', [
        inventoryId,
      ]),
    );
  });

  it('rejects duplicate installation without removing the inventory record', async () => {
    const ktzi = await ensureKtzi({
      address: 'Дубль засобу 1',
      premisesNumber: '402',
      subdivisionName: 'Відділ Засобів',
    });
    await run(
      `INSERT INTO protection_means (ktziId, categoryId, toolType, name, serialNumber)
       VALUES (?, ?, ?, ?, ?)`,
      [ktzi.id, 2, 'Фільтр електроживлення', 'Вже встановлений', 'SN-DUP'],
    );
    const inventoryId = await seedObject('protection_means_inventory', {
      categoryId: 2,
      category: 'Фільтр електроживлення',
      name: 'Дублікат зі складу',
      serialNumber: 'SN-DUP',
    });

    await assert.rejects(
      install({
        meanId: inventoryId,
        objectId: ktzi.id,
        objectType: 'KTZI',
        category: 'Фільтр електроживлення',
      }),
      (error) =>
        error.status === 409 &&
        Array.isArray(error.duplicateLocations) &&
        error.duplicateLocations.length > 0,
    );
    assert.ok(
      await get('SELECT id FROM protection_means_inventory WHERE id = ?', [
        inventoryId,
      ]),
    );
    assert.equal((await getKtziProtectionMeans(ktzi.id)).length, 1);
  });

  it('installs a KZZ on an object without touching the KTZI means', async () => {
    const objectId = await seedObject('class_a_systems', {
      systemName: 'АС з КЗЗ',
    });
    const inventoryId = await seedObject('protection_means_inventory', {
      categoryId: 8,
      category: 'КЗЗ від НСД',
      name: 'КЗЗ-1',
      serialNumber: 'SN-KZZ',
    });

    await install({
      meanId: inventoryId,
      objectId,
      objectType: 'AS',
      category: 'КЗЗ від НСД',
    });

    const object = await get(
      'SELECT kzzName, kzzSerial FROM class_a_systems WHERE id = ?',
      [objectId],
    );
    assert.deepEqual(object, { kzzName: 'КЗЗ-1', kzzSerial: 'SN-KZZ' });
  });
});

describe('Object saving', () => {
  it('skips undefined nested collections when creating an object', async () => {
    const result = await createObjectWithNested(
      {
        table: 'class_a_systems',
        foreignKeyName: 'systemId',
        nestedTables: {},
      },
      { systemName: 'АС без вкладених даних' },
    );

    assert.ok(result.id);
  });
});
