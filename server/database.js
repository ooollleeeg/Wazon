import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/vazon.db');

// ✅ ЕКСПОРТУЙТЕ db
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected at:', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Включаємо зовнішні ключі
    db.run('PRAGMA foreign_keys = ON');

    // Таблиці для personnelId
    db.run(`
  CREATE TABLE IF NOT EXISTS personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    position TEXT,
    officialRank TEXT,
    actualRank TEXT,
    dateOfBirth TEXT,
    email TEXT,
    phone TEXT,
    mobilePhone TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

    db.run(`
  CREATE TABLE IF NOT EXISTS personnel_education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personnelId INTEGER NOT NULL,
    institution TEXT,
    yearCompleted INTEGER,
    specialties TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (personnelId) REFERENCES personnel(id) ON DELETE CASCADE
  )
`);

    db.run(`
  CREATE TABLE IF NOT EXISTS personnel_certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personnelId INTEGER NOT NULL,
    certificateNumber TEXT,
    trainingName TEXT,
    location TEXT,
    year INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (personnelId) REFERENCES personnel(id) ON DELETE CASCADE
  )
`);

    // Таблиці для class_a_systems
    db.run(`
      CREATE TABLE IF NOT EXISTS class_a_systems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT,
        subdivisionName TEXT NOT NULL,
        subdivisionType TEXT,
        serviceName TEXT,
        systemClass TEXT NOT NULL,
        systemName TEXT,
        categorizationActDate TEXT,
        categorizationActNumber TEXT,
        kzzName TEXT,
        kzzSerial TEXT,
        antivirus TEXT,
        antivirusOpinionNumber TEXT,
        ttCreateDate TEXT,
        ttCreateNumber TEXT,
        formulaDate TEXT,
        formulaNumber TEXT,
        passportDate TEXT,
        passportNumber TEXT,
        protocolDate TEXT,
        protocolNumber TEXT,
        protocolValidUntil TEXT,
        kspActDate TEXT,
        kspActNumber TEXT,
        attestationRegDate TEXT,
        attestationRegNumber TEXT,
        attestationDsszziDate TEXT,
        attestationDsszziNumber TEXT,
        attestationValidUntil TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS class_a_systems_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        docType TEXT,
        date TEXT,
        number TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS class_a_systems_protection_means (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        name TEXT,
        serialNumber TEXT,
        releaseYear INTEGER,
        certificateInfo TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS class_a_systems_software (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        name TEXT,
        version TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `);

    db.run(
      `
      CREATE TABLE IF NOT EXISTS class_a_systems_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        orderType TEXT,
        number TEXT,
        date TEXT,
        publisher TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `,
      (err) => {
        if (err) {
          console.error('❌ Database initialization error:', err.message);
        } else {
          console.log('✅ Database tables initialized');
        }
      },
    );
  });
}

// Закрите базу даних при завершенні процеса
process.on('exit', () => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err);
    else console.log('Database connection closed');
  });
});

export default db;
