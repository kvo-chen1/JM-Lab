// 检查 likes 和 bookmarks 表的数据
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('检查 likes 表数据...');
  const { data: likes, error: likesError } = await supabase
    .from('likes')
    .select('*')
    .limit(10);
  
  if (likesError) {
    console.error('查询 likes 表失败:', likesError);
  } else {
    console.log('likes 表数据:', likes);
  }

  console.log('\n检查 bookmarks 表数据...');
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('*')
    .limit(10);
  
  if (bookmarksError) {
    console.error('查询 bookmarks 表失败:', bookmarksError);
  } else {
    console.log('bookmarks 表数据:', bookmarks);
  }
}

checkData();
