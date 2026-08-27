import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/vazon.db');
const db = new sqlite3.Database(dbPath);

console.log('📋 Перевірка останніх 5 повірок у базі\n');

db.all(
  `SELECT id, equipmentId, deviceName, serialNumber, certificateRegNumber, verificationDate, validUntil FROM search_control_equipment_verification ORDER BY id DESC LIMIT 5`,
  (err, rows) => {
    if (err) {
      console.error('❌ Помилка:', err);
    } else {
      console.table(rows);
      rows?.forEach((row) => {
        console.log(`\nID ${row.id}:`);
        console.log(`  deviceName: ${row.deviceName}`);
        console.log(`  serialNumber: ${row.serialNumber}`);
      });
    }
    db.close();
  },
);
