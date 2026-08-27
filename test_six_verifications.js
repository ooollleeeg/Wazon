/**
 * Тест: Додавання 6 записів про повірку до однієї техніки
 */
const BASE_URL = 'http://localhost:3005/api';

console.log('🧪 Тест: Додавання 6 повірок до однієї техніки\n');

async function test() {
  try {
    // Крок 1: Додати техніку
    console.log('1️⃣  Додавання техніки...');
    const equipmentResponse = await fetch(
      `${BASE_URL}/search-control-equipment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Контрольно-вимірювальна техніка',
          name: 'Мультиметр цифровий XYZ-2024',
          serialNumber: 'XYZ-SN-000',
          invertarNumber: 'INV-TEST-2024',
          releaseYear: 2024,
          technicalCondition: 'справна',
          pricePerUnit: 5000,
          notes: 'Тестування багатьох повірок',
        }),
      },
    );

    const equipmentData = await equipmentResponse.json();
    const equipmentId = equipmentData.id;
    console.log(`✅ Техніка додана з ID: ${equipmentId}\n`);

    // Крок 2: Додати 6 повірок
    console.log('2️⃣  Додавання 6 повірок...');
    const verifications = [];

    for (let i = 1; i <= 6; i++) {
      const verificationData = {
        deviceName: `Прилад для тестування №${i}`,
        serialNumber: `TEST-SN-${String(i).padStart(3, '0')}`,
        certificateRegNumber: `CERT-TEST-${i}-2024`,
        verificationDate: `2024-${String(11 - i).padStart(2, '0')}-${String(15 + i).padStart(2, '0')}`,
        validUntil: `2025-${String(11 - i).padStart(2, '0')}-${String(15 + i).padStart(2, '0')}`,
        verificationCost: 500 * i,
      };

      console.log(`  📝 Додавання повірки ${i}...`);
      console.log(`     deviceName: "${verificationData.deviceName}"`);
      console.log(`     serialNumber: "${verificationData.serialNumber}"`);

      const verificationResponse = await fetch(
        `${BASE_URL}/search-control-equipment/${equipmentId}/verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verificationData),
        },
      );

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        console.error(`  ❌ Помилка при додаванні повірки ${i}:`, error);
        continue;
      }

      const result = await verificationResponse.json();
      console.log(`  ✅ Повірка ${i} додана з ID: ${result.id}`);
      verifications.push({ ...verificationData, id: result.id });
    }

    console.log(`\n✅ Усього додано повірок: ${verifications.length}\n`);

    // Крок 3: Отримати техніку та перевірити всі повірки
    console.log('3️⃣  Отримання техніки та перевірка всіх повірок...');
    const getResponse = await fetch(
      `${BASE_URL}/search-control-equipment/${equipmentId}`,
    );
    const equipment = await getResponse.json();

    console.log(`\n📊 Отримана техніка: ${equipment.name}`);
    console.log(
      `📈 Кількість повірок: ${equipment.verifications?.length || 0}\n`,
    );

    if (equipment.verifications && equipment.verifications.length > 0) {
      console.log('📋 Список усіх повірок:');
      console.log('─'.repeat(100));
      equipment.verifications.forEach((ver, idx) => {
        console.log(`\n${idx + 1}. Повірка ID ${ver.id}:`);
        console.log(`   Назва: ${ver.deviceName || 'ВІДСУТНЯ'}`);
        console.log(`   Серійний номер: ${ver.serialNumber || 'ВІДСУТНЯ'}`);
        console.log(`   Сертифікат: ${ver.certificateRegNumber || 'ВІДСУТНЯ'}`);
        console.log(`   Дата реєстрації: ${ver.verificationDate}`);
        console.log(`   Дійсне до: ${ver.validUntil}`);
        console.log(`   Вартість: ${ver.verificationCost} грн`);
      });
      console.log('\n' + '─'.repeat(100));

      // Статистика
      const allHaveDeviceName = equipment.verifications.every(
        (v) => v.deviceName,
      );
      const allHaveSerialNumber = equipment.verifications.every(
        (v) => v.serialNumber,
      );

      console.log('\n✅ СТАТИСТИКА:');
      console.log(`   Усього повірок: ${equipment.verifications.length}/6`);
      console.log(
        `   Усі мають deviceName: ${allHaveDeviceName ? '✅' : '❌'}`,
      );
      console.log(
        `   Усі мають serialNumber: ${allHaveSerialNumber ? '✅' : '❌'}`,
      );

      if (equipment.verifications.length === 6) {
        console.log('\n🎉 УСПІХ! Усі 6 повірок успішно збережені і отримані!');
      } else {
        console.log(
          `\n⚠️  УВАГА! Очікувалось 6 повірок, отримано ${equipment.verifications.length}`,
        );
      }
    }

    // Крок 4: Видалити техніку
    console.log('\n4️⃣  Очистка: Видалення техніки...');
    await fetch(`${BASE_URL}/search-control-equipment/${equipmentId}`, {
      method: 'DELETE',
    });
    console.log('✅ Техніка видалена\n');
  } catch (err) {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
  }
}

test();
