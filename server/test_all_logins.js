const http = require('http');

const testUsers = [
  { email: 'abinsonb@gmail.com', pass: 'Welcome@123', name: 'Abinson Babu' },
  { email: 'riyan@gmail.com', pass: 'Riyan@123', name: 'Riyan' },
  { email: 'nikitha@gmail.com', pass: 'Nikitha@123', name: 'Nikitha' },
  { email: 'krishnaindu@gmail.com', pass: 'krishnaindu@123', name: 'Krishnaindu KS' }
];

async function testAll() {
  for (const u of testUsers) {
    await new Promise((resolve) => {
      const data = JSON.stringify({ email: u.email, password: u.pass });
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          const parsed = JSON.parse(body);
          console.log(`[LOGIN TEST] ${u.name} (${u.email}): Status ${res.statusCode} -> Success: ${parsed.success}, Role: ${parsed.user?.globalRole}`);
          resolve();
        });
      });
      req.write(data);
      req.end();
    });
  }
  process.exit(0);
}

testAll();
