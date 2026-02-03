
import fetch from 'node-fetch';

const API_URL = 'http://127.0.0.1:3022'; // Default backend port

async function run() {
  console.log('--- Diagnosis & Reproduction Start ---');
  
  const timestamp = Date.now();
  const username = `repro_user_${timestamp}`;
  const email = `repro_${timestamp}@example.com`;
  const password = 'Password123!';

  // 1. Register
  console.log(`1. Registering user: ${username}`);
  const regRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  
  const regData = await regRes.json();
  if (!regRes.ok) {
    console.error('Registration failed:', regData);
    // Try login if user exists (unlikely given timestamp)
    return;
  }
  console.log('Registration success.');

  // 2. Login
  console.log('2. Logging in...');
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    return;
  }
  
  const token = loginData.data.token;
  console.log('Login success. Token obtained.');

  // 3. Attempt Invalid Update
  console.log('3. Attempting Invalid Update (Bug Reproduction)...');
  
  // Create a 2MB fake image string
  const hugeAvatar = 'data:image/jpeg;base64,' + 'a'.repeat(2 * 1024 * 1024);
  
  const invalidPayload = {
    username: 'a', // Too short (should be min 2)
    phone: 'not-a-number', // Invalid phone
    age: -5, // Invalid age
    avatar: hugeAvatar // Too large
  };

  const updateRes = await fetch(`${API_URL}/api/users/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(invalidPayload)
  });

  const updateData = await updateRes.json();
  
  if (updateRes.ok) {
    console.log('⚠️  BUG REPRODUCED: Backend accepted invalid data!');
    console.log('Response:', JSON.stringify(updateData).substring(0, 200) + '...');
    if (updateData.data.username === 'a') console.log('- Username updated to "a" (Too short)');
    if (updateData.data.phone === 'not-a-number') console.log('- Phone updated to "not-a-number" (Invalid format)');
    // Check avatar length in DB logic is hard from here, but success 200 is enough proof.
  } else {
    console.log('✅ Backend rejected invalid data (Bug NOT reproduced or already fixed).');
    console.log('Error:', updateData);
  }

  // 4. Attempt Valid Update (Regression Test)
  console.log('4. Attempting VALID Update (Regression Test)...');
  const validPayload = {
    username: `valid_${timestamp}`,
    phone: '13800138000',
    age: 25,
    interests: 'coding, reading'
    // avatar: keep original
  };
  
  const validRes = await fetch(`${API_URL}/api/users/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(validPayload)
  });
  
  const validData = await validRes.json();
  if (validRes.ok) {
    console.log('✅ Valid update succeeded.');
  } else {
    console.error('❌ Valid update FAILED!', validData);
  }
}

run().catch(console.error);
