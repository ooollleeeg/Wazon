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
    dateOfBirth TEXT,
    dateOfOvs TEXT,
    dateOfNpu TEXT,
    position TEXT,
    dateOfPosition TEXT,
    officialRank TEXT,
    actualRank TEXT,
    department TEXT,
    dateOfDepartment TEXT,
    
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
    specialties TEXT,
    educationRank TEXT,
    yearCompleted INTEGER,    
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (personnelId) REFERENCES personnel(id) ON DELETE CASCADE
  )
`);

    db.run(`
  CREATE TABLE IF NOT EXISTS personnel_certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personnelId INTEGER NOT NULL,
    trainingName TEXT,
    certificateNumber TEXT,
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
        premisesNumber TEXT,
        subdivisionName TEXT NOT NULL,
        subdivisionType TEXT,
        serviceName TEXT,
        systemClass TEXT NOT NULL,
        systemName TEXT,
        objectType TEXT,
        categorizationActDate TEXT,
        categorizationActNumber TEXT,
        kzzName TEXT,
        kzzSerial TEXT,
        kzzExpertOpinionNumber TEXT,
        kzzExpertOpinionDate TEXT,
        kzzManufacturerExploitationTerm TEXT,
        antivirus TEXT,
        antivirusOpinionNumber TEXT,
        antivirusOpinionDate TEXT,
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
        categoryId INTEGER,
        name TEXT,
        serialNumber TEXT,
        invertarNumber TEXT,
        releaseYear INTEGER,
        manufacturerExploitationTerm TEXT,
        certificateInfo TEXT,
        toolType TEXT,
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
        manufacturer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `);

    db.run(
      `
      CREATE TABLE IF NOT EXISTS class_a_systems_categorization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        categorizationType TEXT,
        categorizationActDate TEXT,
        categorizationActNumber TEXT,
        categorizationRank TEXT,
        categorizationValidUntil TEXT,
        foreignCriticalArea TEXT,
        hightInformationRank TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `,
    );

    db.run(`
      CREATE TABLE IF NOT EXISTS class_a_systems_technical_task (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        taskDate TEXT,
        taskNumber TEXT,
        taskClearance TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS class_a_systems_instrumental_control (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        controlNumber TEXT,
        controlDate TEXT,
        controlTermin TEXT,
        controlPerformer TEXT,
        controlEventDate TEXT,
        permissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS class_a_systems_special_check (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        checkNumber TEXT,
        checkDate TEXT,
        checkPerformer TEXT,
        checkEventDate TEXT,
        checkPermissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS class_a_systems_atestation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        attestationRegNumber TEXT,
        attestationRegDate TEXT,
        attestationDsszziDate TEXT,
        attestationDsszziNumber TEXT,
        attestationValidUntil TEXT,
        atestationPerformer TEXT,
        attestationWorkStartDate TEXT,
        attestationWorkEndDate TEXT,
        atestationPermissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS class_a_systems_compliance_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemId INTEGER NOT NULL,
        documentType TEXT,
        dsszzіNumber TEXT,
        dsszzіDate TEXT,
        validUntil TEXT,
        expertOpinionNumber TEXT,
        expertOpinionDate TEXT,
        inclusionDate TEXT,
        serialNumberInList TEXT,
        nextAuthorizationDeadline TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (systemId) REFERENCES class_a_systems(id) ON DELETE CASCADE
      )
    `);

    // Таблиці для service_premises
    db.run(`
      CREATE TABLE IF NOT EXISTS service_premises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT,
        premisesNumber TEXT,
        subdivisionName TEXT NOT NULL,
        subdivisionType TEXT,
        serviceName TEXT,
        passportNumber TEXT,
        passportDate TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS service_premises_categorization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        premisesId INTEGER NOT NULL,
        categorizationType TEXT,
        categorizationActDate TEXT,
        categorizationActNumber TEXT,
        categorizationRank TEXT,
        categorizationValidUntil TEXT,
        foreignCriticalArea TEXT,
        hightInformationRank TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (premisesId) REFERENCES service_premises(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS service_premises_technical_task (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        premisesId INTEGER NOT NULL,
        taskDate TEXT,
        taskNumber TEXT,
        taskClearance TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (premisesId) REFERENCES service_premises(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS service_premises_instrumental_control (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        premisesId INTEGER NOT NULL,
        controlNumber TEXT,
        controlDate TEXT,
        controlTermin TEXT,
        controlPerformer TEXT,
        controlEventDate TEXT,
        permissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (premisesId) REFERENCES service_premises(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS service_premises_special_check (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        premisesId INTEGER NOT NULL,
        checkNumber TEXT,
        checkDate TEXT,
        checkPerformer TEXT,
        checkEventDate TEXT,
        checkPermissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (premisesId) REFERENCES service_premises(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS service_premises_atestation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        premisesId INTEGER NOT NULL,
        attestationRegNumber TEXT,
        attestationRegDate TEXT,
        attestationDsszziDate TEXT,
        attestationDsszziNumber TEXT,
        attestationValidUntil TEXT,
        atestationPerformer TEXT,
        attestationWorkStartDate TEXT,
        attestationWorkEndDate TEXT,
        atestationPermissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (premisesId) REFERENCES service_premises(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS service_premises_protection_means (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        premisesId INTEGER NOT NULL,
        categoryId INTEGER,
        name TEXT,
        serialNumber TEXT,
        invertarNumber TEXT,
        releaseYear INTEGER,
        manufacturerExploitationTerm TEXT,
        certificateInfo TEXT,
        toolType TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (premisesId) REFERENCES service_premises(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS service_premises_governmental_communication_means (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        premisesId INTEGER NOT NULL,
        subscriberDeviceName TEXT,
        subscriberDeviceSerialNumber TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (premisesId) REFERENCES service_premises(id) ON DELETE CASCADE
      )
    `);

    db.run(
      `
      CREATE TABLE IF NOT EXISTS service_premises_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        premisesId INTEGER NOT NULL,
        orderType TEXT,
        number TEXT,
        date TEXT,
        publisher TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (premisesId) REFERENCES service_premises(id) ON DELETE CASCADE
      )
    `,
    );

    // Таблиці для krt
    db.run(`
      CREATE TABLE IF NOT EXISTS krt (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT,
        premisesNumber TEXT,
        subdivisionName TEXT NOT NULL,
        subdivisionType TEXT,
        serviceName TEXT,
        systemName TEXT NOT NULL,
        passportNumber TEXT,
        passportDate TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS krt_categorization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        krtId INTEGER NOT NULL,
        categorizationType TEXT,
        categorizationActDate TEXT,
        categorizationActNumber TEXT,
        categorizationRank TEXT,
        categorizationValidUntil TEXT,
        foreignCriticalArea TEXT,
        hightInformationRank TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (krtId) REFERENCES krt(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS krt_technical_task (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        krtId INTEGER NOT NULL,
        taskDate TEXT,
        taskNumber TEXT,
        taskClearance TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (krtId) REFERENCES krt(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS krt_instrumental_control (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        krtId INTEGER NOT NULL,
        controlNumber TEXT,
        controlDate TEXT,
        controlTermin TEXT,
        controlPerformer TEXT,
        controlEventDate TEXT,
        permissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (krtId) REFERENCES krt(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS krt_special_check (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        krtId INTEGER NOT NULL,
        checkNumber TEXT,
        checkDate TEXT,
        checkPerformer TEXT,
        checkEventDate TEXT,
        checkPermissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (krtId) REFERENCES krt(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS krt_atestation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        krtId INTEGER NOT NULL,
        attestationRegNumber TEXT,
        attestationRegDate TEXT,
        attestationDsszziDate TEXT,
        attestationDsszziNumber TEXT,
        attestationValidUntil TEXT,
        atestationPerformer TEXT,
        attestationWorkStartDate TEXT,
        attestationWorkEndDate TEXT,
        atestationPermissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (krtId) REFERENCES krt(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS krt_protection_means (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        krtId INTEGER NOT NULL,
        categoryId INTEGER,
        name TEXT,
        serialNumber TEXT,
        invertarNumber TEXT,
        releaseYear INTEGER,
        manufacturerExploitationTerm TEXT,
        certificateInfo TEXT,
        toolType TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (krtId) REFERENCES krt(id) ON DELETE CASCADE
      )
    `);

    db.run(
      `
      CREATE TABLE IF NOT EXISTS krt_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        krtId INTEGER NOT NULL,
        orderType TEXT,
        number TEXT,
        date TEXT,
        publisher TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (krtId) REFERENCES krt(id) ON DELETE CASCADE
      )
    `,
    );

    // Таблиці для iks
    db.run(`
      CREATE TABLE IF NOT EXISTS iks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemClass TEXT NOT NULL,
        systemName TEXT NOT NULL,
        accessMode TEXT,
        kzzName TEXT,
        kzzSerial TEXT,
        kzzExpertOpinionNumber TEXT,
        kzzExpertOpinionDate TEXT,
        kzzManufacturerExploitationTerm TEXT,
        antivirus TEXT,
        antivirusOpinionNumber TEXT,
        antivirusOpinionDate TEXT,
        serversCount INTEGER,
        workstationsCount INTEGER,
        networkEquipmentCount INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS iks_categorization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iksId INTEGER NOT NULL,
        categorizationType TEXT,
        categorizationActDate TEXT,
        categorizationActNumber TEXT,
        categorizationRank TEXT,
        categorizationValidUntil TEXT,
        foreignCriticalArea TEXT,
        hightInformationRank TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (iksId) REFERENCES iks(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS iks_computer_equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iksId INTEGER NOT NULL,
        serversCount INTEGER,
        workstationsCount INTEGER,
        networkEquipmentCount INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (iksId) REFERENCES iks(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS iks_atestation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iksId INTEGER NOT NULL,
        attestationRegNumber TEXT,
        attestationRegDate TEXT,
        attestationDsszziDate TEXT,
        attestationDsszziNumber TEXT,
        attestationValidUntil TEXT,
        atestationPerformer TEXT,
        attestationWorkStartDate TEXT,
        attestationWorkEndDate TEXT,
        atestationPermissionPerformer TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (iksId) REFERENCES iks(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS iks_compliance_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iksId INTEGER NOT NULL,
        documentType TEXT,
        dsszzіNumber TEXT,
        dsszzіDate TEXT,
        validUntil TEXT,
        expertOpinionNumber TEXT,
        expertOpinionDate TEXT,
        inclusionDate TEXT,
        serialNumberInList TEXT,
        nextAuthorizationDeadline TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (iksId) REFERENCES iks(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS iks_protection_means (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iksId INTEGER NOT NULL,
        categoryId INTEGER,
        name TEXT,
        serialNumber TEXT,
        invertarNumber TEXT,
        releaseYear INTEGER,
        manufacturerExploitationTerm TEXT,
        certificateInfo TEXT,
        toolType TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (iksId) REFERENCES iks(id) ON DELETE CASCADE
      )
    `);

    db.run(
      `
      CREATE TABLE IF NOT EXISTS iks_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iksId INTEGER NOT NULL,
        orderType TEXT,
        number TEXT,
        date TEXT,
        publisher TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (iksId) REFERENCES iks(id) ON DELETE CASCADE
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

    // Таблиця для засобів ТЗІ на складі (не встановлені на об'єктах)
    db.run(`
      CREATE TABLE IF NOT EXISTS protection_means_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoryId INTEGER,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        serialNumber TEXT,
        invertarNumber TEXT,
        releaseYear TEXT,
        manufacturerExploitationTerm TEXT,
        certificateInfo TEXT,
        status TEXT DEFAULT 'in_stock',
        inStockDate TEXT,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Додати колону categoryId до існуючих таблиць, якщо вона ще не існує
    db.run(
      `
      ALTER TABLE protection_means_inventory
      ADD COLUMN categoryId INTEGER
    `,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log(
            'ℹ️ categoryId колона вже існує в protection_means_inventory або DB оновлена',
          );
        }
      },
    );

    db.run(
      `
      ALTER TABLE class_a_systems_protection_means
      ADD COLUMN categoryId INTEGER
    `,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log(
            'ℹ️ categoryId колона вже існує в class_a_systems_protection_means',
          );
        }
      },
    );

    db.run(
      `
      ALTER TABLE service_premises_protection_means
      ADD COLUMN categoryId INTEGER
    `,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log(
            'ℹ️ categoryId колона вже існує в service_premises_protection_means',
          );
        }
      },
    );

    db.run(
      `
      ALTER TABLE krt_protection_means
      ADD COLUMN categoryId INTEGER
    `,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('ℹ️ categoryId колона вже існує в krt_protection_means');
        }
      },
    );

    db.run(
      `
      ALTER TABLE iks_protection_means
      ADD COLUMN categoryId INTEGER
    `,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('ℹ️ categoryId колона вже існує в iks_protection_means');
        }
      },
    );

    // Додати кззCategoryId до таблиці class_a_systems для КЗЗ від НСД
    db.run(
      `
      ALTER TABLE class_a_systems
      ADD COLUMN kzzCategoryId INTEGER
    `,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('ℹ️ kzzCategoryId колона вже існує в class_a_systems');
        }
      },
    );

    // Додати kzzCategoryId до таблиці iks для КЗЗ від НСД
    db.run(
      `
      ALTER TABLE iks
      ADD COLUMN kzzCategoryId INTEGER
    `,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('ℹ️ kzzCategoryId колона вже існує в iks');
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
