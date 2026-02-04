
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else {
  dotenv.config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('Testing public access to communities...');
  const { data: publicData, error: publicError } = await supabase
    .from('communities')
    .select('*')
    .limit(1);
  
  if (publicError) {
    console.error('Public communities query failed:', publicError);
  } else {
    console.log('Public communities query success:', publicData?.length);
  }

  // Simulate a user ID (we don't have a valid session, so this mimics an unauthenticated or expired session request)
  const fakeUserId = '00000000-0000-0000-0000-000000000000'; 
  console.log(`Testing access to community_members for user ${fakeUserId}...`);
  
  const { data, error } = await supabase
    .from('community_members')
    .select('community_id, joined_at')
    .eq('user_id', fakeUserId);

  if (error) {
    console.error('Query failed:', error);
  } else {
    console.log('Query success (data might be empty):', data);
  }

  console.log('Testing communities query with empty ID list...');
  const { data: communitiesData, error: communitiesError } = await supabase
    .from('communities')
    .select('*')
    .in('id', []);
  
  if (communitiesError) {
    console.error('Communities query failed:', communitiesError);
  } else {
    console.log('Communities query success:', communitiesData);
  }
}

testQuery();
