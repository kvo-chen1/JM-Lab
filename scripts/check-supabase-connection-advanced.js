
import pg from 'pg';
const { Client } = pg;
import { createClient } from '@supabase/supabase-js';
import net from 'net';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else {
  dotenv.config(); // Fallback to default .env
}

const REPORT_FILE = 'SUPABASE_CONNECTION_REPORT.md';
let reportContent = `# Supabase Connection Diagnostic Report\n\nGenerated at: ${new Date().toISOString()}\n\n`;

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const logLine = `[${timestamp}] [${level}] ${message}`;
  console.log(logLine);
  reportContent += `${logLine}\n\n`;
}

async function checkTcpConnection(host, port) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      const duration = Date.now() - start;
      socket.destroy();
      resolve({ success: true, duration });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
    
    socket.on('error', (err) => {
      socket.destroy();
      resolve({ success: false, error: err.message });
    });
    
    socket.connect(port, host);
  });
}

async function runDiagnostics() {
  log('Starting Supabase Connection Diagnostics...');

  // 1. Configuration Check
  log('Checking configuration...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  
  if (!supabaseUrl || !supabaseKey) {
    log('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.', 'ERROR');
  } else {
    log('SUPABASE_URL and SUPABASE_ANON_KEY are present.', 'SUCCESS');
  }

  let dbHost = process.env.POSTGRES_HOST;
  let dbPort = 5432;
  
  if (dbUrl) {
    try {
      const parsedUrl = new URL(dbUrl);
      dbHost = parsedUrl.hostname;
      dbPort = parsedUrl.port || 5432;
      log(`Database URL found. Host: ${dbHost}, Port: ${dbPort}`, 'INFO');
    } catch (e) {
      log(`Invalid Database URL: ${e.message}`, 'ERROR');
    }
  }

  // 2. TCP Connectivity
  if (dbHost) {
    log(`Testing TCP connectivity to ${dbHost}:${dbPort}...`);
    const tcpResult = await checkTcpConnection(dbHost, dbPort);
    if (tcpResult.success) {
      log(`TCP connection successful. Time: ${tcpResult.duration}ms`, 'SUCCESS');
    } else {
      log(`TCP connection failed: ${tcpResult.error}`, 'ERROR');
    }
  } else {
    log('Skipping TCP check: No host found.', 'WARN');
  }

  // 3. Database Connection & Query (Direct/PG)
  if (dbUrl) {
    log('Testing Database Connection (pg client)...');
    
    // Remove sslmode from connection string to allow manual configuration
    let connectionString = dbUrl;
    try {
      const urlObj = new URL(dbUrl);
      urlObj.searchParams.delete('sslmode');
      connectionString = urlObj.toString();
    } catch (e) {
      // ignore
    }

    const client = new Client({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL, but we accept self-signed for testing
      connectionTimeoutMillis: 10000,
    });

    try {
      const startConnect = Date.now();
      await client.connect();
      const connectTime = Date.now() - startConnect;
      log(`Database connected successfully. Time: ${connectTime}ms`, 'SUCCESS');

      // 4. Test Query
      log('Executing SELECT 1...');
      const startQuery = Date.now();
      await client.query('SELECT 1');
      const queryTime = Date.now() - startQuery;
      log(`Simple query executed successfully. Time: ${queryTime}ms`, 'SUCCESS');

      // 5. Connection Pool Status (if accessible)
      log('Checking Connection Pool Status (pg_stat_activity)...');
      try {
        const poolRes = await client.query(`
          SELECT 
            count(*) as total,
            count(*) filter (where state = 'active') as active,
            count(*) filter (where state = 'idle') as idle
          FROM pg_stat_activity
        `);
        const { total, active, idle } = poolRes.rows[0];
        log(`Connection Stats - Total: ${total}, Active: ${active}, Idle: ${idle}`, 'INFO');
      } catch (err) {
        log(`Could not fetch connection stats: ${err.message}`, 'WARN');
      }

      await client.end();
    } catch (err) {
      log(`Database connection failed: ${err.message}`, 'ERROR');
    }
  } else {
    log('Skipping Database Client check: No connection string found.', 'WARN');
  }

  // 6. Supabase Client Check (REST API)
  if (supabaseUrl && supabaseKey) {
    log('Testing Supabase Client (REST API)...');
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const startRest = Date.now();
      // Using a lightweight check - e.g. auth.getSession or health check if possible
      // Just checking if we can talk to the server. 
      // We can try to fetch a public table or just check auth config.
      const { data, error } = await supabase.auth.getSession();
      const restTime = Date.now() - startRest;
      
      if (error) {
        log(`Supabase REST API check failed: ${error.message}`, 'ERROR');
      } else {
        log(`Supabase REST API reachable. Time: ${restTime}ms`, 'SUCCESS');
      }
    } catch (err) {
      log(`Supabase Client error: ${err.message}`, 'ERROR');
    }
  }

  // Final Report Generation
  fs.writeFileSync(REPORT_FILE, reportContent);
  console.log(`\nReport saved to ${REPORT_FILE}`);
}

runDiagnostics().catch(err => {
  console.error('Unhandled error:', err);
  log(`Unhandled error: ${err.message}`, 'ERROR');
  fs.writeFileSync(REPORT_FILE, reportContent);
});
