
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3023;
const BASE_URL = `http://localhost:${PORT}`;
const LOG_FILE = path.join(process.cwd(), 'logs', 'email.log');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`${BASE_URL}/api/health/ping`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.end();
      });
      return true;
    } catch (e) {
      await sleep(500);
    }
  }
  return false;
}

async function runTests() {
  console.log('🚀 Starting Email Registration Flow Verification...');
  
  // Clear log file
  if (fs.existsSync(LOG_FILE)) {
    fs.truncateSync(LOG_FILE, 0);
  }

  // Start server
  const serverProcess = spawn('node', ['server/local-api.mjs'], {
    env: { 
      ...process.env, 
      LOCAL_API_PORT: PORT.toString(), 
      DB_FILE: 'data/test_email_reg.db',
      EMAIL_HOST: 'smtp.example.com' // Force mock mode
    }, 
    stdio: 'inherit'
  });

  try {
    console.log('⏳ Waiting for test server...');
    if (!await waitForServer()) {
      throw new Error('Server failed to start');
    }
    console.log('✅ Test server running.');

    const testEmail = `test_reg_${Date.now()}@example.com`;
    console.log(`\n📧 Testing with email: ${testEmail}`);

    // Step 1: Send Register Email Code
    console.log('\n[1] Requesting Verification Code...');
    const res1 = await fetch(`${BASE_URL}/api/auth/send-register-email-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const data1 = await res1.json();
    console.log('Response:', res1.status, JSON.stringify(data1));

    if (res1.status !== 200 || data1.code !== 0) {
      throw new Error('Failed to send verification code');
    }
    console.log('✅ Code request sent successfully.');

    // Step 2: Retrieve Code from Log
    console.log('\n[2] Retrieving Code from Mock Log...');
    await sleep(1000); // Wait for log flush
    
    if (!fs.existsSync(LOG_FILE)) {
      throw new Error('Log file not found');
    }
    
    const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
    // Look for the latest code for this email
    // Log format: [timestamp] [MOCK_CODE] {"to":"...","code":"123456"}
    const lines = logContent.split('\n').filter(l => l.includes('MOCK_CODE') && l.includes(testEmail));
    if (lines.length === 0) {
      throw new Error('No code found in logs');
    }
    
    const lastLine = lines[lines.length - 1];
    const match = lastLine.match(/"code":"(\d{6})"/);
    if (!match) {
      throw new Error('Could not parse code from log');
    }
    
    const code = match[1];
    console.log(`✅ Found Code: ${code}`);

    // Step 3: Register with Code
    console.log('\n[3] Registering with Code...');
    const res2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `user_${Date.now()}`,
        email: testEmail,
        password: 'Password123!',
        code: code
      })
    });
    const data2 = await res2.json();
    console.log('Response:', res2.status, JSON.stringify(data2));

    if (res2.status !== 200 || data2.code !== 0) {
      throw new Error('Registration failed');
    }
    console.log('✅ Registration successful!');

    console.log('\n🎉 All tests passed!');

  } catch (err) {
    console.error('\n❌ Test Failed:', err);
    process.exit(1);
  } finally {
    serverProcess.kill();
  }
}

runTests();
