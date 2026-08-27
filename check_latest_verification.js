import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/vazon.db');
const db = new sqlite3.Database(dbPath);

console.log('📊 Перевірка останніх повірок для техніки ID 2\n');

db.all(
  `SELECT id, equipmentId, deviceName, serialNumber, verificationDate, validUntil 
   FROM search_control_equipment_verification 
   WHERE equipmentId = 2 
   ORDER BY id DESC 
   LIMIT 10`,
  (err, rows) => {
    if (err) {
      console.error('❌ Помилка:', err);
    } else {
      console.log('Останні 10 повірок для техніки ID 2:\n');
      console.table(rows);
    }
    db.close();
  }
);
