import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('data/vazon.db');

db.all("SELECT id, systemId, categoryId, name, serialNumber FROM class_a_systems_protection_means WHERE name LIKE '%полик%' OR name LIKE '%ПОЛИК%'", (err, rows) => {
  if (err) console.error('Помилка:', err);
  else {
    console.log('Фільтри в AS:', rows.length);
    rows.forEach(r => console.log(`  ID: ${r.id}, systemId: ${r.systemId}, categoryId: ${r.categoryId}, name: "${r.name}", serial: "${r.serialNumber}"`));
  }
  
  db.all("SELECT id, categoryId, name, serialNumber FROM protection_means_inventory WHERE name LIKE '%полик%' OR name LIKE '%ПОЛИК%'", (err, rows) => {
    if (err) console.error('Помилка:', err);
    else {
      console.log('Фільтри на складі:', rows.length);
      rows.forEach(r => console.log(`  ID: ${r.id}, categoryId: ${r.categoryId}, name: "${r.name}", serial: "${r.serialNumber}"`));
    }
    db.close();
  });
});
