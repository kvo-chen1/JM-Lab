
import { getDB, closeDB } from '../server/database.mjs';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  console.log('🌱 Starting Database Seeding...');
  const db = await getDB();
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  try {
    // 1. Ensure Tables are created
    console.log('Database initialized and tables ensured.');

    // 2. Get or Create User
    console.log('Finding/Creating seed user...');
    let user = (await db.query('SELECT * FROM users LIMIT 1')).rows[0];
    
    if (!user) {
      console.log('No users found in public.users. Attempting to create via Supabase Auth...');
      const email = `seed_${Date.now()}@example.com`;
      const password = 'password123';
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('Supabase Auth SignUp failed:', error.message);
        // Fallback: If SignUp fails (e.g. rate limit), maybe we can't seed users.
        throw error;
      }
      
      const authUserId = data.user?.id;
      if (!authUserId) throw new Error('No user ID returned from Supabase');
      
      console.log(`Created Auth User: ${authUserId}`);
      
      // Wait for trigger (if any) or Insert manually
      // We try to insert manually, but if it conflicts (trigger already did it), we handle it.
      // If constraint exists, we MUST use authUserId.
      
      try {
        const res = await db.query(`
          INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET updated_at = $6
          RETURNING *
        `, [authUserId, 'testuser_' + Date.now(), email, 'hash123', new Date(), new Date()]);
        user = res.rows[0];
      } catch (err) {
        // If insert failed, maybe trigger handled it but we missed reading it?
        // Or maybe constraint violation?
        console.log('Manual insert failed (might be handled by trigger or constraint):', err.message);
        // Try fetching again
        await new Promise(r => setTimeout(r, 1000));
        user = (await db.query('SELECT * FROM users WHERE id = $1', [authUserId])).rows[0];
      }
    }
    console.log(`Using user: ${user.username} (${user.id})`);

    // 3. Categories
    console.log('Seeding Categories...');
    const categories = ['Tutorials', 'Showcase', 'Discussion', 'Help'];
    const categoryIds = {};
    for (const name of categories) {
      const res = await db.query(`
        INSERT INTO categories (name, created_at, updated_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET updated_at = $3
        RETURNING id
      `, [name, Date.now(), Date.now()]);
      categoryIds[name] = res.rows[0].id;
    }

    // 4. Tags
    console.log('Seeding Tags...');
    const tags = ['AI', 'Video', 'Sora', 'Runway', 'Pika'];
    const tagIds = {};
    for (const name of tags) {
      const res = await db.query(`
        INSERT INTO tags (name, created_at, updated_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET updated_at = $3
        RETURNING id
      `, [name, Date.now(), Date.now()]);
      tagIds[name] = res.rows[0].id;
    }

    // 5. Posts
    console.log('Seeding Posts...');
    const postTitles = [
      'Getting Started with AI Video',
      'My Latest Sora Creation',
      'How to optimize prompts for Runway',
      'Pika vs Runway: A Comparison'
    ];
    
    for (let i = 0; i < postTitles.length; i++) {
      const title = postTitles[i];
      const categoryName = categories[i % categories.length];
      const catId = categoryIds[categoryName];
      
      const res = await db.query(`
        INSERT INTO posts (title, content, user_id, category_id, views, likes_count, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        title, 
        `This is the content for ${title}. AI video generation is amazing!`,
        user.id,
        catId,
        Math.floor(Math.random() * 1000),
        Math.floor(Math.random() * 100),
        Date.now(),
        Date.now()
      ]);
      const postId = res.rows[0].id;
      
      // Add some comments
      await db.query(`
        INSERT INTO comments (content, user_id, post_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
      `, ['Great post!', user.id, postId, Date.now(), Date.now()]);
      
      // Add some likes
      try {
        await db.query(`
            INSERT INTO likes (user_id, post_id, created_at)
            VALUES ($1, $2, $3)
        `, [user.id, postId, Date.now()]);
      } catch (e) { /* ignore duplicate likes */ }
    }

    console.log('✅ Seeding complete!');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await closeDB();
  }
}

seed();
