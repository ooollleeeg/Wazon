import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('data/vazon.db');

const categoryId = 2;
const name = "ПОЛИК";
const serialNumber = "7896";

const sql = `
  SELECT 'AS' AS source, pm.systemId AS objectId, a.systemName AS objectName
  FROM class_a_systems_protection_means pm
  JOIN class_a_systems a ON pm.systemId = a.id
  WHERE pm.categoryId = ? AND pm.name COLLATE NOCASE = ? COLLATE NOCASE AND COALESCE(pm.serialNumber, '') COLLATE NOCASE = ? COLLATE NOCASE
`;

console.log(`Testing SQL for categoryId=${categoryId}, name="${name}", serial="${serialNumber}"`);

db.all(sql, [categoryId, name, serialNumber], (err, rows) => {
  if (err) {
    console.error('SQL Error:', err);
  } else {
    console.log(`Found ${rows.length} rows`);
    rows.forEach(r => console.log(`  ${r.source}: ${r.objectName} (ID: ${r.objectId})`));
  }
  
  // Тепер перевіримо безпосередньо
  console.log('\nDirect query to AS:');
  db.all(
    "SELECT id, systemId, categoryId, name, serialNumber FROM class_a_systems_protection_means WHERE categoryId = ?",
    [2],
    (err, rows) => {
      if (err) console.error(err);
      console.log(`Found ${rows.length} AS records with categoryId=2:`);
      rows.forEach(r => {
        console.log(`  ID: ${r.id}, systemId: ${r.systemId}, name: "${r.name}" (${r.name === 'ПОЛИК' ? '✅ matches' : '❌ no match'}), serial: "${r.serialNumber}"`);
      });
      db.close();
    }
  );
});
