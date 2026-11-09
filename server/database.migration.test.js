import assert from 'node:assert/strict';
import { after, before, it } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sqlite3 from 'sqlite3';

const databaseDirectory = await fs.mkdtemp(
  path.join(os.tmpdir(), 'vazon-migration-'),
);
const databasePath = path.join(databaseDirectory, 'legacy.sqlite');

const legacyDb = new sqlite3.Database(databasePath);
const legacyRun = (query, params = []) =>
  new Promise((resolve, reject) => {
    legacyDb.run(query, params, function (error) {
      if (error) reject(error);
      else resolve(this.lastID);
    });
  });

await legacyRun(`
  CREATE TABLE ktzi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ktziKey TEXT NOT NULL UNIQUE,
    address TEXT,
    premisesNumber TEXT,
    subdivisionName TEXT,
    subdivisionType TEXT,
    serviceName TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
await legacyRun(`
  CREATE TABLE ktzi_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ktziId INTEGER NOT NULL,
    documentType TEXT NOT NULL,
    documentNumber TEXT,
    documentDate TEXT,
    validUntil TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
await legacyRun(`
  CREATE TABLE class_a_systems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT,
    premisesNumber TEXT,
    subdivisionName TEXT NOT NULL,
    subdivisionType TEXT,
    serviceName TEXT,
    systemClass TEXT NOT NULL,
    systemName TEXT
  )
`);
await legacyRun(`
  CREATE TABLE class_a_systems_protection_means (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    systemId INTEGER,
    toolType TEXT,
    name TEXT,
    serialNumber TEXT,
    invertarNumber TEXT,
    releaseYear INTEGER,
    manufacturerExploitationTerm TEXT,
    certificateInfo TEXT
  )
`);
await legacyRun(`
  CREATE TABLE protection_means (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ktziId INTEGER NOT NULL,
    categoryId INTEGER,
    toolType TEXT,
    name TEXT,
    serialNumber TEXT,
    invertarNumber TEXT,
    releaseYear INTEGER,
    manufacturerExploitationTerm TEXT,
    certificateInfo TEXT,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
await legacyRun(`
  CREATE TABLE protection_mean_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protectionMeanId INTEGER NOT NULL,
    objectType TEXT,
    objectId INTEGER
  )
`);
await legacyRun(
  `INSERT INTO ktzi (id, ktziKey, address, premisesNumber, subdivisionName)
   VALUES (?, ?, ?, ?, ?)`,
  [1, 'legacy-ktzi', 'Legacy address', '101', 'Legacy department'],
);
await legacyRun(
  `INSERT INTO ktzi_documents
   (ktziId, documentType, documentNumber, documentDate)
   VALUES (?, ?, ?, ?)`,
  [1, 'technicalTask', 'Legacy task', '2025-01-01'],
);
const legacyObjectId = await legacyRun(
  `INSERT INTO class_a_systems
   (address, premisesNumber, subdivisionName, systemClass, systemName)
   VALUES (?, ?, ?, ?, ?)`,
  ['Legacy address', '101', 'Legacy department', 'АС класу 1', 'Legacy AS'],
);
const legacyMeanId = await legacyRun(
  `INSERT INTO protection_means
   (ktziId, categoryId, toolType, name, serialNumber, notes)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [1, 7, 'Фільтр', 'Legacy shared mean', 'LEGACY-SN', 'Legacy notes'],
);
await legacyRun(
  `INSERT INTO protection_mean_assignments
   (protectionMeanId, objectType, objectId)
   VALUES (?, ?, ?)`,
  [legacyMeanId, 'AS', legacyObjectId],
);
await new Promise((resolve, reject) =>
  legacyDb.close((error) => (error ? reject(error) : resolve())),
);

process.env.VAZON_DB_PATH = databasePath;
const { db } = await import('./database.js');

const get = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) reject(error);
      else resolve(row || null);
    });
  });

const tableColumns = (tableName) =>
  new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });

before(async () => {
  await get('SELECT 1');
});

after(async () => {
  await new Promise((resolve) => db.close(resolve));
  await fs.rm(databaseDirectory, { recursive: true, force: true });
});

it('preserves legacy objects and adds KTZI migration columns', async () => {
  const object = await get(
    'SELECT id, systemName, premisesNumber FROM class_a_systems WHERE id = ?',
    [legacyObjectId],
  );
  const columns = await tableColumns('class_a_systems');

  assert.deepEqual(object, {
    id: legacyObjectId,
    systemName: 'Legacy AS',
    premisesNumber: '101',
  });
  assert.ok(columns.some((column) => column.name === 'ktziId'));
  assert.ok(columns.some((column) => column.name === 'isProcessingSuspended'));
  const documentColumns = await tableColumns('ktzi_documents');
  assert.ok(documentColumns.some((column) => column.name === 'documentData'));
  const legacyDocument = await get(
    `SELECT documentNumber, documentDate, documentData
     FROM ktzi_documents WHERE ktziId = ?`,
    [1],
  );
  assert.deepEqual(legacyDocument, {
    documentNumber: 'Legacy task',
    documentDate: '2025-01-01',
    documentData: null,
  });
  const tableExists = async (tableName) =>
    Boolean(
      await get(
        "SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ?",
        [tableName],
      ),
    );
  assert.equal(await tableExists('ktzi_document_legacy_imports'), true);
  assert.equal(await tableExists('class_a_systems_protection_means'), false);
  assert.equal(await tableExists('protection_mean_assignments'), false);
  const sharedMean = await get(
    `SELECT id, ktziId, name, serialNumber, notes
     FROM protection_means WHERE id = ?`,
    [legacyMeanId],
  );
  assert.deepEqual(sharedMean, {
    id: legacyMeanId,
    ktziId: 1,
    name: 'Legacy shared mean',
    serialNumber: 'LEGACY-SN',
    notes: 'Legacy notes',
  });
});
