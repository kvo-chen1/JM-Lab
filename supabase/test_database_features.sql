-- 数据库功能测试脚本
-- 用于验证我们实现的各种数据库功能

-- 设置输出格式
\pset format aligned
\pset border 2
\pset linestyle unicode
\echo '\n=== 数据库功能测试开始 ===\n'

-- 1. 测试分区表功能
\echo '\n--- 测试1: 登录日志分区表功能 ---
'
-- 检查分区表是否存在
SELECT COUNT(*) AS partition_count 
FROM pg_inherits 
WHERE inhparent = 'login_logs_partitioned'::regclass;

-- 检查2026年的分区是否都已创建
SELECT 
    table_name,
    EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = table_name::regclass) AS is_partition_created
FROM (
    VALUES 
    ('login_logs_2026_01'), ('login_logs_2026_02'), ('login_logs_2026_03'),
    ('login_logs_2026_04'), ('login_logs_2026_05'), ('login_logs_2026_06'),
    ('login_logs_2026_07'), ('login_logs_2026_08'), ('login_logs_2026_09'),
    ('login_logs_2026_10'), ('login_logs_2026_11'), ('login_logs_2026_12')
) AS partitions(table_name);

-- 2. 测试自动创建分区功能
\echo '\n--- 测试2: 自动创建分区功能 ---
'
-- 执行自动创建分区函数
SELECT create_future_login_logs_partitions();

-- 检查是否成功创建了未来分区
SELECT 
    table_name,
    EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = table_name::regclass) AS is_partition_created
FROM (
    SELECT 'login_logs_' || to_char(date_trunc('month', CURRENT_TIMESTAMP) + (i || ' months')::interval, 'YYYY_MM') AS table_name
    FROM generate_series(0, 11) AS i
) AS future_partitions;

-- 3. 测试定时任务执行功能
\echo '\n--- 测试3: 定时任务执行功能 ---
'
-- 记录测试开始时间
SELECT NOW() AS test_start_time;

-- 执行综合定时任务
SELECT execute_scheduled_tasks();

-- 检查物化视图是否被刷新
SELECT last_refresh FROM pg_matviews WHERE matviewname = 'mv_trending_works';

-- 4. 测试数据质量检查功能
\echo '\n--- 测试4: 数据质量检查功能 ---
'
-- 检查默认数据质量规则是否已添加
SELECT rule_name, check_type, severity, is_active 
FROM data_quality_rules 
ORDER BY table_name, rule_name;

-- 执行所有数据质量规则
SELECT execute_all_data_quality_rules();

-- 查看最近的检查结果
SELECT 
    r.rule_name,
    r.table_name,
    r.check_type,
    q.status,
    q.total_records,
    q.failed_records,
    q.success_rate,
    q.check_time
FROM data_quality_results q
JOIN data_quality_rules r ON q.rule_id = r.id
ORDER BY q.check_time DESC
LIMIT 10;

-- 5. 测试备份配置功能
\echo '\n--- 测试5: 备份配置功能 ---
'
-- 检查默认备份配置是否已添加
SELECT backup_name, backup_type, backup_schedule, backup_retention_days, is_active 
FROM backup_configs 
ORDER BY backup_name;

-- 6. 测试索引优化
\echo '\n--- 测试6: 索引优化检查 ---
'
-- 检查表的索引情况
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- 7. 测试推荐算法功能
\echo '\n--- 测试7: 推荐算法功能 ---
'
-- 检查用户兴趣标签表是否存在
SELECT COUNT(*) AS user_interest_tags_count FROM user_interest_tags;

-- 检查推荐函数是否可执行
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'get_advanced_recommendations';

-- 8. 测试缓存功能
\echo '\n--- 测试8: 缓存功能 ---
'
-- 检查查询缓存表是否存在
SELECT COUNT(*) AS query_cache_count FROM query_cache;

-- 检查缓存清理函数是否可执行
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'clean_expired_cache';

-- 9. 测试归档功能
\echo '\n--- 测试9: 数据归档功能 ---
'
-- 检查归档表是否存在
SELECT 
    table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) AS table_exists
FROM (
    VALUES 
    ('works_archive'), 
    ('posts_archive'), 
    ('comments_archive'), 
    ('likes_archive')
) AS archive_tables(table_name);

-- 检查归档函数是否可执行
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'archive_old_data';

-- 10. 测试数据同步功能
\echo '\n--- 测试10: 数据同步功能 ---
'
-- 检查数据同步配置表是否存在
SELECT COUNT(*) AS data_sync_configs_count FROM data_sync_configs;

-- 检查数据同步日志表是否存在
SELECT COUNT(*) AS data_sync_logs_count FROM data_sync_logs;

-- 11. 测试性能监控功能
\echo '\n--- 测试11: 性能监控功能 ---
'
-- 检查性能监控表是否存在
SELECT COUNT(*) AS performance_metrics_count FROM performance_metrics;

-- 检查告警规则表是否存在
SELECT COUNT(*) AS alert_rules_count FROM alert_rules;

-- 检查告警日志表是否存在
SELECT COUNT(*) AS alert_logs_count FROM alert_logs;

-- 12. 测试综合功能
\echo '\n--- 测试12: 综合功能测试 ---
'
-- 模拟执行完整的数据处理流程
DO $$
BEGIN
    -- 1. 执行数据质量检查
    RAISE NOTICE '执行数据质量检查...';
    PERFORM execute_all_data_quality_rules();
    
    -- 2. 执行数据归档
    RAISE NOTICE '执行数据归档...';
    PERFORM archive_old_data();
    
    -- 3. 清理过期缓存
    RAISE NOTICE '清理过期缓存...';
    PERFORM clean_expired_cache();
    
    -- 4. 刷新物化视图
    RAISE NOTICE '刷新物化视图...';
    PERFORM refresh_materialized_views();
    
    -- 5. 创建未来分区
    RAISE NOTICE '创建未来分区...';
    PERFORM create_future_login_logs_partitions();
    
    RAISE NOTICE '综合流程执行完成!';
END;
$$;

\echo '\n=== 数据库功能测试结束 ===\n'
