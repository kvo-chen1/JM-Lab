# Supabase Connection Diagnostic Report

Generated at: 2026-02-17T03:05:45.975Z

[03:05:45] [INFO] Starting Supabase Connection Diagnostics...

[03:05:45] [INFO] Checking configuration...

[03:05:45] [SUCCESS] SUPABASE_URL and SUPABASE_ANON_KEY are present.

[03:05:45] [INFO] Database URL found. Host: aws-1-ap-southeast-1.pooler.supabase.com, Port: 5432

[03:05:45] [INFO] Testing TCP connectivity to aws-1-ap-southeast-1.pooler.supabase.com:5432...

[03:05:46] [SUCCESS] TCP connection successful. Time: 200ms

[03:05:46] [INFO] Testing Database Connection (pg client)...

[03:05:46] [SUCCESS] Database connected successfully. Time: 711ms

[03:05:46] [INFO] Executing SELECT 1...

[03:05:47] [SUCCESS] Simple query executed successfully. Time: 109ms

[03:05:47] [INFO] Checking Connection Pool Status (pg_stat_activity)...

[03:05:47] [INFO] Connection Stats - Total: 31, Active: 2, Idle: 21

[03:05:47] [INFO] Testing Supabase Client (REST API)...

[03:05:47] [SUCCESS] Supabase REST API reachable. Time: 0ms

