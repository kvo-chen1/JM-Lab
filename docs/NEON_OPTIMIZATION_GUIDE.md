# Neon 数据库连接优化指南

## 性能测试结果

### 测试环境
- 数据库: Neon PostgreSQL (us-east-2)
- 测试时间: 2026-03-07
- 网络: 中国大陆访问

### 结果对比

| 指标 | Pooler 模式 | 直连模式 | 差异 |
|------|-------------|----------|------|
| 冷启动 | 808ms | 1283ms | 直连慢 58% |
| 热连接 | 463ms | 253ms | **直连快 45%** |
| 并发 QPS | ~5 | 7.2 | 直连高 44% |

## 优化策略

### 1. 连接字符串优化

**当前配置（Pooler）:**
```
postgresql://user:pass@ep-xxxxx-pooler.c-3.us-east-2.aws.neon.tech/neondb
```

**优化配置（直连）:**
```
postgresql://user:pass@ep-xxxxx.c-3.us-east-2.aws.neon.tech/neondb
```

**自动转换:**
```javascript
const directUrl = poolerUrl.replace(/-pooler(\.[a-z]-\d)/, '$1')
```

### 2. 连接池配置

**推荐配置:**
```javascript
{
  max: 10,                    // 最大连接数
  min: 2,                     // 最小连接数（预热）
  idleTimeoutMillis: 30000,   // 空闲超时
  connectionTimeoutMillis: 10000,
  keepAlive: true,            // 保持连接
  keepAliveInitialDelayMillis: 10000
}
```

### 3. 连接池预热

```javascript
// 应用启动时预热连接
await initPool()

// 预热函数
const warmupPool = async () => {
  const connections = []
  for (let i = 0; i < minConnections; i++) {
    connections.push(pool.connect().then(client => {
      return client.query('SELECT 1').then(() => {
        client.release()
      })
    }))
  }
  await Promise.all(connections)
}
```

### 4. 查询优化

**慢查询警告:**
- 设置阈值: > 1000ms
- 记录并分析慢查询

**连接复用:**
- 使用连接池而非单次连接
- 及时释放连接

## 环境变量配置

```bash
# 推荐：使用直连地址
NEON_DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxxxx.c-3.us-east-2.aws.neon.tech/neondb

# 连接池配置
POSTGRES_MAX_POOL_SIZE=10
POSTGRES_MIN_POOL_SIZE=2
POSTGRES_IDLE_TIMEOUT=30000
```

## 监控指标

### 关键指标
1. **响应时间** - 目标 < 500ms
2. **连接池使用率** - 目标 < 80%
3. **QPS** - 根据业务需求
4. **错误率** - 目标 < 1%

### 监控命令
```bash
# 健康检查
node scripts/check-neon-health.mjs

# 性能测试
node scripts/benchmark-neon.mjs
```

## 故障排查

### 连接超时
- 检查网络连接
- 增加 connectionTimeoutMillis
- 考虑使用更近的 Region

### 连接池耗尽
- 增加 max 连接数
- 检查连接是否及时释放
- 优化慢查询

### 性能下降
- 检查连接池使用率
- 分析慢查询日志
- 考虑升级 Neon 套餐

## 最佳实践

1. **使用直连地址** - 热连接性能更好
2. **启用连接池预热** - 减少冷启动影响
3. **监控慢查询** - 及时发现性能问题
4. **合理设置连接池大小** - 避免资源浪费
5. **使用连接复用** - 减少连接开销

## 相关文件

- `server/database-optimized.mjs` - 优化的连接模块
- `scripts/benchmark-neon.mjs` - 性能测试脚本
- `scripts/check-neon-health.mjs` - 健康检查脚本
