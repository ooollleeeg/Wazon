import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('data/vazon.db');

db.all("PRAGMA table_info(class_a_systems_protection_means);", (err, cols) => {
  if (err) console.error(err);
  console.log('Колонки class_a_systems_protection_means:');
  cols.forEach(c => {
    console.log(`  ${c.name}: ${c.type} - collation: ${c.collseq || 'BINARY'}`);
  });
  db.close();
});
