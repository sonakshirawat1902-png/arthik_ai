const http = require('http');

function testScanBillAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
    });

    const req = http.request(
      {
        host: 'localhost',
        port: 3001,
        path: '/api/scan-bill',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('--- TESTING /api/scan-bill ---');
  try {
    const res = await testScanBillAPI();
    console.log('HTTP Status:', res.status);
    console.log('Extracted Data:', {
      merchantName: res.body.merchantName,
      invoiceNumber: res.body.invoiceNumber,
      lineItemsCount: res.body.lineItems?.length,
      grandTotal: res.body.grandTotal,
      isDemoFallback: res.body.isDemoFallback,
    });
  } catch (e) {
    console.error('API Test Error:', e.message);
  }
}

run();
