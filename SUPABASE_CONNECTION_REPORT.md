# Supabase Connection Diagnostic Report

Generated at: 2026-02-12T12:03:19.568Z

[12:03:19] [INFO] Starting Supabase Connection Diagnostics...

[12:03:19] [INFO] Checking configuration...

[12:03:19] [SUCCESS] SUPABASE_URL and SUPABASE_ANON_KEY are present.

[12:03:19] [INFO] Database URL found. Host: aws-1-ap-southeast-1.pooler.supabase.com, Port: 5432

[12:03:19] [INFO] Testing TCP connectivity to aws-1-ap-southeast-1.pooler.supabase.com:5432...

[12:03:19] [SUCCESS] TCP connection successful. Time: 68ms

[12:03:19] [INFO] Testing Database Connection (pg client)...

[12:03:20] [SUCCESS] Database connected successfully. Time: 482ms

[12:03:20] [INFO] Executing SELECT 1...

[12:03:20] [SUCCESS] Simple query executed successfully. Time: 79ms

[12:03:20] [INFO] Checking Connection Pool Status (pg_stat_activity)...

[12:03:20] [INFO] Connection Stats - Total: 35, Active: 2, Idle: 25

[12:03:20] [INFO] Testing Supabase Client (REST API)...

[12:03:20] [SUCCESS] Supabase REST API reachable. Time: 0ms

