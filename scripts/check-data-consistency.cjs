
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkConsistency() {
  console.log('Starting Data Consistency Check...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  // Handle Supabase connection string (disable ssl verification for simple scripts if needed, or set rejectUnauthorized: false)
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Check User Posts Count Consistency
    console.log('\nChecking Users "posts_count" consistency...');
    const userPostCounts = await client.query(`
      SELECT 
        u.id, 
        u.username, 
        u.posts_count as stored_count, 
        COUNT(p.id) as actual_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      GROUP BY u.id
      HAVING COALESCE(u.posts_count, 0) != COUNT(p.id)
    `);

    if (userPostCounts.rows.length === 0) {
      console.log('✅ All user post counts are consistent.');
    } else {
      console.warn(`⚠️ Found ${userPostCounts.rows.length} inconsistencies in user post counts:`);
      userPostCounts.rows.forEach(row => {
        console.log(`   - User ${row.username} (${row.id}): Stored=${row.stored_count}, Actual=${row.actual_count}`);
      });
      console.log('   Run "node scripts/fix-consistency.js" to auto-fix (not implemented yet).');
    }

    // 2. Check Community Member Counts
    console.log('\nChecking Communities "member_count" consistency...');
    const communityMemberCounts = await client.query(`
      SELECT 
        c.id, 
        c.name, 
        c.member_count as stored_count, 
        COUNT(cm.user_id) as actual_count
      FROM communities c
      LEFT JOIN community_members cm ON c.id = cm.community_id
      GROUP BY c.id
      HAVING COALESCE(c.member_count, 0) != COUNT(cm.user_id)
    `);

    if (communityMemberCounts.rows.length === 0) {
      console.log('✅ All community member counts are consistent.');
    } else {
      console.warn(`⚠️ Found ${communityMemberCounts.rows.length} inconsistencies in community member counts:`);
      communityMemberCounts.rows.forEach(row => {
        console.log(`   - Community ${row.name} (${row.id}): Stored=${row.stored_count}, Actual=${row.actual_count}`);
      });
    }

    // 3. Check Audit Logs Existence (Sanity Check)
    console.log('\nChecking Audit Logs system...');
    const auditRes = await client.query(`SELECT count(*) FROM audit_logs`);
    console.log(`ℹ️ Current total audit logs: ${auditRes.rows[0].count}`);

  } catch (err) {
    console.error('Database Error:', err);
  } finally {
    await client.end();
  }
}

checkConsistency();
