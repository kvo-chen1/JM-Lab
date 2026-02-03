
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'debug.db');
const db = new Database(dbPath);

try {
  db.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            phone TEXT,
            avatar_url TEXT,
            interests TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            email_verified INTEGER DEFAULT 0,
            email_verification_token TEXT,
            email_verification_expires INTEGER,
            sms_verification_code TEXT,
            sms_verification_expires INTEGER,
            age INTEGER,
            tags TEXT,
            membership_level TEXT DEFAULT 'free',
            membership_status TEXT DEFAULT 'active',
            membership_start INTEGER,
            membership_end INTEGER,
            email_login_code TEXT,
            email_login_expires INTEGER,
            github_id TEXT UNIQUE,
            github_username TEXT,
            auth_provider TEXT DEFAULT 'local'
          );
  `);
  
  const userId = '10000000-1000-4000-8000-100000000000';
  const now = Date.now();
  
  db.prepare(`
            INSERT INTO users (id, username, email, password_hash, created_at, updated_at, membership_level, membership_status)
            VALUES (?, ?, ?, ?, ?, ?, 'free', 'active')
          `).run(userId, 'TestUser', 'test@example.com', 'hash123', now, now);
          
  console.log('Success!');
} catch (e) {
  console.error(e);
}
