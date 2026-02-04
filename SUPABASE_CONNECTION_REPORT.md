# Supabase Connection Diagnostic Report

Generated at: 2026-02-04T08:44:32.329Z

[08:44:32] [INFO] Starting Supabase Connection Diagnostics...

[08:44:32] [INFO] Checking configuration...

[08:44:32] [SUCCESS] SUPABASE_URL and SUPABASE_ANON_KEY are present.

[08:44:32] [INFO] Database URL found. Host: aws-1-ap-southeast-1.pooler.supabase.com, Port: 6543

[08:44:32] [INFO] Testing TCP connectivity to aws-1-ap-southeast-1.pooler.supabase.com:6543...

[08:44:32] [SUCCESS] TCP connection successful. Time: 96ms

[08:44:32] [INFO] Testing Database Connection (pg client)...

[08:44:32] [SUCCESS] Database connected successfully. Time: 384ms

[08:44:32] [INFO] Executing SELECT 1...

[08:44:32] [SUCCESS] Simple query executed successfully. Time: 59ms

[08:44:32] [INFO] Checking Connection Pool Status (pg_stat_activity)...

[08:44:32] [INFO] Connection Stats - Total: 22, Active: 1, Idle: 13

[08:44:33] [INFO] Testing Supabase Client (REST API)...

[08:44:33] [SUCCESS] Supabase REST API reachable. Time: 0ms

