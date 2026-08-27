import fetch from 'node-fetch';

const equipmentId = 2; // ID техніки DT9205
const verificationData = {
  deviceName: 'Прилад тест 3',
  serialNumber: 'SN-003',
  certificateRegNumber: '',
  verificationDate: '2026-01-01',
  validUntil: '2027-01-01',
  verificationCost: 0
};

console.log('📤 Відправка недостатної повірки...');

fetch(`http://localhost:3005/api/search-control-equipment/${equipmentId}/verification`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(verificationData)
})
.then(r => r.json())
.then(data => {
  console.log('✅ Результат:', JSON.stringify(data, null, 2));
})
.catch(err => console.error('❌ Помилка:', err));
