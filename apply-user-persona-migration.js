/**
 * 应用 user_persona 表迁移脚本
 * 创建 user_behaviors 和 user_personas 表
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从环境变量读取 Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('错误: 缺少 Supabase 配置');
    console.error('请确保设置了 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    try {
        console.log('开始应用 user_persona 表迁移...');
        
        // 读取 SQL 文件
        const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20250316000001_create_user_persona_tables.sql');
        
        if (!fs.existsSync(sqlPath)) {
            console.error('错误: 找不到迁移文件:', sqlPath);
            process.exit(1);
        }
        
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        
        // 分割 SQL 语句并逐一执行
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        console.log(`找到 ${statements.length} 个 SQL 语句需要执行`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            console.log(`\n执行语句 ${i + 1}/${statements.length}...`);
            
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            
            if (error) {
                // 如果是 "function does not exist" 错误，尝试直接执行
                if (error.message && error.message.includes('function does not exist')) {
                    console.log('尝试使用 REST API 直接执行 SQL...');
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify({ query: statement })
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`语句执行失败: ${errorText}`);
                        // 继续执行下一条语句
                    } else {
                        console.log('✓ 执行成功');
                    }
                } else {
                    // 忽略 "already exists" 错误
                    if (error.message && (
                        error.message.includes('already exists') ||
                        error.message.includes('duplicate key')
                    )) {
                        console.log('✓ 已存在，跳过');
                    } else {
                        console.error(`语句执行失败: ${error.message}`);
                    }
                }
            } else {
                console.log('✓ 执行成功');
            }
        }
        
        // 验证表是否创建成功
        console.log('\n验证表创建结果...');
        
        const { data: behaviorsData, error: behaviorsError } = await supabase
            .from('user_behaviors')
            .select('count')
            .limit(1);
            
        if (behaviorsError && behaviorsError.code !== 'PGRST116') {
            console.error('user_behaviors 表验证失败:', behaviorsError.message);
        } else {
            console.log('✓ user_behaviors 表已就绪');
        }
        
        const { data: personaData, error: personaError } = await supabase
            .from('user_personas')
            .select('count')
            .limit(1);
            
        if (personaError && personaError.code !== 'PGRST116') {
            console.error('user_personas 表验证失败:', personaError.message);
        } else {
            console.log('✓ user_personas 表已就绪');
        }
        
        console.log('\n✅ 迁移完成！');
        
    } catch (error) {
        console.error('迁移失败:', error);
        process.exit(1);
    }
}

// 使用 SQL 直接创建表的替代方法
async function createTablesDirectly() {
    console.log('尝试直接创建表...\n');
    
    // 创建 user_behaviors 表
    const createBehaviorsTable = `
        CREATE TABLE IF NOT EXISTS user_behaviors (
            id TEXT PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content_id TEXT NOT NULL,
            content_type TEXT NOT NULL,
            behavior_type TEXT NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            duration INTEGER,
            value INTEGER,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
    
    // 创建 user_personas 表
    const createPersonasTable = `
        CREATE TABLE IF NOT EXISTS user_personas (
            id TEXT PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            interests JSONB DEFAULT '[]',
            creator_preferences JSONB DEFAULT '[]',
            category_preferences JSONB DEFAULT '[]',
            behavior_profile JSONB DEFAULT '{}',
            time_patterns JSONB DEFAULT '[]',
            device_patterns JSONB DEFAULT '[]',
            content_preferences JSONB DEFAULT '{}',
            social_profile JSONB DEFAULT '{}',
            demographics JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            version INTEGER NOT NULL DEFAULT 1,
            UNIQUE(user_id)
        )
    `;
    
    const statements = [
        { name: 'user_behaviors 表', sql: createBehaviorsTable },
        { name: 'user_personas 表', sql: createPersonasTable },
        { name: 'user_behaviors_user_id 索引', sql: 'CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id ON user_behaviors(user_id)' },
        { name: 'user_personas_user_id 索引', sql: 'CREATE INDEX IF NOT EXISTS idx_user_personas_user_id ON user_personas(user_id)' }
    ];
    
    for (const { name, sql } of statements) {
        console.log(`创建 ${name}...`);
        
        try {
            // 通过 PostgREST 执行 SQL
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({ sql_query: sql })
            });
            
            if (!response.ok) {
                const error = await response.text();
                // 忽略已存在的错误
                if (error.includes('already exists') || error.includes('duplicate')) {
                    console.log(`  ✓ ${name} 已存在`);
                } else {
                    console.error(`  ✗ 失败: ${error}`);
                }
            } else {
                console.log(`  ✓ ${name} 创建成功`);
            }
        } catch (error) {
            console.error(`  ✗ 错误: ${error.message}`);
        }
    }
}

// 主函数
async function main() {
    console.log('========================================');
    console.log('User Persona 表迁移工具');
    console.log('========================================\n');
    
    // 先尝试直接创建表
    await createTablesDirectly();
    
    console.log('\n========================================');
    console.log('迁移脚本执行完毕');
    console.log('========================================');
}

main().catch(console.error);
