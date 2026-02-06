# Supabase Connection Diagnostic Report

Generated at: 2026-02-06T01:27:56.289Z

[01:27:56] [INFO] Starting Supabase Connection Diagnostics...

[01:27:56] [INFO] Checking configuration...

[01:27:56] [SUCCESS] SUPABASE_URL and SUPABASE_ANON_KEY are present.

[01:27:56] [INFO] Database URL found. Host: aws-1-ap-southeast-1.pooler.supabase.com, Port: 6543

[01:27:56] [INFO] Testing TCP connectivity to aws-1-ap-southeast-1.pooler.supabase.com:6543...

[01:27:56] [SUCCESS] TCP connection successful. Time: 106ms

[01:27:56] [INFO] Testing Database Connection (pg client)...

[01:27:56] [SUCCESS] Database connected successfully. Time: 493ms

[01:27:56] [INFO] Executing SELECT 1...

[01:27:56] [SUCCESS] Simple query executed successfully. Time: 80ms

[01:27:56] [INFO] Checking Connection Pool Status (pg_stat_activity)...

[01:27:57] [INFO] Connection Stats - Total: 16, Active: 1, Idle: 7

[01:27:57] [INFO] Testing Supabase Client (REST API)...

[01:27:57] [SUCCESS] Supabase REST API reachable. Time: 2ms

