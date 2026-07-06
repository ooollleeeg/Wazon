import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('data/vazon.db');

// Спочатку знайдемо засоби зі статусом 'невідомо' або 'unknown'
db.all(
  "SELECT id, categoryId, name, serialNumber, status FROM protection_means_inventory WHERE status = 'unknown' OR status = 'невідомо'",
  (err, rows) => {
    if (err) {
      console.error('Помилка при пошуку:', err);
      db.close();
      return;
    }

    if (rows.length === 0) {
      console.log('Засобів зі статусом "невідомо" не знайдено');
      db.close();
      return;
    }

    console.log(`Знайдено ${rows.length} засобів зі статусом "невідомо":`);
    rows.forEach((r, i) => {
      console.log(`  ${i + 1}. ID: ${r.id}, Назва: "${r.name}", S/N: "${r.serialNumber}", Статус: "${r.status}"`);
    });

    // Видалимо ці записи
    console.log('\nВидаляю...');
    db.run(
      "DELETE FROM protection_means_inventory WHERE status = 'unknown' OR status = 'невідомо'",
      function(err) {
        if (err) {
          console.error('❌ Помилка при видаленні:', err);
        } else {
          console.log(`✅ Видалено ${this.changes} записів`);
        }
        db.close();
      }
    );
  }
);
