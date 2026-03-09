import { execSync } from 'child_process';

const PSQL_PATH = 'C:\\postgresql\\pgsql\\bin';
process.env.PATH = `${process.env.PATH};${PSQL_PATH}`;

const targetHost = 'db.kizgwtrrsmkjeiddotup.supabase.co';
const targetPort = '5432';
const targetDb = 'postgres';
const targetUser = 'postgres';
const targetPass = 'csh200506207837';

const targetConn = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/${targetDb}`;
const env = { ...process.env, PGPASSWORD: targetPass };

const checkSQL = `
-- 检查所有表的数据量
SELECT 
    schemaname,
    tablename,
    COUNT(*) as row_count
FROM pg_tables t
LEFT JOIN LATERAL (
    SELECT COUNT(*) FROM public."" || tablename
) c ON true
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
`;

const checkTablesSQL = `
-- 列出所有表
SELECT 
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as column_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
`;

console.log('🔍 正在检查数据库状态...\n');

try {
    // 检查所有表
    console.log('📋 数据库表列表:');
    const tablesResult = execSync(
        `psql "${targetConn}" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"`,
        { env, encoding: 'utf-8', timeout: 30000 }
    );
    console.log(tablesResult);
    
    // 检查关键表的数据量
    console.log('\n📊 关键表数据量统计:');
    const keyTables = [
        'users', 'works', 'posts', 'events', 'comments', 
        'likes', 'bookmarks', 'follows', 'communities',
        'achievement_configs', 'admin_roles', 'inspiration_nodes',
        'ai_conversations', 'audit_logs', 'works_likes'
    ];
    
    for (const table of keyTables) {
        try {
            const countResult = execSync(
                `psql "${targetConn}" -c "SELECT COUNT(*) FROM public.${table};"`,
                { env, encoding: 'utf-8', timeout: 10000 }
            );
            const count = countResult.match(/\d+/)?.[0] || '0';
            console.log(`  - ${table}: ${count} 条记录`);
        } catch (e) {
            console.log(`  - ${table}: ❌ 表不存在或无法访问`);
        }
    }
    
    console.log('\n✅ 数据库检查完成！');
    
} catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
}
