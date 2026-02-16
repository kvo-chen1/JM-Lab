# Supabase Connection Diagnostic Report

Generated at: 2026-02-16T06:58:04.148Z

[06:58:04] [INFO] Starting Supabase Connection Diagnostics...

[06:58:04] [INFO] Checking configuration...

[06:58:04] [SUCCESS] SUPABASE_URL and SUPABASE_ANON_KEY are present.

[06:58:04] [INFO] Database URL found. Host: aws-1-ap-southeast-1.pooler.supabase.com, Port: 5432

[06:58:04] [INFO] Testing TCP connectivity to aws-1-ap-southeast-1.pooler.supabase.com:5432...

[06:58:04] [SUCCESS] TCP connection successful. Time: 93ms

[06:58:04] [INFO] Testing Database Connection (pg client)...

[06:58:04] [SUCCESS] Database connected successfully. Time: 569ms

[06:58:04] [INFO] Executing SELECT 1...

[06:58:04] [SUCCESS] Simple query executed successfully. Time: 99ms

[06:58:04] [INFO] Checking Connection Pool Status (pg_stat_activity)...

[06:58:05] [INFO] Connection Stats - Total: 25, Active: 2, Idle: 15

[06:58:05] [INFO] Testing Supabase Client (REST API)...

[06:58:05] [SUCCESS] Supabase REST API reachable. Time: 1ms

