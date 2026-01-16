# Supabase Connection Diagnostic Report

Generated at: 2026-01-16T09:16:13.782Z

[09:16:13] [INFO] Starting Supabase Connection Diagnostics...

[09:16:13] [INFO] Checking configuration...

[09:16:13] [SUCCESS] SUPABASE_URL and SUPABASE_ANON_KEY are present.

[09:16:13] [INFO] Database URL found. Host: aws-1-ap-southeast-1.pooler.supabase.com, Port: 5432

[09:16:13] [INFO] Testing TCP connectivity to aws-1-ap-southeast-1.pooler.supabase.com:5432...

[09:16:13] [SUCCESS] TCP connection successful. Time: 209ms

[09:16:13] [INFO] Testing Database Connection (pg client)...

[09:16:15] [SUCCESS] Database connected successfully. Time: 1015ms

[09:16:15] [INFO] Executing SELECT 1...

[09:16:15] [SUCCESS] Simple query executed successfully. Time: 116ms

[09:16:15] [INFO] Checking Connection Pool Status (pg_stat_activity)...

[09:16:15] [INFO] Connection Stats - Total: 12, Active: 1, Idle: 4

[09:16:15] [INFO] Testing Supabase Client (REST API)...

[09:16:15] [SUCCESS] Supabase REST API reachable. Time: 1ms

