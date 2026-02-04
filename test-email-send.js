import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Manually load .env.local if it exists
if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

import { sendLoginEmailCode } from './server/emailService.mjs';

console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_USER:', process.env.EMAIL_USER);

async function test() {
  const email = '15959365938@qq.com'; 
  console.log(`Testing email sending to ${email}...`);
  try {
    const success = await sendLoginEmailCode(email, '123456');
    if (success) {
      console.log('Email sent successfully!');
    } else {
      console.error('Email sending failed.');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

test();
