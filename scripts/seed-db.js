import { getDB, closeDB } from '../server/database.mjs';
// import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Simple mock UUID generator if crypto.randomUUID is not available (Node < 14.17)
const uuidv4 = crypto.randomUUID || (() => {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
});

async function seed() {
  console.log('🌱 Starting Database Seeding...');
  const db = await getDB();
  // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  try {
    // 1. Ensure Tables are created (Handled by getDB init logic, but we can verify)
    console.log('Database initialized and tables ensured.');

    // 2. Get or Create User
    console.log('Finding/Creating seed user...');
    
    // SQLite specific query syntax or generic?
    // server/database.mjs wraps better-sqlite3 instance for SQLite type
    // We should use the abstraction if possible, but getDB returns raw db instance.
    // Let's assume we are in SQLite mode for now as per plan.
    
    let user;
    try {
        // Try generic query first (works for PG)
        // For SQLite, db.query is NOT standard better-sqlite3 method. better-sqlite3 uses db.prepare().
        // We need to check what db object we have.
        
        if (db.prepare) {
            // SQLite
            user = db.prepare('SELECT * FROM users LIMIT 1').get();
        } else {
            // Postgres / Generic
            user = (await db.query('SELECT * FROM users LIMIT 1')).rows[0];
        }
    } catch (e) {
        console.log('Error fetching user, maybe table empty:', e.message);
    }
    
    if (!user) {
      console.log('No users found. Creating local seed user...');
      const email = `seed_${Date.now()}@example.com`;
      const userId = uuidv4();
      const now = Date.now(); // SQLite uses INTEGER for timestamps in our schema
      
      if (db.prepare) {
          // SQLite
          db.prepare(`
            INSERT INTO users (id, username, email, password_hash, created_at, updated_at, membership_level, membership_status)
            VALUES (?, ?, ?, ?, ?, ?, 'free', 'active')
          `).run(userId, 'TestUser', email, 'hash123', now, now);
          user = { id: userId, username: 'TestUser' };
      } else {
          // Postgres
          const res = await db.query(`
            INSERT INTO users (id, username, email, password_hash, created_at, updated_at, membership_level, membership_status)
            VALUES ($1, $2, $3, $4, NOW(), NOW(), 'free', 'active')
            RETURNING *
          `, [userId, 'TestUser', email, 'hash123']);
          user = res.rows[0];
      }
      console.log(`Created Seed User: ${user.username} (${user.id})`);
    } else {
        console.log(`Using existing user: ${user.username} (${user.id})`);
    }

    // 3. Categories
    console.log('Seeding Categories...');
    const categories = ['设计相关', '艺术文化', '科技数码', '生活方式'];
    const categoryIds = {};
    const now = Date.now();
    
    for (const name of categories) {
      let catId;
      if (db.prepare) {
          // SQLite
          try {
            db.prepare('INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)').run(name, now, now);
          } catch (e) { /* ignore constraint error */ }
          const row = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
          catId = row.id;
      } else {
          // Postgres
          const res = await db.query(`
            INSERT INTO categories (name, created_at, updated_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (name) DO UPDATE SET updated_at = $3
            RETURNING id
          `, [name, now, now]);
          catId = res.rows[0].id;
      }
      categoryIds[name] = catId;
    }

    // 4. Posts
    console.log('Seeding Posts...');
    const postTitles = [
      '津门老字号的数字化转型之路',
      '如何用 AI 赋能传统泥人张制作',
      '杨柳青画社：百年传承的新生',
      '天津之眼：城市地标的文化解读'
    ];
    
    for (let i = 0; i < postTitles.length; i++) {
      const title = postTitles[i];
      const categoryName = categories[i % categories.length];
      const catId = categoryIds[categoryName];
      const content = `这是关于 ${title} 的详细内容。津脉社区致力于连接传统文化与现代科技...`;
      
      if (db.prepare) {
          // SQLite
          db.prepare(`
            INSERT INTO posts (title, content, user_id, category_id, views, likes_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(title, content, user.id, catId, Math.floor(Math.random() * 1000), Math.floor(Math.random() * 100), now, now);
      } else {
          // Postgres
          await db.query(`
            INSERT INTO posts (title, content, user_id, category_id, views, likes_count, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            title, 
            content,
            user.id,
            catId,
            Math.floor(Math.random() * 1000),
            Math.floor(Math.random() * 100),
            now,
            now
          ]);
      }
    }

    // 5. Communities
    console.log('Seeding Communities...');
    const communities = []; // Mock data removed as requested

    for (const comm of communities) {
      if (db.prepare) {
          // SQLite
          db.prepare(`
            INSERT INTO communities (id, name, description, avatar_url, topic, member_count, is_special, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              description = excluded.description,
              avatar_url = excluded.avatar_url,
              member_count = excluded.member_count
          `).run(comm.id, comm.name, comm.description, comm.avatar_url, comm.topic, comm.member_count, comm.is_special, now, now);
      } else {
          // Postgres
          await db.query(`
            INSERT INTO communities (id, name, description, avatar_url, topic, member_count, is_special, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
            ON CONFLICT(id) DO UPDATE SET
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              avatar_url = EXCLUDED.avatar_url,
              member_count = EXCLUDED.member_count
          `, [comm.id, comm.name, comm.description, comm.avatar_url, comm.topic, comm.member_count, comm.is_special, now]);
      }
    }

    console.log('✅ Seeding complete!');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await closeDB();
  }
}

seed();
