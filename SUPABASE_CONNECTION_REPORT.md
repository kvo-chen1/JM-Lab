# Supabase Connection Diagnostic Report

Generated at: 2026-02-04T00:32:33.174Z

[00:32:33] [INFO] Starting Supabase Connection Diagnostics...

[00:32:33] [INFO] Checking configuration...

[00:32:33] [SUCCESS] SUPABASE_URL and SUPABASE_ANON_KEY are present.

[00:32:33] [INFO] Database URL found. Host: aws-1-ap-southeast-1.pooler.supabase.com, Port: 6543

[00:32:33] [INFO] Testing TCP connectivity to aws-1-ap-southeast-1.pooler.supabase.com:6543...

[00:32:33] [SUCCESS] TCP connection successful. Time: 85ms

[00:32:33] [INFO] Testing Database Connection (pg client)...

[00:32:33] [SUCCESS] Database connected successfully. Time: 502ms

[00:32:33] [INFO] Executing SELECT 1...

[00:32:33] [SUCCESS] Simple query executed successfully. Time: 107ms

[00:32:33] [INFO] Checking Connection Pool Status (pg_stat_activity)...

[00:32:34] [INFO] Connection Stats - Total: 16, Active: 1, Idle: 7

[00:32:34] [INFO] Testing Supabase Client (REST API)...

[00:32:34] [SUCCESS] Supabase REST API reachable. Time: 1ms

