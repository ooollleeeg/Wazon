/**
 * Тест додавання однієї повірки та перевірки БД
 */
const BASE_URL = 'http://localhost:3005/api';

console.log('🧪 Тест: Додавання повірки та перевірка в БД\n');

async function test() {
  // Кроз 1: Додати техніку
  console.log('1️⃣  Додавання техніки...');
  const equipmentResponse = await fetch(
    `${BASE_URL}/search-control-equipment`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Контрольно-вимірювальна техніка',
        name: 'Тестовий генератор',
        serialNumber: 'TEST-SN-001',
        invertarNumber: 'TEST-INV-001',
        releaseYear: 2024,
        technicalCondition: 'справна',
        pricePerUnit: 1000,
        notes: 'Тестові дані',
      }),
    },
  );

  const equipmentData = await equipmentResponse.json();
  const equipmentId = equipmentData.id;
  console.log(`✅ Техніка додана з ID: ${equipmentId}\n`);

  // Крок 2: Додати повірку
  console.log('2️⃣  Додавання повірки...');
  const verificationData = {
    deviceName: 'Генератор тестовий GEN-TEST-2024',
    serialNumber: 'VERIFICATION-SN-12345',
    certificateRegNumber: 'CERT-TEST-2024-001',
    verificationDate: '2024-11-15',
    validUntil: '2025-11-15',
    verificationCost: 1500,
  };

  console.log('Дані для відправки:', verificationData);

  const verificationResponse = await fetch(
    `${BASE_URL}/search-control-equipment/${equipmentId}/verification`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationData),
    },
  );

  const verResult = await verificationResponse.json();
  console.log(`✅ Повірка додана з ID: ${verResult.id}\n`);

  // Крок 3: Отримати техніку та перевірити повірку
  console.log('3️⃣  Отримання техніки та перевірка повірки...');
  const getResponse = await fetch(
    `${BASE_URL}/search-control-equipment/${equipmentId}`,
  );
  const equipment = await getResponse.json();

  console.log('Отримана техніка:');
  console.log(`  Назва: ${equipment.name}`);
  console.log(`  ID: ${equipment.id}`);
  console.log(`  Повірок: ${equipment.verifications?.length || 0}\n`);

  if (equipment.verifications && equipment.verifications.length > 0) {
    const ver = equipment.verifications[0];
    console.log('Отримана повірка:');
    console.log(`  deviceName: "${ver.deviceName}"`);
    console.log(`  serialNumber: "${ver.serialNumber}"`);
    console.log(`  certificateRegNumber: "${ver.certificateRegNumber}"`);
    console.log(`  verificationDate: ${ver.verificationDate}`);
    console.log(`  validUntil: ${ver.validUntil}`);
    console.log(`  verificationCost: ${ver.verificationCost}`);
  }

  // Крок 4: Видалити техніку
  console.log('\n4️⃣  Очистка: Видалення техніки...');
  await fetch(`${BASE_URL}/search-control-equipment/${equipmentId}`, {
    method: 'DELETE',
  });
  console.log('✅ Техніка видалена\n');
}

test().catch((err) => {
  console.error('❌ Помилка:', err.message);
  process.exit(1);
});
