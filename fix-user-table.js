// 修复用户表结构不匹配的脚本
import { getDB, getDBStatus } from './server/database.mjs';

async function analyzeAndFixUserTable() {
  console.log('开始分析并修复用户表结构...');
  
  try {
    // 获取数据库状态
    const status = await getDBStatus();
    console.log(`\n=== 数据库状态 ===`);
    console.log(`当前数据库类型: ${status.currentDbType}`);
    
    if (status.currentDbType !== 'postgresql' && status.currentDbType !== 'supabase') {
      console.log('❌ 不是 PostgreSQL/Supabase 数据库，无法修复表格结构');
      return;
    }
    
    // 获取数据库实例
    const db = await getDB();
    console.log('✅ 数据库连接成功');
    
    // 1. 分析当前用户表结构
    console.log(`\n=== 分析当前用户表结构 ===`);
    const currentColumnsResult = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    const currentColumns = currentColumnsResult.rows;
    console.log(`当前用户表列数: ${currentColumns.length}`);
    
    // 2. 定义代码中预期的用户表结构
    const expectedColumns = [
      { name: 'id', type: 'uuid', nullable: false, constraints: 'PRIMARY KEY' },
      { name: 'username', type: 'character varying', nullable: false, constraints: 'UNIQUE' },
      { name: 'email', type: 'character varying', nullable: false, constraints: 'UNIQUE' },
      { name: 'password_hash', type: 'character varying', nullable: false },
      { name: 'phone', type: 'character varying', nullable: true },
      { name: 'avatar_url', type: 'character varying', nullable: true },
      { name: 'interests', type: 'text', nullable: true },
      { name: 'age', type: 'integer', nullable: true },
      { name: 'tags', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, constraints: 'DEFAULT NOW()' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, constraints: 'DEFAULT NOW()' },
      { name: 'email_verified', type: 'boolean', nullable: false, constraints: 'DEFAULT FALSE' },
      { name: 'email_verification_token', type: 'character varying', nullable: true },
      { name: 'email_verification_expires', type: 'timestamp with time zone', nullable: true },
      { name: 'sms_verification_code', type: 'character varying', nullable: true },
      { name: 'sms_verification_expires', type: 'timestamp with time zone', nullable: true },
      { name: 'membership_level', type: 'character varying', nullable: false, constraints: "DEFAULT 'free'" },
      { name: 'membership_status', type: 'character varying', nullable: false, constraints: "DEFAULT 'active'" },
      { name: 'membership_start', type: 'timestamp with time zone', nullable: true },
      { name: 'membership_end', type: 'timestamp with time zone', nullable: true },
      { name: 'metadata', type: 'jsonb', nullable: true },
      { name: 'email_login_code', type: 'character varying', nullable: true },
      { name: 'email_login_expires', type: 'timestamp with time zone', nullable: true },
      { name: 'github_id', type: 'character varying', nullable: true },
      { name: 'github_username', type: 'character varying', nullable: true },
      { name: 'auth_provider', type: 'character varying', nullable: false, constraints: "DEFAULT 'local'" }
    ];
    
    // 3. 比较并识别差异
    console.log(`\n=== 识别结构差异 ===`);
    
    // 检查缺失的列
    const missingColumns = expectedColumns.filter(expected => 
      !currentColumns.some(current => current.column_name === expected.name)
    );
    
    if (missingColumns.length > 0) {
      console.log(`⚠️  缺失的列 (${missingColumns.length}):`);
      missingColumns.forEach(col => console.log(`  - ${col.name} (${col.type}, ${col.nullable ? '可空' : '非空'})`));
    } else {
      console.log(`✅ 所有预期列都存在`);
    }
    
    // 检查类型不匹配的列
    const typeMismatches = [];
    expectedColumns.forEach(expected => {
      const current = currentColumns.find(col => col.column_name === expected.name);
      if (current) {
        // 简化类型比较
        const expectedType = expected.type.toLowerCase();
        const currentType = current.data_type.toLowerCase();
        
        // 处理一些常见的类型差异
        const typesMatch = (
          (expectedType === 'character varying' && currentType === 'character varying') ||
          (expectedType === 'text' && currentType === 'text') ||
          (expectedType === 'integer' && currentType === 'integer') ||
          (expectedType === 'boolean' && currentType === 'boolean') ||
          (expectedType === 'uuid' && currentType === 'uuid') ||
          (expectedType === 'jsonb' && currentType === 'jsonb') ||
          (expectedType === 'timestamp with time zone' && currentType === 'timestamp with time zone')
        );
        
        if (!typesMatch) {
          typeMismatches.push({ name: expected.name, expectedType, currentType });
        }
      }
    });
    
    if (typeMismatches.length > 0) {
      console.log(`⚠️  类型不匹配的列 (${typeMismatches.length}):`);
      typeMismatches.forEach(mismatch => 
        console.log(`  - ${mismatch.name}: 预期 ${mismatch.expectedType}, 实际 ${mismatch.currentType}`)
      );
    } else {
      console.log(`✅ 所有列类型匹配`);
    }
    
    // 4. 修复结构差异
    console.log(`\n=== 开始修复表格结构 ===`);
    
    // 修复缺失的列
    for (const col of missingColumns) {
      try {
        let sql = `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`;
        if (!col.nullable) {
          sql += ' NOT NULL';
        }
        if (col.constraints) {
          sql += ` ${col.constraints}`;
        }
        await db.query(sql);
        console.log(`✅ 添加列: ${col.name}`);
      } catch (error) {
        console.error(`❌ 添加列失败 ${col.name}:`, error.message);
      }
    }
    
    // 修复重要的类型不匹配
    const criticalTypeMismatches = typeMismatches.filter(mismatch => 
      mismatch.name === 'interests' || mismatch.name === 'tags' ||
      mismatch.name === 'sms_verification_expires' || mismatch.name === 'email_verification_expires'
    );
    
    for (const mismatch of criticalTypeMismatches) {
      try {
        // 注意：修改列类型可能会丢失数据，这里只处理非关键的类型转换
        console.log(`⚠️  类型不匹配: ${mismatch.name} (${mismatch.currentType} → ${mismatch.expectedType})`);
        console.log(`   提示：修改列类型可能会丢失数据，请谨慎操作`);
      } catch (error) {
        console.error(`❌ 修复类型失败 ${mismatch.name}:`, error.message);
      }
    }
    
    // 5. 确保必要的约束存在
    console.log(`\n=== 确保约束存在 ===`);
    
    // 确保 username 唯一
    try {
      await db.query(`ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_username_key UNIQUE (username)`);
      console.log(`✅ 确保 username 唯一约束`);
    } catch (error) {
      console.error(`❌ 添加 username 唯一约束失败:`, error.message);
    }
    
    // 确保 email 唯一
    try {
      await db.query(`ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_email_key UNIQUE (email)`);
      console.log(`✅ 确保 email 唯一约束`);
    } catch (error) {
      console.error(`❌ 添加 email 唯一约束失败:`, error.message);
    }
    
    // 6. 验证修复结果
    console.log(`\n=== 验证修复结果 ===`);
    const finalColumnsResult = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    const finalColumns = finalColumnsResult.rows;
    console.log(`修复后用户表列数: ${finalColumns.length}`);
    
    // 检查所有预期列是否存在
    const allExpectedColumnsExist = expectedColumns.every(expected => 
      finalColumns.some(col => col.column_name === expected.name)
    );
    
    if (allExpectedColumnsExist) {
      console.log('✅ 所有预期列都存在');
    } else {
      console.log('❌ 仍然缺少一些预期列');
    }
    
    // 7. 检查索引
    console.log(`\n=== 检查用户表索引 ===`);
    const indexesResult = await db.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'users' 
      ORDER BY indexname
    `);
    
    const indexes = indexesResult.rows.map(row => row.indexname);
    console.log(`用户表索引数量: ${indexes.length}`);
    indexes.forEach(index => console.log(`  - ${index}`));
    
    // 确保必要的索引存在
    const requiredIndexes = ['idx_users_email', 'idx_users_username'];
    for (const indexName of requiredIndexes) {
      if (indexes.includes(indexName)) {
        console.log(`✅ 索引 ${indexName} 存在`);
      } else {
        console.log(`⚠️  索引 ${indexName} 缺失`);
        try {
          if (indexName === 'idx_users_email') {
            await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
            console.log(`✅ 创建索引 ${indexName}`);
          } else if (indexName === 'idx_users_username') {
            await db.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
            console.log(`✅ 创建索引 ${indexName}`);
          }
        } catch (error) {
          console.error(`❌ 创建索引 ${indexName} 失败:`, error.message);
        }
      }
    }
    
    console.log(`\n=== 修复完成 ===`);
    console.log('✅ 用户表结构修复完成');
    console.log('\n注意事项:');
    console.log('1. 某些类型不匹配的列可能需要手动处理，特别是涉及数据转换的情况');
    console.log('2. 数据库中存在的额外列不会被删除，以避免数据丢失');
    console.log('3. 建议在生产环境中进行此类操作前先备份数据');
    
  } catch (error) {
    console.error('\n❌ 修复过程中出错:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行修复
analyzeAndFixUserTable();
