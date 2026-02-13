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

DROP TRIGGER IF EXISTS update_stats_on_node_change ON inspiration_nodes;
CREATE TRIGGER update_stats_on_node_change
    AFTER INSERT OR UPDATE OR DELETE ON inspiration_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_mindmap_stats();
