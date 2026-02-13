-- 1. 先禁用所有触发器
DROP TRIGGER IF EXISTS update_stats_on_node_change ON inspiration_nodes;
DROP TRIGGER IF EXISTS update_mindmaps_updated_at ON inspiration_mindmaps;
DROP TRIGGER IF EXISTS update_nodes_updated_at ON inspiration_nodes;

-- 2. 修复 update_updated_at_column 函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. 修复所有 inspiration_mindmaps 表中的 stats 字段
UPDATE inspiration_mindmaps
SET stats = jsonb_build_object(
    'totalNodes', COALESCE((stats->>'totalNodes')::int, 0),
    'maxDepth', COALESCE((stats->>'maxDepth')::int, 0),
    'aiGeneratedNodes', COALESCE((stats->>'aiGeneratedNodes')::int, 0),
    'cultureNodes', COALESCE((stats->>'cultureNodes')::int, 0),
    'lastActivityAt', NOW()::text
);

-- 4. 修复 inspiration_nodes 表中的 history 字段
UPDATE inspiration_nodes
SET history = '[]'::jsonb
WHERE history IS NOT NULL;

-- 5. 重新创建修复后的触发器函数
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

-- 6. 重新启用触发器
CREATE TRIGGER update_mindmaps_updated_at
    BEFORE UPDATE ON inspiration_mindmaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at
    BEFORE UPDATE ON inspiration_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stats_on_node_change
    AFTER INSERT OR UPDATE OR DELETE ON inspiration_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_mindmap_stats();
