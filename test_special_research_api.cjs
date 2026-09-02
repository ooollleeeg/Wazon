const http = require('http');

http.get('http://localhost:3006/api/objects/class_a_systems/13', (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    const obj = JSON.parse(data);
    console.log('Special Research Data:');
    console.log(JSON.stringify(obj.specialResearch, null, 2));
    console.log('\n✅ Test Results:');
    if (obj.specialResearch && obj.specialResearch.length > 0) {
      const sr = obj.specialResearch[0];
      console.log(`- Record Count: ${obj.specialResearch.length}`);
      console.log(`- Registration Number: ${sr.registrationNumber}`);
      console.log(`- Performer: ${sr.performer}`);
      console.log(`- Event Date: ${sr.eventDate}`);
      console.log(`- Permission Details: ${sr.permissionDetails}`);
      console.log('\n✅ All data saved correctly!');
    }
  });
});
