import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import express from 'express';
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
  getKtziObjects,
  getKtziProtectionMeans,
  resolveKtziSubdivisionType,
  saveKtziDocumentData,
  updateKtziMainInfo,
} = await import('./ktzi.js');
const {
  aggregateProtectionMeans,
  installProtectionMean,
  returnProtectionMeanToInventory,
} = await import('./protectionMeansAggregator.js');
const { createObjectWithNested } = await import('./dbHelpers.js');
const { default: router } = await import('../routes.js');

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

const aggregate = (filters) =>
  new Promise((resolve, reject) => {
    aggregateProtectionMeans(filters, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

const returnToInventory = (meanId, assignment) =>
  new Promise((resolve, reject) => {
    returnProtectionMeanToInventory(
      meanId,
      assignment || {},
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
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
      ktziId INTEGER,
      objectType TEXT
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
  it('resolves a missing KTZI subdivision type from linked objects in each tab', async () => {
    const sources = [
      ['class_a_systems', 'підрозділ апарату'],
      ['service_premises', 'територіальний підрозділ'],
      ['krt', 'підрозділ апарату'],
    ];

    for (const [table, subdivisionType] of sources) {
      const ktzi = await ensureKtzi({
        address: `Тип підрозділу ${table}`,
        subdivisionName: `Підрозділ ${table}`,
      });
      await seedObject(table, {
        ktziId: ktzi.id,
        subdivisionName: `Підрозділ ${table}`,
        subdivisionType,
        ...(table === 'krt' ? { systemName: `Об’єкт ${table}` } : {}),
        ...(table === 'service_premises'
          ? { serviceName: `Приміщення ${table}` }
          : {}),
      });
      const objects = await getKtziObjects(ktzi.id);

      assert.equal(resolveKtziSubdivisionType('', objects), subdivisionType);
      assert.equal(
        resolveKtziSubdivisionType('збережене значення', objects),
        'збережене значення',
      );
    }
  });

  it('reuses a KTZI for objects with the same normalized identity', async () => {
    const first = await attachObjectToKtzi('class_a_systems', {
      address: ' вул. Тестова  1 ',
      premisesNumber: ' 101 ',
      subdivisionName: ' Відділ А ',
      informationCategory: 'II',
      objectType: 'комбінований ОІД',
    });
    const second = await attachObjectToKtzi('krt', {
      address: 'вул. Тестова 1',
      premisesNumber: '101',
      subdivisionName: 'Відділ А',
      informationCategory: 'III',
    });
    const secondAs = await attachObjectToKtzi('class_a_systems', {
      address: 'вул. Тестова 1',
      premisesNumber: '101',
      subdivisionName: 'Відділ А',
      informationCategory: 'II',
      objectType: "об'єкт ЕОТ",
    });
    const differentRoom = await attachObjectToKtzi('krt', {
      address: 'вул. Тестова 1',
      premisesNumber: '102',
      subdivisionName: 'Відділ А',
      informationCategory: 'II',
    });

    assert.equal(first.ktziId, second.ktziId);
    assert.notEqual(first.ktziId, differentRoom.ktziId);
    assert.equal(first.informationCategory, 'II');
    assert.equal(second.informationCategory, 'II');
    assert.equal(secondAs.objectType, 'комбінований ОІД');
    const ktzi = await get('SELECT objectType FROM ktzi WHERE id = ?', [
      first.ktziId,
    ]);
    assert.equal(ktzi.objectType, 'комбінований ОІД');
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

    const asResult = await attachObjectToKtzi('class_a_systems', {
      address: 'вул. Четверта 5',
      premisesNumber: '5',
      subdivisionName: 'Відділ IV АС',
      informationCategory: 'IV',
      objectType: "об'єкт ЕОТ",
    });
    assert.equal(asResult.ktziId, null);
    assert.equal(Object.hasOwn(asResult, 'objectType'), false);
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
      technicalTask: [
        {
          taskNumber: 'ТЗ-старе',
          taskDate: '2024-03-03',
          taskClearance: '2024-03-04',
        },
        {
          taskNumber: 'ТЗ-1',
          taskDate: '2026-03-03',
          taskClearance: '2026-03-04',
        },
      ],
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
    assert.deepEqual(
      (await getKtziDocumentData(ktzi.id)).documentVersions.technicalTask.map(
        ({ taskNumber, isCurrent }) => ({ taskNumber, isCurrent }),
      ),
      [
        { taskNumber: 'ТЗ-1', isCurrent: true },
        { taskNumber: 'ТЗ-старе', isCurrent: false },
      ],
    );
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
      taskNumber: 'ТЗ-старе',
      taskDate: '2023-04-03',
      taskClearance: '2023-04-04',
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
    assert.deepEqual(
      (await getKtziDocumentData(ktzi.id)).documentVersions.technicalTask.map(
        ({ taskNumber, isCurrent }) => ({ taskNumber, isCurrent }),
      ),
      [
        { taskNumber: 'ТЗ-legacy', isCurrent: true },
        { taskNumber: 'ТЗ-старе', isCurrent: false },
      ],
    );

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

  it('preserves every legacy task as a version and marks the newest current', async () => {
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
    assert.equal(result.documents.technicalTask.taskNumber, 'ТЗ-Б');
    assert.deepEqual(
      result.documentVersions.technicalTask.map(
        ({ taskNumber, isCurrent }) => ({ taskNumber, isCurrent }),
      ),
      [
        { taskNumber: 'ТЗ-Б', isCurrent: true },
        { taskNumber: 'ТЗ-А', isCurrent: false },
      ],
    );
    assert.deepEqual(result.migrationConflicts, []);
  });

  it('uses the newest registration date for a newly saved task version', async () => {
    const ktzi = await ensureKtzi({
      address: 'Спільна 8',
      premisesNumber: '208',
      subdivisionName: 'Відділ И',
    });

    await saveKtziDocumentData(ktzi.id, {
      technicalTask: [
        {
          taskNumber: 'ТЗ-чинне',
          taskDate: '15.10.2026',
          taskClearance: '16.10.2026',
        },
        {
          taskNumber: 'ТЗ-попереднє',
          taskDate: '10.05.2024',
          taskClearance: '11.05.2024',
        },
      ],
    });

    const result = await getKtziDocumentData(ktzi.id);
    assert.equal(result.documents.technicalTask.taskNumber, 'ТЗ-чинне');
    assert.deepEqual(
      result.documentVersions.technicalTask.map(
        ({ taskNumber, isCurrent }) => ({ taskNumber, isCurrent }),
      ),
      [
        { taskNumber: 'ТЗ-чинне', isCurrent: true },
        { taskNumber: 'ТЗ-попереднє', isCurrent: false },
      ],
    );
  });

  it('preserves differing legacy special checks as document versions', async () => {
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
      checkDate: '2024-01-01',
    });
    await seedObject('class_a_systems_special_check', {
      systemId: secondSystemId,
      checkNumber: 'КСП-Б',
      checkDate: '2026-01-01',
    });

    const result = await getKtziDocumentData(ktzi.id);
    assert.equal(result.documents.ksp.checkNumber, 'КСП-Б');
    assert.deepEqual(
      result.documentVersions.ksp.map(
        ({ checkNumber, isCurrent }) => ({ checkNumber, isCurrent }),
      ),
      [
        { checkNumber: 'КСП-Б', isCurrent: true },
        { checkNumber: 'КСП-А', isCurrent: false },
      ],
    );
    assert.deepEqual(result.migrationConflicts, []);
  });

  it('saves and deletes historical document versions without reimporting them', async () => {
    const ktzi = await ensureKtzi({
      address: 'Спільна 7',
      premisesNumber: '207',
      subdivisionName: 'Відділ З',
    });
    const systemId = await seedObject('class_a_systems', {
      systemName: 'АС документів',
      ktziId: ktzi.id,
    });
    await seedObject('class_a_systems_categorization', {
      systemId,
      categorizationActNumber: 'Категорія стара',
      categorizationActDate: '2021-01-01',
    });
    await seedObject('class_a_systems_categorization', {
      systemId,
      categorizationActNumber: 'Категорія чинна',
      categorizationActDate: '2026-01-01',
    });
    await seedObject('class_a_systems_atestation', {
      systemId,
      attestationRegNumber: 'Атестація стара',
      attestationRegDate: '2021-01-01',
    });
    await seedObject('class_a_systems_atestation', {
      systemId,
      attestationRegNumber: 'Атестація чинна',
      attestationRegDate: '2026-01-01',
    });

    const imported = await getKtziDocumentData(ktzi.id);
    assert.deepEqual(
      imported.documentVersions.categorization.map(
        ({ categorizationActNumber, isCurrent }) => ({
          categorizationActNumber,
          isCurrent,
        }),
      ),
      [
        { categorizationActNumber: 'Категорія чинна', isCurrent: true },
        { categorizationActNumber: 'Категорія стара', isCurrent: false },
      ],
    );
    assert.deepEqual(
      imported.documentVersions.atestation.map(
        ({ attestationRegNumber, isCurrent }) => ({
          attestationRegNumber,
          isCurrent,
        }),
      ),
      [
        { attestationRegNumber: 'Атестація чинна', isCurrent: true },
        { attestationRegNumber: 'Атестація стара', isCurrent: false },
      ],
    );

    await saveKtziDocumentData(ktzi.id, {
      categorization: [
        {
          categorizationActNumber: 'Категорія оновлена',
          categorizationActDate: '2026-06-01',
        },
      ],
    });
    const saved = await getKtziDocumentData(ktzi.id);
    assert.equal(
      saved.documents.categorization.categorizationActNumber,
      'Категорія оновлена',
    );
    assert.equal(saved.documentVersions.categorization.length, 1);
  });
});

describe('KTZI main info', () => {
  it('updates the KTZI and propagates main info to its objects', async () => {
    const ktzi = await ensureKtzi({
      address: 'Стара 1',
      premisesNumber: '301',
      subdivisionName: 'Відділ Старий',
      informationCategory: 'II',
    });
    const systemId = await seedObject('class_a_systems', {
      systemName: 'АС main',
      ktziId: ktzi.id,
      informationCategory: 'II',
      objectType: "об'єкт ЕОТ",
    });
    const krtId = await seedObject('krt', {
      systemName: 'КРТ main',
      subdivisionName: 'Відділ Старий',
      ktziId: ktzi.id,
      informationCategory: 'II',
    });

    const updated = await updateKtziMainInfo(ktzi.id, {
      address: ' Нова 2 ',
      premisesNumber: '302',
      subdivisionName: 'Відділ Новий',
      subdivisionType: 'apparatus',
      informationCategory: 'III',
      objectType: 'комбінований ОІД',
    });

    assert.equal(updated.address, 'Нова 2');
    assert.equal(updated.premisesNumber, '302');
    assert.equal(updated.informationCategory, 'III');
    for (const [table, id] of [
      ['class_a_systems', systemId],
      ['krt', krtId],
    ]) {
      const row = await get(
        `SELECT address, premisesNumber, subdivisionName, subdivisionType,
           informationCategory
         FROM ${table} WHERE id = ?`,
        [id],
      );
      assert.deepEqual(row, {
        address: 'Нова 2',
        premisesNumber: '302',
        subdivisionName: 'Відділ Новий',
        subdivisionType: 'apparatus',
        informationCategory: 'III',
      });
    }
    const updatedAs = await get(
      'SELECT objectType FROM class_a_systems WHERE id = ?',
      [systemId],
    );
    assert.equal(updatedAs.objectType, 'комбінований ОІД');
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
  it('normalizes subdivision labels for the department filter', async () => {
    const ktzi = await ensureKtzi({
      address: 'Фільтр підрозділу 1',
      premisesNumber: '400',
      subdivisionName: 'Відділ фільтра',
    });
    await seedObject('class_a_systems', {
      systemName: 'АС для типу підрозділу',
      subdivisionType: 'підрозділ апарату',
      ktziId: ktzi.id,
    });
    await run(
      `INSERT INTO protection_means
       (ktziId, categoryId, toolType, name, serialNumber)
       VALUES (?, ?, ?, ?, ?)`,
      [
        ktzi.id,
        2,
        'Фільтр електроживлення',
        'Фільтр для типу підрозділу',
        'SN-DEPT-FILTER',
      ],
    );

    const result = await aggregate({ departmentType: 'apparatus' });
    assert.ok(
      result.items.some((mean) => mean.serialNumber === 'SN-DEPT-FILTER'),
    );
  });

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

    await assert.rejects(
      returnToInventory(installed[0].id, {
        objectType: 'KTZI',
        objectId: ktzi.id + 1,
      }),
      (error) => error.status === 400,
    );
    await returnToInventory(installed[0].id, {
      objectType: 'KTZI',
      objectId: ktzi.id,
    });

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

  it('rejects local IKS installation using the inventory category, not client input', async () => {
    const iksId = await seedObject('iks', {
      systemClass: 'ІКС класу 1',
      systemName: 'ІКС без локальних засобів',
    });
    const inventoryId = await seedObject('protection_means_inventory', {
      categoryId: 2,
      category: 'Фільтр електроживлення',
      name: 'Фільтр для ІКС',
      serialNumber: 'SN-IKS-REJECT',
    });

    await assert.rejects(
      install({
        meanId: inventoryId,
        objectId: iksId,
        objectType: 'IKS',
        category: 'КЗЗ від НСД',
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

  it('updates an AS returned with KTZI information and its nested records', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', router);
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
    const request = async (url, method = 'GET', body) => {
      const response = await fetch(`${baseUrl}${url}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      assert.equal(response.ok, true, JSON.stringify(data));
      return data;
    };

    try {
      const created = await request('/objects/class_a_systems', 'POST', {
        address: 'Тестова адреса редагування',
        premisesNumber: '101',
        subdivisionName: 'Тестовий підрозділ редагування',
        systemClass: 'АС класу 1',
        systemName: 'АС до редагування',
        software: [{ name: 'ПЗ до редагування', version: '1' }],
        complianceDocuments: [
          {
            documentType: 'Атестат відповідності',
            'dsszzіNumber': 'ДСЗЗІ-РЕДАГУВАННЯ-1',
            'dsszzіDate': '2025-01-01',
            validUntil: '2099-01-01',
          },
        ],
      });
      const url = `/objects/class_a_systems/${created.id}`;
      const monitoringUrl = '/ktzi/documents';
      const objects = await request('/objects/class_a_systems');
      const loaded = objects.find((object) => object.id === created.id);
      assert.ok(loaded);
      assert.ok(loaded.ktziInfo);
      assert.ok(loaded.ktziDocuments);
      assert.equal(
        (await request(monitoringUrl)).find(
          (document) => document.ktziId === created.ktziId,
        )?.expirationDate,
        '2099-01-01',
      );

      await request(url, 'PUT', {
        ...loaded,
        systemName: 'АС після редагування',
        software: [
          { name: 'ПЗ після редагування', version: '2' },
          { name: 'Додаткове ПЗ', version: '1' },
        ],
        complianceDocuments: [
          {
            ...loaded.complianceDocuments[0],
            validUntil: '2099-02-01',
          },
        ],
      });
      const updated = await request(url);
      assert.equal(updated.systemName, 'АС після редагування');
      assert.deepEqual(
        updated.software.map((item) => item.name).sort(),
        ['Додаткове ПЗ', 'ПЗ після редагування'].sort(),
      );
      assert.equal(updated.ktziInfo.id, loaded.ktziInfo.id);
      assert.equal(
        (await request(monitoringUrl)).find(
          (document) => document.ktziId === created.ktziId,
        )?.expirationDate,
        '2099-02-01',
      );

      await request(url, 'PUT', {
        ...updated,
        complianceDocuments: [],
      });
      assert.equal(
        (await request(monitoringUrl)).some(
          (document) => document.ktziId === created.ktziId,
        ),
        false,
      );

      const withoutComplianceDocument = await request(url);
      await request(url, 'PUT', {
        ...withoutComplianceDocument,
        complianceDocuments: [
          {
            documentType: 'Атестат відповідності',
            'dsszzіNumber': 'ДСЗЗІ-РЕДАГУВАННЯ-2',
            'dsszzіDate': '2025-01-01',
            validUntil: '2099-03-01',
          },
        ],
      });
      const withComplianceDocument = await request(url);
      await request(
        `${url}/nested/complianceDocuments/${withComplianceDocument.complianceDocuments[0].id}`,
        'DELETE',
      );
      assert.equal(
        (await request(monitoringUrl)).some(
          (document) => document.ktziId === created.ktziId,
        ),
        false,
      );

      await request(url, 'PATCH', {
        ...withoutComplianceDocument,
        systemName: 'АС після часткового редагування',
      });
      const patched = await request(url);
      assert.equal(patched.systemName, 'АС після часткового редагування');
      assert.equal(patched.software.length, 2);
      assert.equal(patched.ktziInfo.id, loaded.ktziInfo.id);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

describe('Documents report', () => {
  it('counts shared documents by KTZI and uses DSSZZI attestation dates', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', router);
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
    const request = async (url, init) => {
      const response = await fetch(`${baseUrl}${url}`, init);
      const data = await response.json();
      assert.equal(response.ok, true, JSON.stringify(data));
      return data;
    };
    const createObject = (type, data) =>
      request(`/objects/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    const saveDocuments = (ktziId, documents) =>
      request(`/ktzi/${ktziId}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      });

    try {
      const complianceDocument = {
        documentType: 'Атестат відповідності',
        'dsszzіNumber': 'ДС-СПІЛЬНИЙ-01',
        'dsszzіDate': '2099-01-15',
      };
      const apparatusObject = {
        address: 'Тестова 2099, 1',
        premisesNumber: '1',
        subdivisionName: 'Підрозділ апарату 2099',
        subdivisionType: 'підрозділ апарату',
        systemClass: 'АС класу 2',
        informationCategory: 'II',
        complianceDocuments: [complianceDocument],
      };
      const firstAs = await createObject('class_a_systems', {
        ...apparatusObject,
        systemName: 'Тестова АС апарату 1',
      });
      const secondAs = await createObject('class_a_systems', {
        ...apparatusObject,
        systemName: 'Тестова АС апарату 2',
      });
      const territorialAs = await createObject('class_a_systems', {
        address: 'Тестова 2099, 2',
        premisesNumber: '2',
        subdivisionName: 'Територіальний підрозділ 2099',
        subdivisionType: 'територіальний підрозділ',
        systemClass: 'АС класу 2',
        systemName: 'Тестова АС територіального підрозділу',
        informationCategory: 'II',
        complianceDocuments: [complianceDocument],
      });
      const territorialPremises = await createObject('service_premises', {
        address: 'Тестова 2099, 3',
        premisesNumber: '3',
        subdivisionName: 'Територіальний підрозділ 2099 СП',
        subdivisionType: 'територіальний підрозділ',
        serviceName: 'Тестове приміщення 2099',
      });
      const apparatusKrt = await createObject('krt', {
        address: 'Тестова 2099, 4',
        premisesNumber: '4',
        subdivisionName: 'Підрозділ апарату 2099 КРТ',
        subdivisionType: 'підрозділ апарату',
        systemName: 'Тестове КРТ 2099',
      });

      const ktziIds = [
        firstAs.ktziId,
        secondAs.ktziId,
        territorialAs.ktziId,
        territorialPremises.ktziId,
        apparatusKrt.ktziId,
      ];
      assert.ok(ktziIds.every(Boolean));
      assert.equal(secondAs.ktziId, firstAs.ktziId);
      assert.notEqual(territorialAs.ktziId, firstAs.ktziId);

      for (const ktziId of new Set(ktziIds)) {
        await run('UPDATE ktzi SET subdivisionType = ? WHERE id = ?', [
          '',
          ktziId,
        ]);
      }

      const task = (taskNumber) => ({
        taskNumber,
        taskDate: '2098-12-01',
        taskClearance: '2099-01-12',
      });
      await saveDocuments(firstAs.ktziId, {
        technicalTask: [task('ТЗ-АПАРАТ-01')],
        atestation: [
          {
            attestationRegNumber: 'АТЕСТ-НЕВІРНА-ДАТА-01',
            attestationRegDate: '2099-01-15',
            attestationDsszziDate: '2098-12-30',
          },
          {
            attestationRegNumber: 'АТЕСТ-ПРАВИЛЬНА-ДАТА-01',
            attestationRegDate: '2098-12-30',
            attestationDsszziDate: '2099-01-15',
          },
        ],
      });
      await saveDocuments(territorialAs.ktziId, {
        technicalTask: [task('ТЗ-ТЕРИТОРІЯ-01')],
        atestation: [
          {
            attestationRegNumber: 'АТЕСТ-ПРАВИЛЬНА-ДАТА-02',
            attestationRegDate: '2098-12-30',
            attestationDsszziDate: '2099-01-16',
          },
        ],
      });
      await saveDocuments(territorialPremises.ktziId, {
        technicalTask: [task('ТЗ-СП-01')],
      });
      await saveDocuments(apparatusKrt.ktziId, {
        technicalTask: [task('ТЗ-КРТ-01')],
      });

      const report = await request(
        '/documents-report?dateFrom=2099-01-10&dateTo=2099-01-20',
      );
      const taskRow = report.rows[0];
      const attestationRow = report.rows[1];
      const certificateRow = report.rows[5];

      assert.deepEqual(
        {
          apparatus: taskRow.apparatus,
          territorial: taskRow.territorial,
          total: taskRow.total,
        },
        { apparatus: 2, territorial: 2, total: 4 },
      );
      assert.deepEqual(
        {
          apparatus: attestationRow.apparatus,
          territorial: attestationRow.territorial,
          total: attestationRow.total,
        },
        { apparatus: 1, territorial: 1, total: 2 },
      );
      assert.deepEqual(
        {
          apparatus: certificateRow.apparatus,
          territorial: certificateRow.territorial,
          total: certificateRow.total,
        },
        { apparatus: 1, territorial: 1, total: 2 },
      );
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

describe('OID report', () => {
  it('counts category IV AS cards as EOT objects without an object type', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', router);
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
    const request = async (url, init) => {
      const response = await fetch(`${baseUrl}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      });
      const data = await response.json();
      assert.equal(response.ok, true, JSON.stringify(data));
      return data;
    };

    try {
      const reportBefore = await request('/oid-report');
      const eotBefore = reportBefore.rows.find(
        (row) => row.key === 'electronicComputers',
      );
      const combinedBefore = reportBefore.rows.find(
        (row) => row.key === 'combined',
      );

      const created = await request('/objects/class_a_systems', {
        method: 'POST',
        body: JSON.stringify({
          address: 'OID IV report test',
          premisesNumber: 'IV',
          subdivisionName: 'OID IV report test',
          subdivisionType: 'підрозділ апарату',
          systemClass: 'АС класу 1',
          systemName: 'OID IV report test',
          informationCategory: 'IV',
        }),
      });
      assert.equal(created.objectType, undefined);
      assert.equal(created.ktziId, null);

      const reportAfter = await request('/oid-report');
      const eotAfter = reportAfter.rows.find(
        (row) => row.key === 'electronicComputers',
      );
      const combinedAfter = reportAfter.rows.find(
        (row) => row.key === 'combined',
      );

      assert.equal(
        eotAfter.values.apparatus.IV,
        eotBefore.values.apparatus.IV + 1,
      );
      assert.equal(
        combinedAfter.values.apparatus.IV,
        combinedBefore.values.apparatus.IV,
      );
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
