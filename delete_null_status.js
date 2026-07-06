import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('data/vazon.db');

console.log('Видаляю записи зі статусом NULL...\n');

db.run(
  "DELETE FROM protection_means_inventory WHERE status IS NULL",
  function(err) {
    if (err) {
      console.error('❌ Помилка при видаленні:', err);
      db.close();
      return;
    }

    console.log(`✅ Видалено ${this.changes} записів`);

    // Перевіримо, що лишилось
    db.all(
      "SELECT id, name, serialNumber, status FROM protection_means_inventory ORDER BY id",
      (err, rows) => {
        if (err) console.error(err);
        else {
          console.log('\nЗалишилось в базі:');
          rows.forEach((r) => {
            console.log(`  ID: ${r.id}, Назва: "${r.name}", S/N: "${r.serialNumber}", Статус: "${r.status}"`);
          });
        }
        db.close();
      }
    );
  }
);
