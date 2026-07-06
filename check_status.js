import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('data/vazon.db');

// Перевіримо всі унікальні статуси
db.all(
  "SELECT DISTINCT status FROM protection_means_inventory ORDER BY status",
  (err, rows) => {
    if (err) {
      console.error('Помилка:', err);
      db.close();
      return;
    }

    console.log('Унікальні статуси в базі:');
    rows.forEach((r) => {
      console.log(`  - "${r.status}"`);
    });

    // Виведемо все що є
    console.log('\nВсі записи з їх статусами:');
    db.all(
      "SELECT id, name, serialNumber, status FROM protection_means_inventory",
      (err, rows) => {
        if (err) console.error(err);
        else {
          rows.forEach((r) => {
            console.log(`  ID: ${r.id}, Назва: "${r.name}", S/N: "${r.serialNumber}", Статус: "${r.status}"`);
          });
        }
        db.close();
      }
    );
  }
);
