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
    name TEXT
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
  'INSERT INTO protection_means (ktziId, name) VALUES (?, ?)',
  [1, 'Legacy shared mean'],
);
await legacyRun(
  'INSERT INTO protection_mean_assignments (protectionMeanId, objectType, objectId) VALUES (?, ?, ?)',
  [1, 'AS', 1],
);
const legacyObjectId = await legacyRun(
  `INSERT INTO class_a_systems
   (address, premisesNumber, subdivisionName, systemClass, systemName)
   VALUES (?, ?, ?, ?, ?)`,
  ['Legacy address', '101', 'Legacy department', 'АС класу 1', 'Legacy AS'],
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
  const protectionMeanColumns = await tableColumns(
    'class_a_systems_protection_means',
  );
  assert.ok(protectionMeanColumns.some((column) => column.name === 'notes'));
  const legacySharedTables = await get(
    `SELECT COUNT(*) AS count FROM sqlite_master
     WHERE type = 'table'
       AND name IN ('protection_means', 'protection_mean_assignments')`,
  );
  assert.equal(legacySharedTables.count, 0);
});
