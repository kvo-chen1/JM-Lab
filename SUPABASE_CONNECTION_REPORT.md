# Supabase Connection Diagnostic Report

Generated at: 2026-02-12T00:25:08.664Z

[00:25:08] [INFO] Starting Supabase Connection Diagnostics...

[00:25:08] [INFO] Checking configuration...

[00:25:08] [SUCCESS] SUPABASE_URL and SUPABASE_ANON_KEY are present.

[00:25:08] [INFO] Database URL found. Host: aws-1-ap-southeast-1.pooler.supabase.com, Port: 5432

[00:25:08] [INFO] Testing TCP connectivity to aws-1-ap-southeast-1.pooler.supabase.com:5432...

[00:25:08] [SUCCESS] TCP connection successful. Time: 107ms

[00:25:08] [INFO] Testing Database Connection (pg client)...

[00:25:09] [SUCCESS] Database connected successfully. Time: 537ms

[00:25:09] [INFO] Executing SELECT 1...

[00:25:09] [SUCCESS] Simple query executed successfully. Time: 142ms

[00:25:09] [INFO] Checking Connection Pool Status (pg_stat_activity)...

[00:25:09] [INFO] Connection Stats - Total: 23, Active: 1, Idle: 14

[00:25:09] [INFO] Testing Supabase Client (REST API)...

[00:25:09] [SUCCESS] Supabase REST API reachable. Time: 0ms

