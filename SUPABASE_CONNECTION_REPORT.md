# Supabase Connection Diagnostic Report

Generated at: 2026-02-05T00:47:46.010Z

[00:47:46] [INFO] Starting Supabase Connection Diagnostics...

[00:47:46] [INFO] Checking configuration...

[00:47:46] [SUCCESS] SUPABASE_URL and SUPABASE_ANON_KEY are present.

[00:47:46] [INFO] Database URL found. Host: aws-1-ap-southeast-1.pooler.supabase.com, Port: 6543

[00:47:46] [INFO] Testing TCP connectivity to aws-1-ap-southeast-1.pooler.supabase.com:6543...

[00:47:46] [SUCCESS] TCP connection successful. Time: 110ms

[00:47:46] [INFO] Testing Database Connection (pg client)...

[00:47:46] [SUCCESS] Database connected successfully. Time: 533ms

[00:47:46] [INFO] Executing SELECT 1...

[00:47:46] [SUCCESS] Simple query executed successfully. Time: 78ms

[00:47:46] [INFO] Checking Connection Pool Status (pg_stat_activity)...

[00:47:46] [INFO] Connection Stats - Total: 21, Active: 1, Idle: 12

[00:47:46] [INFO] Testing Supabase Client (REST API)...

[00:47:46] [SUCCESS] Supabase REST API reachable. Time: 2ms

