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
      WHERE kzzName = 'Test KZZ-2026'
    `);
    console.log("✓ Found in kzzName:", asResult.length, "records");
    if (asResult.length > 0) console.log(JSON.stringify(asResult, null, 2));

    console.log("\n=== Checking class_a_systems_protection_means ===");
    const asProtResult = await runQuery(`
      SELECT id, systemId, name, serialNumber 
      FROM class_a_systems_protection_means 
      WHERE name = 'Test KZZ-2026'
    `);
    console.log("Found in protection_means:", asProtResult.length, "records");
    if (asProtResult.length > 0) console.log(JSON.stringify(asProtResult, null, 2));

    console.log("\n=== SUMMARY ===");
    console.log("✓ Test KZZ-2026 is in kzzName field:", asResult.length === 1);
    console.log("✓ Test KZZ-2026 is NOT in protection_means:", asProtResult.length === 0);
    
    if (asResult.length === 1 && asProtResult.length === 0) {
      console.log("\n🎉 SUCCESS! КЗЗ від НСД is correctly placed only in kzzName!");
    } else {
      console.log("\n❌ ISSUE! КЗЗ від НСД may be in wrong location!");
    }

    db.close();
  } catch (err) {
    console.error("Error:", err.message);
    db.close();
  }
}

check();
