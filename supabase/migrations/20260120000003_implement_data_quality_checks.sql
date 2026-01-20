-- 实现数据质量检查的实际执行函数

-- 1. 执行单个数据质量规则的函数
CREATE OR REPLACE FUNCTION execute_data_quality_rule(rule_id INTEGER)
RETURNS VOID AS $$
DECLARE
    rule RECORD;
    total_records INTEGER;
    failed_records INTEGER;
    success_rate FLOAT;
    status VARCHAR(50);
    check_sql TEXT;
    error_message TEXT;
    sample_failed_records JSONB;
BEGIN
    -- 获取规则详情
    SELECT * INTO rule FROM data_quality_rules WHERE id = rule_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rule with id % not found or inactive', rule_id;
    END IF;
    
    -- 获取表的总记录数
    EXECUTE format('SELECT COUNT(*) FROM %I', rule.table_name) INTO total_records;
    
    -- 根据检查类型构建检查SQL
    CASE rule.check_type
        WHEN 'not_null' THEN
            check_sql := format(
                'SELECT COUNT(*) FROM %I WHERE %I IS NULL',
                rule.table_name,
                rule.column_name
            );
        
        WHEN 'unique' THEN
            check_sql := format(
                'SELECT COUNT(*) FROM (
                    SELECT %I FROM %I GROUP BY %I HAVING COUNT(*) > 1
                ) AS duplicates',
                rule.column_name,
                rule.table_name,
                rule.column_name
            );
        
        WHEN 'min' THEN
            check_sql := format(
                'SELECT COUNT(*) FROM %I WHERE %I < %L::NUMERIC',
                rule.table_name,
                rule.column_name,
                rule.check_value
            );
        
        WHEN 'max' THEN
            check_sql := format(
                'SELECT COUNT(*) FROM %I WHERE %I > %L::NUMERIC',
                rule.table_name,
                rule.column_name,
                rule.check_value
            );
        
        WHEN 'range' THEN
            check_sql := format(
                'SELECT COUNT(*) FROM %I WHERE %I < %L::NUMERIC OR %I > %L::NUMERIC',
                rule.table_name,
                rule.column_name,
                split_part(rule.check_value, ',', 1),
                rule.column_name,
                split_part(rule.check_value, ',', 2)
            );
        
        WHEN 'pattern' THEN
            check_sql := format(
                'SELECT COUNT(*) FROM %I WHERE %I !~ %L',
                rule.table_name,
                rule.column_name,
                rule.check_value
            );
        
        WHEN 'foreign_key' THEN
            check_sql := format(
                'SELECT COUNT(*) FROM %I t1 LEFT JOIN %I t2 ON t1.%I = t2.id WHERE t2.id IS NULL',
                rule.table_name,
                rule.check_value,
                rule.column_name
            );
        
        ELSE
            RAISE EXCEPTION 'Unsupported check type: %', rule.check_type;
    END CASE;
    
    -- 执行检查
    EXECUTE check_sql INTO failed_records;
    
    -- 计算成功率
    IF total_records > 0 THEN
        success_rate := (total_records - failed_records)::FLOAT / total_records * 100;
    ELSE
        success_rate := 100.0;
    END IF;
    
    -- 确定状态
    status := CASE WHEN failed_records = 0 THEN 'passed' ELSE 'failed' END;
    
    -- 获取失败记录示例（最多5条）
    IF failed_records > 0 THEN
        BEGIN
            CASE rule.check_type
                WHEN 'not_null' THEN
                    EXECUTE format(
                        'SELECT jsonb_agg(row_to_json(t)) FROM (
                            SELECT * FROM %I WHERE %I IS NULL LIMIT 5
                        ) t',
                        rule.table_name,
                        rule.column_name
                    ) INTO sample_failed_records;
                
                WHEN 'unique' THEN
                    EXECUTE format(
                        'SELECT jsonb_agg(row_to_json(t)) FROM (
                            SELECT * FROM %I WHERE %I IN (
                                SELECT %I FROM %I GROUP BY %I HAVING COUNT(*) > 1
                            ) LIMIT 5
                        ) t',
                        rule.table_name,
                        rule.column_name,
                        rule.column_name,
                        rule.table_name,
                        rule.column_name
                    ) INTO sample_failed_records;
                
                WHEN 'min' THEN
                    EXECUTE format(
                        'SELECT jsonb_agg(row_to_json(t)) FROM (
                            SELECT * FROM %I WHERE %I < %L::NUMERIC LIMIT 5
                        ) t',
                        rule.table_name,
                        rule.column_name,
                        rule.check_value
                    ) INTO sample_failed_records;
                
                WHEN 'max' THEN
                    EXECUTE format(
                        'SELECT jsonb_agg(row_to_json(t)) FROM (
                            SELECT * FROM %I WHERE %I > %L::NUMERIC LIMIT 5
                        ) t',
                        rule.table_name,
                        rule.column_name,
                        rule.check_value
                    ) INTO sample_failed_records;
                
                WHEN 'range' THEN
                    EXECUTE format(
                        'SELECT jsonb_agg(row_to_json(t)) FROM (
                            SELECT * FROM %I WHERE %I < %L::NUMERIC OR %I > %L::NUMERIC LIMIT 5
                        ) t',
                        rule.table_name,
                        rule.column_name,
                        split_part(rule.check_value, ',', 1),
                        rule.column_name,
                        split_part(rule.check_value, ',', 2)
                    ) INTO sample_failed_records;
                
                WHEN 'pattern' THEN
                    EXECUTE format(
                        'SELECT jsonb_agg(row_to_json(t)) FROM (
                            SELECT * FROM %I WHERE %I !~ %L LIMIT 5
                        ) t',
                        rule.table_name,
                        rule.column_name,
                        rule.check_value
                    ) INTO sample_failed_records;
                
                WHEN 'foreign_key' THEN
                    EXECUTE format(
                        'SELECT jsonb_agg(row_to_json(t1)) FROM (
                            SELECT t1.* FROM %I t1 LEFT JOIN %I t2 ON t1.%I = t2.id WHERE t2.id IS NULL LIMIT 5
                        ) t1',
                        rule.table_name,
                        rule.check_value,
                        rule.column_name
                    ) INTO sample_failed_records;
            END CASE;
        EXCEPTION
            WHEN OTHERS THEN
                sample_failed_records := '[]'::JSONB;
                error_message := SQLERRM;
        END;
    END IF;
    
    -- 记录检查结果
    INSERT INTO data_quality_results (
        rule_id, total_records, failed_records, success_rate, status, error_message, sample_failed_records
    ) VALUES (
        rule_id, total_records, failed_records, success_rate, status, error_message, sample_failed_records
    );
END;
$$ LANGUAGE plpgsql;

-- 2. 执行所有活跃数据质量规则的函数
CREATE OR REPLACE FUNCTION execute_all_data_quality_rules()
RETURNS VOID AS $$
DECLARE
    rule_id INTEGER;
BEGIN
    -- 遍历所有活跃规则
    FOR rule_id IN SELECT id FROM data_quality_rules WHERE is_active = true
    LOOP
        BEGIN
            -- 执行单个规则
            PERFORM execute_data_quality_rule(rule_id);
        EXCEPTION
            WHEN OTHERS THEN
                -- 记录错误但继续执行其他规则
                INSERT INTO data_quality_results (
                    rule_id, total_records, failed_records, success_rate, status, error_message
                ) VALUES (
                    rule_id, 0, 0, 0, 'failed', SQLERRM
                );
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. 批量添加默认数据质量规则的函数
CREATE OR REPLACE FUNCTION add_default_data_quality_rules()
RETURNS VOID AS $$
BEGIN
    -- 为users表添加默认规则
    INSERT INTO data_quality_rules (
        rule_name, table_name, column_name, check_type, check_value, severity, is_active
    ) VALUES
    ('users_email_not_null', 'users', 'email', 'not_null', 'true', 'high', true),
    ('users_email_unique', 'users', 'email', 'unique', 'true', 'high', true),
    ('users_username_not_null', 'users', 'username', 'not_null', 'true', 'high', true),
    ('users_username_unique', 'users', 'username', 'unique', 'true', 'high', true)
    ON CONFLICT (rule_name) DO NOTHING;
    
    -- 为works表添加默认规则
    INSERT INTO data_quality_rules (
        rule_name, table_name, column_name, check_type, check_value, severity, is_active
    ) VALUES
    ('works_title_not_null', 'works', 'title', 'not_null', 'true', 'high', true),
    ('works_creator_id_not_null', 'works', 'creator_id', 'not_null', 'true', 'high', true),
    ('works_category_not_null', 'works', 'category', 'not_null', 'true', 'medium', true),
    ('works_status_valid', 'works', 'status', 'pattern', '^(draft|published|archived)$', 'high', true)
    ON CONFLICT (rule_name) DO NOTHING;
    
    -- 为posts表添加默认规则
    INSERT INTO data_quality_rules (
        rule_name, table_name, column_name, check_type, check_value, severity, is_active
    ) VALUES
    ('posts_title_not_null', 'posts', 'title', 'not_null', 'true', 'high', true),
    ('posts_content_not_null', 'posts', 'content', 'not_null', 'true', 'high', true),
    ('posts_user_id_not_null', 'posts', 'user_id', 'not_null', 'true', 'high', true)
    ON CONFLICT (rule_name) DO NOTHING;
    
    -- 为comments表添加默认规则
    INSERT INTO data_quality_rules (
        rule_name, table_name, column_name, check_type, check_value, severity, is_active
    ) VALUES
    ('comments_content_not_null', 'comments', 'content', 'not_null', 'true', 'high', true),
    ('comments_user_id_not_null', 'comments', 'user_id', 'not_null', 'true', 'high', true)
    ON CONFLICT (rule_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 4. 清理旧数据质量检查结果的函数
CREATE OR REPLACE FUNCTION clean_old_data_quality_results(retention_days INTEGER DEFAULT 30)
RETURNS VOID AS $$
BEGIN
    -- 删除超过指定天数的检查结果
    DELETE FROM data_quality_results 
    WHERE check_time < CURRENT_TIMESTAMP - (retention_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql;

-- 5. 初始化默认数据质量规则
SELECT add_default_data_quality_rules();
