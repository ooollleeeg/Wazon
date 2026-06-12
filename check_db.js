import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('data/vazon.db');

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function check() {
  try {
    console.log("\n=== Checking class_a_systems kzzName field ===");
    const asResult = await runQuery(`
      SELECT id, systemName, kzzName, kzzSerial 
      FROM class_a_systems 
      WHERE kzzName LIKE '%Test KZZ%'
    `);
    console.log("Count:", asResult.length);
    console.log(JSON.stringify(asResult, null, 2));

    console.log("\n=== Checking class_a_systems_protection_means ===");
    const asProtResult = await runQuery(`
      SELECT id, mean_name, mean_serial, category 
      FROM class_a_systems_protection_means 
      WHERE mean_name LIKE '%Test KZZ%'
    `);
    console.log("Count:", asProtResult.length);
    console.log(JSON.stringify(asProtResult, null, 2));

    console.log("\n=== Checking protection_means_inventory for Test KZZ ===");
    const inventoryResult = await runQuery(`
      SELECT id, name, serial, category 
      FROM protection_means_inventory 
      WHERE name LIKE '%Test KZZ%'
    `);
    console.log("Count:", inventoryResult.length);
    console.log(JSON.stringify(inventoryResult, null, 2));

    db.close();
    console.log("\n✓ Database check complete!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    db.close();
  }
}

check();
