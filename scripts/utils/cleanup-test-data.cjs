
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
// scripts/utils/cleanup-test-data.cjs -> scripts/utils -> scripts -> root
const envPath = path.resolve(__dirname, '../../.env.local');
console.log('Looking for .env.local at:', envPath);

// Handle case where .env.local doesn't exist (e.g. CI), fall back to .env
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
  console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.log('Current URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('Current Key:', serviceRoleKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    // Add global headers if needed
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' },
    },
  });
  
  // Debug: Print connection info
  console.log('Connecting to Supabase:', supabaseUrl);
  // console.log('Service Key starts with:', serviceRoleKey.substring(0, 10));

  async function cleanupTestData() {
  console.log('Starting data cleanup process...');
  console.log('Target: Remove mock/test users and their associated data.');

  let deletedCount = 0;
  let errorCount = 0;
  let page = 0;
  const pageSize = 50;

  try {
    // 1. Fetch all users
    let hasMore = true;
    
    while (hasMore) {
      // If listUsers() returns empty, it might be that the Service Role Key doesn't have permission 
      // or the users are not visible to the API for some reason.
      // Let's try to delete a known test user directly by ID to verify permissions.
      // Based on previous logs/images, here is a known ID: 0253a7d0-d236-4cbd-85fc-f41e454411b8 (test177... from image)
      // But IDs might have changed. Let's assume listUsers is failing silently or returning empty.
      
      // Let's try to output the full response structure to debug
      const rawResponse = await supabase.auth.admin.listUsers();
      console.log('Full response keys:', Object.keys(rawResponse));
      if (rawResponse.data) {
          console.log('Data keys:', Object.keys(rawResponse.data));
      }
      
      const { data: { users }, error } = rawResponse;

      if (error) {
        console.error('List users error:', error);
        throw error;
      }
      
      console.log('List users response users length:', users ? users.length : 0);

      if (!users || users.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Scanning page ${page + 1}, found ${users.length} users...`);
      console.log('Users found:', users.map(u => u.email)); // Debug: list all emails

      for (const user of users) {
        // 2. Identify test users
        // Pattern: ending with @example.com, or starting with test, repro, etc.
        const isTestUser = 
          user.email.includes('@example.com') || 
          user.email.includes('@test.com') || 
          user.email.startsWith('test') || 
          user.email.startsWith('repro') ||
          user.email.startsWith('u17') ||
          user.email.startsWith('admin') ||
          (user.user_metadata && user.user_metadata.is_mock === true);

        if (isTestUser) {
          console.log(`Deleting test user: ${user.email} (${user.id})`);
          
          // 3. Delete user (Cascade will handle public tables)
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
          
          if (deleteError) {
            console.error(`Failed to delete user ${user.email}:`, deleteError.message);
            errorCount++;
          } else {
            console.log(`Successfully deleted user ${user.email}`);
            deletedCount++;
          }
        } else {
          console.log(`Skipping real user: ${user.email}`);
        }
      }

      // Check if we reached the end
      if (users.length < pageSize) {
        hasMore = false;
      }
      page++;
    }

    console.log('-----------------------------------');
    console.log(`Cleanup complete.`);
    console.log(`Total users deleted: ${deletedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    
    if (deletedCount > 0) {
      console.log('Note: Associated data in public tables (profiles, posts, etc.) should have been automatically removed via ON DELETE CASCADE.');
    }

  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

cleanupTestData();
