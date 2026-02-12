import pg from 'pg';
const { Client } = pg;
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
  dotenv.config();
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function applyMigration() {
  // Remove sslmode from connection string
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
    ssl: { rejectUnauthorized: false },