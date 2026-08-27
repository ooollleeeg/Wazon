const http = require('http');

// Test data for editing an existing equipment
const data = JSON.stringify({
  category: 'SearchControl',
  name: 'Multimeter Test - Updated',
  serialNumber: 'SN-123',
  inventoryNumber: 'INV-001',
  releaseYear: 2023,
  technicalCondition: 'Справна',
  price: 150,
  notes: 'Updated test note',
  verifications: [],
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/search-control-equipment/2', // ID of Multimeter Test
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let responseData = '';

  console.log(`📤 PUT Request sent to /api/search-control-equipment/4`);
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}\n`);

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Response: ${responseData}`);
    console.log('\n✅ API test completed!');
    console.log(
      'Now reload the browser to see the success message "успішно оновлено"',
    );
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
});

console.log(`Sending JSON: ${data}\n`);
req.write(data);
req.end();
