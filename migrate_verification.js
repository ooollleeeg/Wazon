import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/vazon.db');
const db = new sqlite3.Database(dbPath);

console.log(
  '🔄 Міграція БД: Додавання нових колон до search_control_equipment_verification\n',
);

// Додати колону deviceName
db.run(
  `ALTER TABLE search_control_equipment_verification ADD COLUMN deviceName TEXT`,
  (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ deviceName колона вже існує');
      } else {
        console.error('❌ Помилка при додаванні deviceName:', err.message);
      }
    } else {
      console.log('✅ deviceName колона додана');
    }

    // Додати колону serialNumber
    db.run(
      `ALTER TABLE search_control_equipment_verification ADD COLUMN serialNumber TEXT`,
      (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log('✓ serialNumber колона вже існує');
          } else {
            console.error(
              '❌ Помилка при додаванні serialNumber:',
              err.message,
            );
          }
        } else {
          console.log('✅ serialNumber колона додана');
        }

        // Перевірити нову схему
        console.log('\n📋 Нова схема таблиці:');
        db.all(
          `PRAGMA table_info(search_control_equipment_verification)`,
          (err, columns) => {
            if (err) {
              console.error('❌ Помилка:', err);
            } else {
              console.table(columns);
            }
            db.close();
            console.log('\n✅ Міграція завершена!\n');
          },
        );
      },
    );
  },
);
