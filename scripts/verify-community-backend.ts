import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
  console.log('Loading .env.local...');
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('Loading .env...');
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ No .env or .env.local file found!');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env or .env.local');
  process.exit(1);
}

console.log(`Connecting to Supabase at: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Verifying Community Backend...');
  let hasError = false;

  // 1. Check Posts Table Schema
  console.log('\nChecking posts table schema...');
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, images, community_id, user_id')
    .limit(1);

  if (postsError) {
    console.error('❌ Error querying posts table:', postsError.message);
    hasError = true;
  } else {
    console.log('✅ Posts table accessible and has required columns.');
  }

  // 2. Check Storage Bucket
  console.log('\nChecking storage bucket...');
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets();

  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError.message);
    hasError = true;
  } else {
    const bucket = buckets?.find(b => b.name === 'community-images');
    if (bucket) {
      console.log('✅ Bucket "community-images" exists.');
    } else {
      console.error('❌ Bucket "community-images" NOT found.');
      console.log('  -> Please run the SQL script to create the bucket.');
      hasError = true;
    }
  }

  // 3. Check Comments Table
  console.log('\nChecking comments table...');
  const { error: commentsError } = await supabase
    .from('comments')
    .select('id, post_id, user_id, content, reply_to')
    .limit(1);
  
  if (commentsError) {
    console.error('❌ Error querying comments table:', commentsError.message);
    hasError = true;
  } else {
    console.log('✅ Comments table accessible.');
  }

  // 4. Check Likes Table
  console.log('\nChecking likes table...');
  const { error: likesError } = await supabase
    .from('likes')
    .select('user_id, post_id')
    .limit(1);

  if (likesError) {
    console.error('❌ Error querying likes table:', likesError.message);
    hasError = true;
  } else {
    console.log('✅ Likes table accessible.');
  }

  if (hasError) {
    console.log('\n⚠️  Verification FAILED. Please run "supabase/fix_community_tables.sql" in your Supabase SQL Editor.');
    process.exit(1);
  } else {
    console.log('\n🎉 Verification PASSED. Backend is ready.');
  }
}

verify().catch(console.error);
