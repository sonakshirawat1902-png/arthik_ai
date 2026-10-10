const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: 'localhost',
        port: 3001,
        path: path,
        method: method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, body: json });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runAudit() {
  console.log('--- ARTHIK AI API AUDIT ---');

  // 1. Health
  try {
    const health = await makeRequest('/api/health');
    console.log('1. GET /api/health:', health.status, health.body);
  } catch (e) {
    console.error('1. GET /api/health FAILED:', e.message);
  }

  // 2. Metrics
  try {
    const metrics = await makeRequest('/api/metrics');
    console.log('2. GET /api/metrics:', metrics.status, {
      business: metrics.body.business,
      totalRevenue: metrics.body.totalRevenue,
      totalNetProfit: metrics.body.totalNetProfit,
      salesCount: metrics.body.recordCounts?.sales,
    });
  } catch (e) {
    console.error('2. GET /api/metrics FAILED:', e.message);
  }

  // 3. AI Endpoint
  try {
    const ai = await makeRequest('/api/ai', 'POST', { question: 'What is our top revenue product?' });
    console.log('3. POST /api/ai:', ai.status, {
      answerLength: ai.body.answer?.length,
      sample: ai.body.answer?.slice(0, 100) + '...',
    });
  } catch (e) {
    console.error('3. POST /api/ai FAILED:', e.message);
  }
}

runAudit();
