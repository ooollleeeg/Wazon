import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/vazon.db');
const db = new sqlite3.Database(dbPath);

console.log('📊 Перевірка кількості повірок по техніці\n');

db.all(
  `
  SELECT 
    e.id, 
    e.name,
    COUNT(v.id) as verificationCount
  FROM search_control_equipment e
  LEFT JOIN search_control_equipment_verification v ON e.id = v.equipmentId
  GROUP BY e.id
  ORDER BY verificationCount DESC
  `,
  (err, rows) => {
    if (err) {
      console.error('❌ Помилка:', err);
    } else {
      console.log('Техніка та кількість повірок:\n');
      console.table(rows);

      // Find equipment with most verifications
      if (rows && rows[0] && rows[0].verificationCount > 1) {
        const equipId = rows[0].id;
        const equipName = rows[0].name;
        console.log(
          `\n✅ Техніка з найбільшим числом повірок: ID ${equipId} - "${equipName}" (${rows[0].verificationCount} повірок)\n`,
        );

        db.all(
          'SELECT id, deviceName, serialNumber, certificateRegNumber, verificationDate FROM search_control_equipment_verification WHERE equipmentId = ? ORDER BY id',
          [equipId],
          (err, verifications) => {
            if (verifications && verifications.length > 0) {
              console.log('Повірки:');
              console.table(verifications);
            }
            db.close();
          },
        );
      } else {
        console.log('\n⚠️ Не знайдено техніки з кількома повіркам');
        db.close();
      }
    }
  },
);
