import https from 'https';

const data = JSON.stringify({
  repoUrl: "https://github.com/sankri15/codenova-ai"
});

const options = {
  hostname: 'codenova-backend-m8wr.onrender.com',
  port: 443,
  path: '/api/repo/analyze',
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
  res.on('end', () => console.log('Body length:', body.length));
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
