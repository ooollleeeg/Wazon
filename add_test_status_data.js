const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/vazon.db');

// Add test data with different statuses
// Critical: validUntil is 3 days in future
const now = new Date();
const criticalDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

// Warning: validUntil is 15 days in future
const warningDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

db.serialize(() => {
  // Insert test equipment for Critical status
  db.run(
    `INSERT INTO search_control_equipment (name, category, serialNumber, invertarNumber, releaseYear, technicalCondition, pricePerUnit, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      'Тест Критично',
      'Контрольно-вимірювальна техніка',
      'CRIT-001',
      'INV-CRIT',
      2024,
      'справна',
      '50000',
      'Test data',
    ],
    function (err) {
      if (!err) {
        const id1 = this.lastID;
        // Add verification with critical status
        db.run(
          `INSERT INTO search_control_equipment_verification (equipmentId, deviceName, serialNumber, certificateRegNumber, verificationDate, validUntil, verificationCost)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id1,
            'Main',
            'CRIT-001',
            'CERT-CRIT-001',
            now.toISOString().split('T')[0],
            criticalDate,
            1000,
          ],
          (err) => {
            if (err) console.error('Error adding critical verification:', err);
          },
        );
      }
    },
  );

  // Insert test equipment for Warning status
  db.run(
    `INSERT INTO search_control_equipment (name, category, serialNumber, invertarNumber, releaseYear, technicalCondition, pricePerUnit, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      'Тест Warning',
      'Контрольно-вимірювальна техніка',
      'WARN-001',
      'INV-WARN',
      2024,
      'справна',
      '75000',
      'Test data',
    ],
    function (err) {
      if (!err) {
        const id2 = this.lastID;
        // Add verification with warning status
        db.run(
          `INSERT INTO search_control_equipment_verification (equipmentId, deviceName, serialNumber, certificateRegNumber, verificationDate, validUntil, verificationCost)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id2,
            'Main',
            'WARN-001',
            'CERT-WARN-001',
            now.toISOString().split('T')[0],
            warningDate,
            1000,
          ],
          (err) => {
            if (err) console.error('Error adding warning verification:', err);
          },
        );
      }
    },
  );

  setTimeout(() => {
    db.close();
    console.log('Test data added successfully');
    console.log('Critical status date:', criticalDate, '(3 days in future)');
    console.log('Warning status date:', warningDate, '(15 days in future)');
  }, 500);
});
