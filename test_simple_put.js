import http from 'http';

const data = JSON.stringify({
  category: 'Measurement',
  name: 'Multimeter Test',
  serialNumber: 'SN-123',
  invertarNumber: 'INV-001',
  releaseYear: 2022,
  technicalCondition: 'справна',
  pricePerUnit: 100,
  notes: 'Test note',
  verifications: [
    { id: 0, deviceName: 'Test Device', serialNumber: 'TST-999', certificateRegNumber: '', verificationDate: '2026-06-01', validUntil: '2027-06-01', verificationCost: 0 }
  ]
});

console.log('Sending JSON:', data);
console.log('Length:', data.length);

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/search-control-equipment/2',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
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
  console.error(`Error: ${e.message}`);
});

req.write(data);
req.end();
