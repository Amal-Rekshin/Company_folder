require('dotenv').config();
const http = require('http');
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: 'localhost', port: 8080, path: '/api' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      }
    };
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function httpReq(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'localhost', port: 8080, path: '/api' + path,
      method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      }
    };
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const client = await pool.connect();
  try {
    // 1. Reset Vasanth's password to 'test1234'
    const newHash = await bcrypt.hash('test1234', 10);
    await client.query(
      "UPDATE users SET password_hash = $1 WHERE email = 'vasanh@gmail.com'",
      [newHash]
    );
    console.log('✅ Reset Vasanth password to: test1234');

    // 2. Login as admin
    const adminLogin = await post('/auth/login', { email: 'admin@cctv.com', password: 'password123' });
    const adminToken = adminLogin.body.accessToken;
    console.log('Admin login:', adminLogin.status === 200 ? 'OK' : 'FAILED');

    // 3. Login as Vasanth
    const partnerLogin = await post('/auth/login', { email: 'vasanh@gmail.com', password: 'test1234' });
    const partnerToken = partnerLogin.body.accessToken;
    console.log('Partner login:', partnerLogin.status === 200 ? 'OK' : 'FAILED', partnerLogin.body.role || partnerLogin.body.error);

    if (!partnerToken) return;

    // 4. Get my assigned tickets
    const tickets = await httpReq('GET', '/tickets/my-assigned', null, partnerToken);
    console.log('\nMy assigned tickets (status', tickets.status + '):');
    if (Array.isArray(tickets.body)) {
      tickets.body.forEach(t => {
        console.log(`  - ${t.ticketNumber} | ticketStatus: ${t.status} | assignmentId: ${t.assignmentId} | assignmentStatus: ${t.assignmentStatus}`);
      });

      // 5. Accept first pending assignment
      const pending = tickets.body.find(t => t.assignmentStatus === 'pending');
      if (pending && pending.assignmentId) {
        console.log('\nAccepting assignment:', pending.assignmentId);
        const r = await httpReq('PATCH', '/partner-assignments/' + pending.assignmentId + '/accept', {}, partnerToken);
        console.log('Accept response:', r.status, JSON.stringify(r.body));
      } else {
        console.log('No pending assignment found. statuses:', tickets.body.map(t => t.assignmentStatus));
      }
    } else {
      console.log('Unexpected response:', tickets.body);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
