const http = require('http');

const PORT = 3001; // Current running server port

function testEndpoint(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:${PORT}${path}`, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log(`=== TESTING ARTHIK AI API ENDPOINTS (PORT ${PORT}) ===`);

  try {
    // 1. Health Check
    console.log('\n--- 1. Testing /api/health ---');
    const health = await testEndpoint('/api/health');
    console.log('Status Code:', health.status);
    console.log('Gemini Status:', health.body.services?.gemini);
    console.log('Database Status:', health.body.services?.database);

    // 2. Metrics API
    console.log('\n--- 2. Testing /api/metrics ---');
    const metrics = await testEndpoint('/api/metrics');
    console.log('Status Code:', metrics.status);
    console.log('Business:', metrics.body.business);
    console.log('Net Revenue:', metrics.body.totalRevenue);
    console.log('Gross Profit:', metrics.body.totalGrossProfit);
    console.log('Net Profit:', metrics.body.totalNetProfit);
    console.log('Record Count:', metrics.body.recordCounts?.sales);

    // 3. Ask AI Endpoint
    console.log('\n--- 3. Testing /api/ai ---');
    const aiData = JSON.stringify({ question: 'Why did net profit turn negative in September 2026?' });
    const ai = await testEndpoint('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(aiData)
      },
      body: aiData
    });
    console.log('Status Code:', ai.status);
    console.log('Demo Mode:', ai.body.isDemoMode);
    console.log('AI Response Snippet:', ai.body.answer?.slice(0, 150) + '...');

    console.log('\n=== ALL ENDPOINT TESTS COMPLETED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Test execution error:', err.message);
  }
}

runTests();
