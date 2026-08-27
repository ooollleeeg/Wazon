/**
 * Тестування функціональності зберігання даних про метрологічну повірку
 */

const BASE_URL = 'http://localhost:3005/api';

// Кольори для консолі
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Тест 1: Додавання нової техніки з повірками
async function testAddEquipmentWithVerification() {
  log('\n=== ТЕСТ 1: Додавання нової техніки з повіркою ===', 'blue');

  const newEquipment = {
    category: 'Контрольно-вимірювальна техніка',
    name: 'Генератор сигналів',
    serialNumber: 'GEN-2024-001',
    invertarNumber: 'ІНВ-001',
    releaseYear: 2023,
    technicalCondition: 'справна',
    pricePerUnit: 5000,
    notes: 'Тестові дані',
    verifications: [
      {
        deviceName: 'Генератор сигналів GEN-2024',
        serialNumber: 'SN-123456',
        certificateRegNumber: 'СЕРТИФІКАТ-001',
        verificationDate: '2024-03-15',
        validUntil: '2025-03-15',
        verificationCost: 500,
      },
    ],
  };

  try {
    const response = await fetch(`${BASE_URL}/search-control-equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEquipment),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    log(`✅ Техніка додана з ID: ${result.id}`, 'green');
    return result.id;
  } catch (err) {
    log(`❌ Помилка: ${err.message}`, 'red');
    return null;
  }
}

// Тест 2: Додавання повірки до існуючої техніки
async function testAddVerificationToEquipment(equipmentId) {
  if (!equipmentId) {
    log('❌ Equipment ID відсутній', 'red');
    return false;
  }

  log('\n=== ТЕСТ 2: Додавання повірки до існуючої техніки ===', 'blue');

  const verification = {
    deviceName: 'Генератор сигналів GEN-2025',
    serialNumber: 'SN-789012',
    certificateRegNumber: 'СЕРТИФІКАТ-002',
    verificationDate: '2025-06-20',
    validUntil: '2026-06-20',
    verificationCost: 750,
  };

  try {
    const response = await fetch(
      `${BASE_URL}/search-control-equipment/${equipmentId}/verification`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verification),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    log(`✅ Повірка додана з ID: ${result.id}`, 'green');
    return result.id;
  } catch (err) {
    log(`❌ Помилка: ${err.message}`, 'red');
    return null;
  }
}

// Тест 3: Отримання техніки з повіркою
async function testGetEquipmentWithVerification(equipmentId) {
  if (!equipmentId) {
    log('❌ Equipment ID відсутній', 'red');
    return null;
  }

  log('\n=== ТЕСТ 3: Отримання техніки з повіркою ===', 'blue');

  try {
    const response = await fetch(
      `${BASE_URL}/search-control-equipment/${equipmentId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    log(`✅ Техніка отримана: ${data.name}`, 'green');

    if (data.verifications && data.verifications.length > 0) {
      log(`✅ Знайдено ${data.verifications.length} повірок:`, 'green');
      data.verifications.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.deviceName} (S/N: ${v.serialNumber})`);
        console.log(`     Дата реєстрації: ${v.verificationDate}`);
        console.log(`     Дійсне до: ${v.validUntil}`);
      });
    } else {
      log('⚠️ Повірок не знайдено', 'yellow');
    }

    return data;
  } catch (err) {
    log(`❌ Помилка: ${err.message}`, 'red');
    return null;
  }
}

// Тест 4: Редагування техніки
async function testEditEquipment(equipmentId) {
  if (!equipmentId) {
    log('❌ Equipment ID відсутній', 'red');
    return false;
  }

  log('\n=== ТЕСТ 4: Редагування техніки ===', 'blue');

  const updatedData = {
    category: 'Контрольно-вимірювальна техніка',
    name: 'Генератор сигналів (оновлено)',
    serialNumber: 'GEN-2024-001-UPDATED',
    invertarNumber: 'ІНВ-001-UPDATED',
    releaseYear: 2023,
    technicalCondition: 'справна',
    pricePerUnit: 5500,
    notes: 'Оновлено під час тестування',
  };

  try {
    const response = await fetch(
      `${BASE_URL}/search-control-equipment/${equipmentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    log(`✅ Техніка успішно оновлена`, 'green');
    return true;
  } catch (err) {
    log(`❌ Помилка: ${err.message}`, 'red');
    return false;
  }
}

// Тест 5: Видалення повірки
async function testDeleteVerification(equipmentId, verificationId) {
  if (!equipmentId || !verificationId) {
    log('❌ Equipment ID або Verification ID відсутні', 'red');
    return false;
  }

  log('\n=== ТЕСТ 5: Видалення повірки ===', 'blue');

  try {
    const response = await fetch(
      `${BASE_URL}/search-control-equipment/${equipmentId}/verification/${verificationId}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    log(`✅ Повірка видалена`, 'green');
    return true;
  } catch (err) {
    log(`❌ Помилка: ${err.message}`, 'red');
    return false;
  }
}

// Тест 6: Видалення техніки
async function testDeleteEquipment(equipmentId) {
  if (!equipmentId) {
    log('❌ Equipment ID відсутній', 'red');
    return false;
  }

  log('\n=== ТЕСТ 6: Видалення техніки ===', 'blue');

  try {
    const response = await fetch(
      `${BASE_URL}/search-control-equipment/${equipmentId}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    log(`✅ Техніка видалена`, 'green');
    return true;
  } catch (err) {
    log(`❌ Помилка: ${err.message}`, 'red');
    return false;
  }
}

// Запуск всіх тестів
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║   ТЕСТУВАННЯ ФУНКЦІОНАЛЬНОСТІ МЕТРОЛОГІЧНОЇ ПОВІРКИ    ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  let equipmentId = null;
  let verificationId = null;

  // Тест 1
  equipmentId = await testAddEquipmentWithVerification();

  if (equipmentId) {
    // Тест 3 - перевірка після додавання
    const equipment = await testGetEquipmentWithVerification(equipmentId);
    if (equipment?.verifications?.length > 0) {
      verificationId = equipment.verifications[0].id;
    }

    // Тест 2
    const newVerificationId = await testAddVerificationToEquipment(equipmentId);
    if (newVerificationId) {
      verificationId = newVerificationId;
    }

    // Тест 3 - перевірка після додавання другої повірки
    await testGetEquipmentWithVerification(equipmentId);

    // Тест 4
    await testEditEquipment(equipmentId);

    // Тест 3 - перевірка після редагування
    await testGetEquipmentWithVerification(equipmentId);

    // Тест 5 - видалення однієї повірки
    if (verificationId) {
      await testDeleteVerification(equipmentId, verificationId);

      // Тест 3 - перевірка після видалення повірки
      await testGetEquipmentWithVerification(equipmentId);
    }

    // Тест 6 - видалення техніки
    await testDeleteEquipment(equipmentId);
  }

  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║              ТЕСТУВАННЯ ЗАВЕРШЕНО                      ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝\n', 'blue');
}

// Запуск
runAllTests().catch((err) => {
  log(`\nFatal Error: ${err.message}`, 'red');
  process.exit(1);
});
