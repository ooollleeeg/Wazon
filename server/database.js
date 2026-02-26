import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/oid_registry.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Ошибка подключения:', err);
  else console.log('✓ Подключено к SQLite: oid_registry.db');
});

// Миграция: удалить UNIQUE constraint
db.serialize(() => {
  // Проверяем, нужна ли миграция
  db.all('PRAGMA table_info(personnel)', (err, columns) => {
    if (err) {
      console.error('Ошибка проверки схемы:', err);
      return;
    }

    console.log('Проверка схемы personnel...');

    // Если таблица существует, пересоздаём её без UNIQUE constraint
    db.run(
      `
      CREATE TABLE IF NOT EXISTS personnel_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        position TEXT NOT NULL,
        officialRank TEXT,
        actualRank TEXT,
        fullName TEXT NOT NULL,
        dateOfBirth DATE,
        email TEXT NOT NULL,
        phone TEXT,
        mobilePhone TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) {
          console.error('Ошибка создания personnel_new:', err);
          return;
        }

        // Копируем данные из старой таблицы
        db.run(
          `
        INSERT INTO personnel_new 
        SELECT * FROM personnel
      `,
          (err) => {
            if (err && err.message.includes('no such table')) {
              // Таблица personnel не существует, просто переименовываем новую
              console.log('✓ Таблица personnel создана без UNIQUE constraint');
              return;
            }

            if (err) {
              console.error('Ошибка копирования данных:', err);
              return;
            }

            // Удаляем старую таблицу и переименовываем новую
            db.run(`DROP TABLE personnel`, (err) => {
              if (err) {
                console.error('Ошибка удаления старой таблицы:', err);
                return;
              }

              db.run(`ALTER TABLE personnel_new RENAME TO personnel`, (err) => {
                if (err) {
                  console.error('Ошибка переименования таблицы:', err);
                  return;
                }

                console.log(
                  '✓ Таблица personnel мигрирована успешно (UNIQUE constraint удалён)',
                );
              });
            });
          },
        );
      },
    );
  });

  // Остальные таблицы...
  db.run(
    `
    CREATE TABLE IF NOT EXISTS personnel_education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      personnelId INTEGER NOT NULL,
      institution TEXT NOT NULL,
      yearCompleted INTEGER,
      specialties TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (personnelId) REFERENCES personnel(id) ON DELETE CASCADE
    )
  `,
    (err) => {
      if (err) console.error('Ошибка создания personnel_education:', err);
      else console.log('✓ Таблица personnel_education готова');
    },
  );

  db.run(
    `
    CREATE TABLE IF NOT EXISTS personnel_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      personnelId INTEGER NOT NULL,
      certificateNumber TEXT,
      trainingName TEXT NOT NULL,
      location TEXT,
      year INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (personnelId) REFERENCES personnel(id) ON DELETE CASCADE
    )
  `,
    (err) => {
      if (err) console.error('Ошибка создания personnel_certificates:', err);
      else console.log('✓ Таблица personnel_certificates готова');
    },
  );
});

export default db;
