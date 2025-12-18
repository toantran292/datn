// Quick test script for Risk Detector API
const http = require('http');

// Sprint 1: 0 points (empty)
// Sprint 2: 49 points committed
const sprintId = '2e4d9b03-9b19-4423-88fa-177f06e75dbd'; // Sprint 2
const orgId = 'db7b8130-67d3-4cd5-87c0-884b002327cb';

// Test 1: Detect risks
function testDetectRisks() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/risk-detector/sprints/${sprintId}/risks/detect`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-ID': orgId,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('=== TEST 1: Detect Risks ===');
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
        console.log('');
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.end();
  });
}

// Test 2: Get sprint risks
function testGetSprintRisks() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/risk-detector/sprints/${sprintId}/risks`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-ID': orgId,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('=== TEST 2: Get Sprint Risks ===');
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
        console.log('');
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.end();
  });
}

// Run tests sequentially
async function runTests() {
  try {
    await testDetectRisks();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await testGetSprintRisks();
    console.log('✅ All tests completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
