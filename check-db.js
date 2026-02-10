const { getDB, config } = require('./server/database.mjs');

async function check() {
  console.log('DB Type:', config.dbType);
  const db = await getDB();
  
  try {
    // 查询 community_members
    const membersResult = await db.query(
      'SELECT * FROM community_members WHERE community_id = $1',
      ['4000e812-564d-4e7e-8247-dab93b75fac4']
    );
    console.log('Members count:', membersResult.rows.length);
    console.log('Members:', JSON.stringify(membersResult.rows, null, 2));
    
    // 查询 users
    const userIds = membersResult.rows.map(m => m.user_id);
    console.log('User IDs:', userIds);
    
    if (userIds.length > 0) {
      const usersResult = await db.query(
        'SELECT id, username, avatar_url FROM users WHERE id = ANY($1)',
        [userIds]
      );
      console.log('Users count:', usersResult.rows.length);
      console.log('Users:', JSON.stringify(usersResult.rows, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
check().catch(console.error);
