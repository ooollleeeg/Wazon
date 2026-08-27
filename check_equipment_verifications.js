import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/vazon.db');
const db = new sqlite3.Database(dbPath);

console.log('📊 Перевірка всіх повірок для техніки ID 3\n');

db.all(
  `SELECT id, equipmentId, deviceName, serialNumber, certificateRegNumber, verificationDate, validUntil FROM search_control_equipment_verification WHERE equipmentId = 3 ORDER BY id`,
  (err, rows) => {
    if (err) {
      console.error('❌ Помилка:', err);
    } else {
      console.log(
        `✅ Знайдено ${rows?.length || 0} повірок для техніки ID 3\n`,
      );

      if (rows && rows.length > 0) {
        console.table(rows);

        console.log('\n📋 Детальна інформація:');
        console.log('─'.repeat(100));
        rows.forEach((row, i) => {
          console.log(`\n${i + 1}. ID ${row.id}:`);
          console.log(`   deviceName: ${row.deviceName || 'NULL'}`);
          console.log(`   serialNumber: ${row.serialNumber || 'NULL'}`);
          console.log(`   certificate: ${row.certificateRegNumber}`);
          console.log(`   verificationDate: ${row.verificationDate}`);
          console.log(`   validUntil: ${row.validUntil}`);
        });
        console.log('\n' + '─'.repeat(100));

        // Statistics
        const hasDeviceName = rows.filter((r) => r.deviceName).length;
        const hasSerialNumber = rows.filter((r) => r.serialNumber).length;

        console.log(`\n✅ СТАТИСТИКА для техніки ID 3:`);
        console.log(`   Усього повірок: ${rows.length}`);
        console.log(`   Повірок з deviceName: ${hasDeviceName}/${rows.length}`);
        console.log(
          `   Повірок з serialNumber: ${hasSerialNumber}/${rows.length}`,
        );
      }
    }

    db.close();
  },
);
