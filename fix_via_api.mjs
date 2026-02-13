// 通过本地 API 执行 SQL 修复
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const apiUrl = 'http://localhost:3022/api';

const sql = `
-- 1. 先禁用触发器
DROP TRIGGER IF EXISTS update_stats_on_node_change ON inspiration_nodes;

-- 2. 修复所有 inspiration_mindmaps 表中的 stats 字段
UPDATE inspiration_mindmaps
SET stats = jsonb_build_object(
    'totalNodes', COALESCE((stats->>'totalNodes')::int, 0),
    'maxDepth', COALESCE((stats->>'maxDepth')::int, 0),
    'aiGeneratedNodes', COALESCE((stats->>'aiGeneratedNodes')::int, 0),
    'cultureNodes', COALESCE((stats->>'cultureNodes')::int, 0),
    'lastActivityAt', NOW()::text
);

-- 3. 修复 inspiration_nodes 表中的 history 字段
UPDATE inspiration_nodes
SET history = '[]'::jsonb
WHERE history IS NOT NULL;

-- 4. 重新创建修复后的触发器
CREATE OR REPLACE FUNCTION update_mindmap_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inspiration_mindmaps
    SET stats = jsonb_build_object(
        'totalNodes', (SELECT COUNT(*) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id)),
        'maxDepth', COALESCE((SELECT MAX((position->>'level')::int) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id)), 0),
        'aiGeneratedNodes', (SELECT COUNT(*) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id) AND category = 'ai_generate'),
        'cultureNodes', (SELECT COUNT(*) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id) AND category = 'culture'),
        'lastActivityAt', NOW()::text
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.map_id, OLD.map_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 5. 重新启用触发器
CREATE TRIGGER update_stats_on_node_change
    AFTER INSERT OR UPDATE OR DELETE ON inspiration_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_mindmap_stats();
`;

async function fixViaApi() {
  console.log('🔄 正在通过本地 API 执行修复...\n');

  try {
    const response = await fetch(`${apiUrl}/admin/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ 执行失败:', error);
      return;
    }

    const result = await response.json();
    console.log('✅ 修复完成！');
    console.log('结果:', result);
    console.log('\n请刷新页面后再次尝试添加节点。');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('\n请手动在 Supabase SQL Editor 中执行 fix_all_timestamps.sql 文件');
  }
}

fixViaApi();
