
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for DDL if possible, but anon might not work for DDL

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Use service key if available, otherwise anon key (might fail for DDL)
const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

async function applyMigration() {
  console.log('Applying database schema fixes...');

  const sql = `
    -- 1. Ensure ID generation
    ALTER TABLE communities ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

    -- 2. Add missing columns if they don't exist
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'theme') THEN
            ALTER TABLE communities ADD COLUMN theme JSONB DEFAULT '{}'::jsonb;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'layout_type') THEN
            ALTER TABLE communities ADD COLUMN layout_type TEXT DEFAULT 'standard';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'enabled_modules') THEN
            ALTER TABLE communities ADD COLUMN enabled_modules JSONB DEFAULT '{}'::jsonb;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'bookmarks') THEN
            ALTER TABLE communities ADD COLUMN bookmarks JSONB DEFAULT '[]'::jsonb;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'member_count') THEN
            ALTER TABLE communities ADD COLUMN member_count INTEGER DEFAULT 1;
        END IF;
    END
    $$;
  `;

  // Note: Supabase JS client doesn't support raw SQL execution directly via .rpc() unless a specific RPC function is set up.
  // We will try to create a dummy community to verify the schema instead, and rely on the user to run SQL if needed.
  // OR we can check if there's a 'exec_sql' RPC function (common pattern).
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Failed to execute SQL via RPC (exec_sql might not exist):', error);
        console.log('Checking schema by inspecting table info...');
        // Fallback: Check if we can select from these columns
        const { data, error: selectError } = await supabase
            .from('communities')
            .select('id, theme, layout_type, enabled_modules, bookmarks, member_count')
            .limit(1);
            
        if (selectError) {
            console.error('Schema check failed. Missing columns likely:', selectError);
            console.log('\nIMPORTANT: Please run the following SQL in your Supabase SQL Editor to fix the schema:\n');
            console.log(sql);
        } else {
            console.log('Schema appears to be compatible (columns exist).');
        }
    } else {
        console.log('Migration applied successfully via RPC.');
    }
  } catch (e) {
      console.error('Unexpected error:', e);
  }
}

applyMigration();
