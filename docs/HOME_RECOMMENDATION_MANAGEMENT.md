# 首页推荐位管理功能

## 功能概述

首页推荐位管理功能是一个可视化的后台管理工具，允许管理员通过直观的拖拽操作来管理首页推荐内容的展示顺序。该功能包含以下核心模块:

### 核心功能

1. **推荐内容数据管理系统**
   - 支持添加、编辑、删除推荐项
   - 支持多种推荐类型：作品、活动、模板、挑战
   - 支持设置推荐项的激活/停用状态
   - 支持设置推荐时间范围

2. **可视化拖拽排序界面**
   - 基于 Framer Motion 的 Reorder 组件实现流畅的拖拽体验
   - 实时显示排序索引
   - 拖拽时视觉反馈（放大、阴影等）
   - 支持批量调整顺序

3. **实时预览功能**
   - 预览调整后的推荐内容在首页的实际显示效果
   - 网格布局展示，模拟真实首页效果
   - 显示排序编号

4. **操作日志和撤销/恢复**
   - 所有操作自动记录日志
   - 支持撤销（Undo）最近的操作
   - 支持重做（Redo）已撤销的操作
   - 操作日志可查询、可追溯

## 技术栈

- **前端框架**: React 18.2.0
- **UI 库**: Tailwind CSS
- **动画库**: Framer Motion (拖拽功能)
- **图标库**: Lucide React
- **状态管理**: React Hooks
- **后端服务**: Supabase
- **类型系统**: TypeScript

## 文件结构

```
src/
├── pages/admin/
│   └── HomeRecommendationManagement.tsx    # 推荐位管理主页面
├── services/
│   └── homeRecommendationService.ts        # 推荐位管理服务
├── components/admin/
│   └── AdminSidebar.tsx                     # 管理后台侧边栏（已更新）
scripts/
└── migration-home-recommendation.sql        # 数据库迁移脚本
```

## 安装和配置

### 1. 数据库迁移

执行数据库迁移脚本创建所需的表结构:

```bash
# 使用 psql 执行
psql -h <host> -U <username> -d <database> -f scripts/migration-home-recommendation.sql

# 或者通过项目的迁移工具执行
pnpm run migrate --file scripts/migration-home-recommendation.sql
```

迁移会创建以下数据库对象:

- `home_recommendations` 表：存储推荐项配置
- `recommendation_operation_logs` 表：记录操作日志
- `increment_recommendation_click` 函数：增加点击统计
- `increment_recommendation_impression` 函数：增加曝光统计
- 自动更新触发器

### 2. 访问管理页面

启动开发服务器后，访问:

```
http://localhost:5173/admin?tab=homeRecommendation
```

或者在管理后台侧边栏点击"首页推荐位管理"菜单。

## 使用说明

### 添加推荐项

1. 点击右上角的"添加推荐"按钮
2. 选择推荐项类型（作品/活动/模板/挑战）
3. 从列表中选择具体项目
4. 填写标题、描述、缩略图等信息
5. 设置是否立即激活
6. 点击"保存"

### 拖拽排序

1. 鼠标悬停在推荐项上
2. 按住拖拽手柄（左侧的 grip 图标）
3. 拖动到目标位置
4. 松开鼠标完成排序
5. 系统自动保存新的顺序

### 预览效果

1. 点击顶部工具栏的"预览"按钮
2. 查看推荐项在首页的实际显示效果
3. 预览窗口显示排序编号
4. 关闭预览返回编辑界面

### 撤销/恢复操作

- **撤销**: 点击撤销按钮（Undo2 图标）撤销最近一次操作
- **恢复**: 点击恢复按钮（Redo2 图标）恢复已撤销的操作
- 支持的操作类型：创建、删除、更新、排序、切换状态

### 查看操作日志

1. 点击"操作日志"按钮
2. 查看所有操作记录
3. 日志包含：操作类型、操作对象、操作时间、操作人、备注

### 筛选和搜索

- **类型筛选**: 按推荐项类型筛选（全部/作品/活动/模板/挑战）
- **状态筛选**: 按激活状态筛选（全部/已激活/已停用）
- **搜索**: 输入关键词搜索推荐项标题或描述

## 数据模型

### HomeRecommendationItem

```typescript
interface HomeRecommendationItem {
  id?: string;              // 主键 ID
  item_id: string;          // 推荐项 ID
  item_type: 'work' | 'event' | 'template' | 'challenge';  // 推荐项类型
  title: string;            // 标题
  description?: string;     // 描述
  thumbnail?: string;       // 缩略图 URL
  order_index: number;      // 排序索引
  is_active: boolean;       // 是否激活
  start_date?: string;      // 开始日期
  end_date?: string;        // 结束日期
  click_count?: number;     // 点击次数
  impression_count?: number; // 曝光次数
  created_by?: string;      // 创建人 ID
  created_at?: string;      // 创建时间
  updated_at?: string;      // 更新时间
  metadata?: Record<string, any>; // 额外元数据
}
```

### RecommendationOperationLog

```typescript
interface RecommendationOperationLog {
  id?: string;
  operation_type: 'create' | 'update' | 'delete' | 'reorder' | 'activate' | 'deactivate';
  item_id: string;
  previous_value?: any;
  new_value?: any;
  operated_by: string;
  operated_at?: string;
  notes?: string;
}
```

## API 接口

### homeRecommendationService

```typescript
// 获取推荐列表
getRecommendations(params: RecommendationQueryParams)

// 获取激活的推荐项
getActiveRecommendations()

// 创建推荐项
createRecommendation(item, userId)

// 更新推荐项
updateRecommendation(id, updates, userId)

// 删除推荐项
deleteRecommendation(id, userId)

// 批量调整顺序
reorderRecommendations(items, userId)

// 切换激活状态
toggleRecommendationStatus(id, userId)

// 获取操作日志
getOperationLogs(params)

// 跟踪点击
trackClick(itemId)

// 获取统计数据
getRecommendationStats()
```

## 最佳实践

### 1. 性能优化

- 使用虚拟滚动处理大量推荐项
- 图片懒加载
- 防抖搜索输入
- 缓存常用数据

### 2. 数据安全

- 所有操作需要管理员权限
- 操作日志完整记录
- 支持撤销/恢复防止误操作
- 敏感操作需要二次确认

### 3. 用户体验

- 实时反馈操作结果
- 加载状态清晰可见
- 错误提示友好
- 响应式设计支持移动端

### 4. 可维护性

- 代码结构清晰
- 类型定义完整
- 注释详细
- 遵循项目代码规范

## 故障排除

### 常见问题

**Q: 拖拽功能不工作？**
A: 检查是否使用了 Framer Motion 的 Reorder 组件，确保版本兼容。

**Q: 数据库迁移失败？**
A: 检查数据库连接和权限，确保有创建表和函数的权限。

**Q: 操作日志没有记录？**
A: 检查 `recommendation_operation_logs` 表是否存在，以及写入权限。

**Q: 预览窗口显示异常？**
A: 检查推荐项的 thumbnail 字段是否正确，确保图片 URL 可访问。

## 未来规划

- [ ] 支持更多推荐类型（用户、专栏等）
- [ ] 增加 A/B 测试功能
- [ ] 支持定时上下架
- [ ] 增加推荐效果分析报表
- [ ] 支持批量导入/导出
- [ ] 增加智能推荐算法
- [ ] 支持多语言推荐内容

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个功能。请确保：

1. 代码符合项目规范
2. 添加必要的类型定义
3. 更新相关文档
4. 测试所有功能

## 许可证

与项目主许可证保持一致。

## 联系方式

如有问题或建议，请联系开发团队。
