
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env.local');
console.log('Looking for .env.local at:', envPath);

let envConfig = {};
if (fs.existsSync(envPath)) {
    console.log('Found .env.local');
    const fileContent = fs.readFileSync(envPath);
    envConfig = dotenv.parse(fileContent);
} else {
    console.log('.env.local not found');
    const defaultEnvPath = path.resolve(__dirname, '../../.env');
    console.log('Looking for .env at:', defaultEnvPath);
    if (fs.existsSync(defaultEnvPath)) {
        console.log('Found .env');
        envConfig = dotenv.parse(fs.readFileSync(defaultEnvPath));
    }
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function forceCleanup() {
  console.log('Starting FORCE cleanup of public.users...');
  
  // 1. Delete users with test domains
  const domains = ['@example.com', '@test.com', '@repro.com'];
  for (const domain of domains) {
      console.log(`Deleting users with domain ${domain}...`);
      const { error, count } = await supabase
          .from('users')
          .delete({ count: 'exact' })
          .ilike('email', `%${domain}`);
      
      if (error) console.error(`Error deleting ${domain}:`, error.message);
      else console.log(`Deleted ${count} users with ${domain}`);
  }

  // 2. Delete users with "user_3100..." username pattern (from screenshot)
  console.log('Deleting users with "user_3100%" pattern...');
  const { error: userError, count: userCount } = await supabase
      .from('users')
      .delete({ count: 'exact' })
      .ilike('username', 'user_3100%');
  
  if (userError) console.error('Error deleting username pattern:', userError.message);
  else console.log(`Deleted ${userCount} users with username pattern`);

  // 3. Delete users with specific known test emails from screenshot
  const specificEmails = [
      'admin2@example.com',
      'test28@example.com', 
      'test1@example.com',
      'test2@example.com',
      'test3@example.com'
  ];
  
  const { error: specificError, count: specificCount } = await supabase
      .from('users')
      .delete({ count: 'exact' })
      .in('email', specificEmails);

  if (specificError) console.error('Error deleting specific emails:', specificError.message);
  else console.log(`Deleted ${specificCount} specific test users`);

  // 4. Clean up users with invalid emails (numbers only)
  // We can't use regex easily with Supabase client, so we fetch and delete
  console.log('Scanning for invalid emails (digits only)...');
  const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email');
      
  if (fetchError) {
      console.error('Fetch error:', fetchError);
  } else if (users) {
      const idsToDelete = users
          .filter(u => /^\d+$/.test(u.email)) // Email contains only digits
          .map(u => u.id);
          
      if (idsToDelete.length > 0) {
          console.log(`Found ${idsToDelete.length} users with invalid emails. Deleting...`);
          const { error: deleteInvalidError } = await supabase
              .from('users')
              .delete()
              .in('id', idsToDelete);
              
          if (deleteInvalidError) console.error('Error deleting invalid emails:', deleteInvalidError);
          else console.log('Deleted users with invalid emails');
      } else {
          console.log('No invalid email formats found.');
      }
  }

  console.log('Force cleanup complete.');
}

forceCleanup();
