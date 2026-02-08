// 检查 Supabase 中的点赞和收藏数据
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('检查 works_likes 表数据...');
  const { data: likes, error: likesError } = await supabase
    .from('works_likes')
    .select('*')
    .limit(10);
  
  if (likesError) {
    console.error('查询 works_likes 表失败:', likesError);
  } else {
    console.log('works_likes 表数据:', likes);
  }

  console.log('\n检查 works_bookmarks 表数据...');
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('works_bookmarks')
    .select('*')
    .limit(10);
  
  if (bookmarksError) {
    console.error('查询 works_bookmarks 表失败:', bookmarksError);
  } else {
    console.log('works_bookmarks 表数据:', bookmarks);
  }
}

checkData();
