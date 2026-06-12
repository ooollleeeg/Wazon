import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('data/vazon.db');

console.log('\n=== Checking class_a_systems kzzName field ===');
const asResult = db
  .prepare(
    `
  SELECT id, name, kzzName, kzzSerial 
  FROM class_a_systems 
  WHERE kzzName LIKE '%Test KZZ%'
`,
  )
  .all();
console.log('AS with Test KZZ-2026 in kzzName:', asResult);

console.log('\n=== Checking class_a_systems_protection_means ===');
const asProtResult = db
  .prepare(
    `
  SELECT pm.id, pm.mean_name, pm.mean_serial, pm.category 
  FROM class_a_systems_protection_means pm
  WHERE pm.mean_name LIKE '%Test KZZ%'
`,
  )
  .all();
console.log('AS protection_means with Test KZZ-2026:', asProtResult);

console.log('\n=== Checking iks kzzName field ===');
const iksResult = db
  .prepare(
    `
  SELECT id, name, kzzName, kzzSerial 
  FROM iks 
  WHERE kzzName LIKE '%Test KZZ%'
`,
  )
  .all();
console.log('IKS with Test KZZ-2026 in kzzName:', iksResult);

console.log('\n=== Checking iks_protection_means ===');
const iksProtResult = db
  .prepare(
    `
  SELECT pm.id, pm.mean_name, pm.mean_serial, pm.category 
  FROM iks_protection_means pm
  WHERE pm.mean_name LIKE '%Test KZZ%'
`,
  )
  .all();
console.log('IKS protection_means with Test KZZ-2026:', iksProtResult);

console.log('\n=== Checking protection_means_inventory for Test KZZ-2026 ===');
const inventoryResult = db
  .prepare(
    `
  SELECT id, name, serial, category 
  FROM protection_means_inventory 
  WHERE name LIKE '%Test KZZ%'
`,
  )
  .all();
console.log('Inventory:', inventoryResult);

db.close();
console.log('\nDone!');
