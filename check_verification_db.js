import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/vazon.db');
const db = new sqlite3.Database(dbPath);

console.log('📋 Перевірка даних у базі...\n');

// Перевірити схему таблиці
db.all(
  `PRAGMA table_info(search_control_equipment_verification)`,
  (err, columns) => {
    if (err) {
      console.error('❌ Помилка при отриманні схеми:', err);
      db.close();
      return;
    }

    console.log('=== Схема таблиці search_control_equipment_verification ===');
    console.table(columns);
    console.log('');

    // Перевірити останню повірку
    db.get(
      `SELECT * FROM search_control_equipment_verification ORDER BY id DESC LIMIT 1`,
      (err, row) => {
        if (err) {
          console.error('❌ Помилка при отриманні повірки:', err);
        } else if (row) {
          console.log('=== Остання повірка у базі ===');
          console.log(JSON.stringify(row, null, 2));
          console.log('');
          console.log('Ключі:', Object.keys(row));
        } else {
          console.log('⚠️ Повірок не знайдено');
        }

        // Перевірити кількість повірок
        db.get(
          `SELECT COUNT(*) as count FROM search_control_equipment_verification`,
          (err, row) => {
            if (err) {
              console.error('❌ Помилка при підрахунку:', err);
            } else {
              console.log(`\n📊 Всього повірок в базі: ${row.count}`);
            }

            db.close();
          },
        );
      },
    );
  },
);
