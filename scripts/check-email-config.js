
import fs from 'fs';
import path from 'path';

// Load .env.local if exists
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    console.log(`Loading ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = {};
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
        if (key && !key.startsWith('#')) {
          config[key] = value;
        }
      }
    });
    return config;
  }
  return {};
}

const envLocal = loadEnv(envLocalPath);
const envMain = loadEnv(envPath);
const env = { ...process.env, ...envMain, ...envLocal };

console.log('\n--- Email Configuration Check ---');
const requiredKeys = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
const secureKey = 'EMAIL_SECURE';

let allPresent = true;
requiredKeys.forEach(key => {
  if (env[key]) {
    console.log(`✅ ${key}: Set (${key === 'EMAIL_PASS' ? '********' : env[key]})`);
  } else {
    console.log(`❌ ${key}: Not Set`);
    allPresent = false;
  }
});

if (env[secureKey]) {
  console.log(`ℹ️  ${secureKey}: ${env[secureKey]}`);
} else {
  console.log(`ℹ️  ${secureKey}: Not Set (Default: false)`);
}

if (!allPresent) {
  console.log('\n⚠️  Email configuration is incomplete. The system will use MOCK mode.');
  console.log('To enable real email sending, please set the missing variables in .env.local');
} else {
  console.log('\n✅ Email configuration is complete.');
}

console.log('\n--- Supabase Configuration Check ---');
const supabaseKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
supabaseKeys.forEach(key => {
  if (env[key]) {
    console.log(`✅ ${key}: Set`);
  } else {
    console.log(`❌ ${key}: Not Set`);
  }
});
