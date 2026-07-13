import https from 'https';

const data = JSON.stringify({
  sessionId: "test-session-2",
  owner: "sankri15",
  repo: "codenova-ai"
});

const options = {
  hostname: 'codenova-backend-production-2db0.up.railway.app',
  port: 443,
  path: '/api/ai/embed',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const startTime = Date.now();

const req = https.request(options, (res) => {
  const elapsed = Date.now() - startTime;
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`Time taken: ${elapsed}ms`);
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => console.log('Body:', body));
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
