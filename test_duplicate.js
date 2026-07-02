import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('data/vazon.db');

// Спочатку отримаємо ID об'єкту Peresyp11
db.get("SELECT id FROM class_a_systems WHERE systemName = 'Peresyp11'", (err, sys) => {
  if (err) console.error('Помилка при пошуку системи:', err);
  else if (sys) {
    console.log(`Знайдено Peresyp11 с ID: ${sys.id}`);
    
    // Тепер інтегруємо "ПОЛИК" фільтр на цю систему
    db.run(
      `INSERT INTO class_a_systems_protection_means (systemId, categoryId, name, serialNumber, toolType)
       VALUES (?, ?, ?, ?, ?)`,
      [sys.id, 2, 'ПОЛИК', '7896', 'Фільтр електроживлення'],
      function(err) {
        if (err) console.error('Помилка при додаванні:', err);
        else {
          console.log(`✅ Додан ПОЛИК на Peresyp11. Inserted ID: ${this.lastID}`);
          
          // Перевіримо дублікат
          db.all(`SELECT systemId, name, serialNumber FROM class_a_systems_protection_means WHERE name = 'ПОЛИК' AND serialNumber = '7896'`, (err, rows) => {
            if (err) console.error(err);
            else {
              console.log(`Тепер є ${rows.length} записів ПОЛИК № 7896 в AS`);
              rows.forEach((r, i) => console.log(`  ${i+1}. systemId: ${r.systemId}`));
            }
            db.close();
          });
        }
      }
    );
  } else {
    console.log('Peresyp11 не знайдено');
    db.close();
  }
});
