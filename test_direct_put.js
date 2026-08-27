import http from 'http';

const data = JSON.stringify({
  category: 'Контрольно-вимірювальна техніка',
  name: 'Мультиметр цифровий DT9205',
  serialNumber: 'DT9205-0042',
  invertarNumber: 'ІНВ-2024-002',
  releaseYear: 2022,
  technicalCondition: 'справна',
  pricePerUnit: 2800,
  notes: 'Останнє калібрування: 2024.01.15',
  verifications: [
    { id: 1, deviceName: null, serialNumber: null, certificateRegNumber: 'ПОВ-2024-2', verificationDate: '2024-01-15', validUntil: '2025-01-15', verificationCost: 500 },
    { id: 0, deviceName: 'Тест через API', serialNumber: 'TEST-API-99', certificateRegNumber: '', verificationDate: '2026-06-01', validUntil: '2027-06-01', verificationCost: 0 }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/search-control-equipment/2',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error(`❌ Помилка: ${e.message}`);
});

req.write(data);
req.end();
