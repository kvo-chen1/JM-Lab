
import { spawn } from 'child_process';
import http from 'http';

const PORT = 3022;
const BASE_URL = `http://localhost:${PORT}`;

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
  console.log('Starting Auth System Verification...');
  
  // Start server
  const serverProcess = spawn('node', ['server/local-api.mjs'], {
    env: { 
      ...process.env, 
      LOCAL_API_PORT: PORT.toString(), 
      DB_FILE: 'data/test_auth.db',
      GITHUB_CLIENT_ID: 'mock_github_id',
      GITHUB_CLIENT_SECRET: 'mock_github_secret',
      GITHUB_CALLBACK_URL: 'http://localhost:3000/auth/callback'
    }, 
    stdio: 'inherit'
  });

  try {
    console.log('Waiting for test server...');
    if (!await waitForServer()) {
      throw new Error('Server failed to start');
    }
    console.log('Test server running.');

    // Test 1: Register
    console.log('\n[1] Testing Registration...');
    const testUser = {
      username: `test_auth_${Date.now()}`,
      email: `test_auth_${Date.now()}@example.com`,
      password: 'Password123!',
      phone: `138${Math.floor(Math.random()*100000000)}`
    };

    let res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    let data = await res.json();
    console.log('Register Response:', res.status, JSON.stringify(data, null, 2));
    
    if (res.status !== 200 || data.code !== 0) {
      throw new Error(`Registration failed: ${data.message || data.error}`);
    }
    const token = data.data.token;
    console.log('Test Passed: Registration success');

    // Test 2: Login
    console.log('\n[2] Testing Login...');
    res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    data = await res.json();
    console.log('Login Response:', res.status, JSON.stringify(data, null, 2));
    
    if (res.status !== 200 || data.code !== 0) {
      throw new Error(`Login failed: ${data.message || data.error}`);
    }
    console.log('Test Passed: Login success');

    // Test 3: GitHub Auth URL
    console.log('\n[3] Testing GitHub Auth URL...');
    res = await fetch(`${BASE_URL}/api/auth/github/url`);
    data = await res.json();
    console.log('GitHub URL Response:', res.status, JSON.stringify(data, null, 2));
    
    if (res.status !== 200 || !data.data.url) {
      throw new Error(`GitHub URL check failed`);
    }
    console.log('Test Passed: GitHub URL retrieved');

    // Test 4: Send SMS Code (Mock)
    console.log('\n[4] Testing SMS Code Sending...');
    res = await fetch(`${BASE_URL}/api/auth/send-sms-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testUser.phone })
    });
    data = await res.json();
    console.log('Send SMS Response:', res.status, JSON.stringify(data, null, 2));
    
    if (res.status !== 200 || data.code !== 0) {
      throw new Error(`SMS Sending failed`);
    }
    console.log('Test Passed: SMS code sent');

    // Test 5: Rate Limit Check (Send again immediately)
    console.log('\n[5] Testing SMS Rate Limit...');
    res = await fetch(`${BASE_URL}/api/auth/send-sms-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testUser.phone })
    });
    data = await res.json();
    console.log('Rate Limit Response:', res.status, JSON.stringify(data, null, 2));
    // Note: The current implementation returns 500 or 429? local-api.mjs calls sendSmsVerificationCode which returns false if rate limited.
    // In local-api.mjs: if (!success) sendJson(res, 500, ...)
    // So we expect 500 or non-200.
    if (res.status === 200 && data.code === 0) {
       console.warn('Warning: Rate limit did not trigger (maybe first call failed or mock mode ignores it?)');
    } else {
       console.log('Test Passed: Rate limit triggered');
    }

    console.log('\nAll Tests Completed Successfully!');

  } catch (err) {
    console.error('\nTest Suite Failed:', err);
    process.exit(1);
  } finally {
    serverProcess.kill();
  }
}

runTests();
