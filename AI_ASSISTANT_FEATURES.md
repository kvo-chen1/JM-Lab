# AI 助手功能完善总结

## 功能概述

本次更新完善了津脉智坊平台的 AI 助手（津小脉）功能，实现了以下核心能力：

### 1. 智能页面跳转
- **功能**：AI 助手可以识别用户的导航意图，自动跳转到对应页面
- **支持页面**：
  - 首页、创作中心、津脉广场
  - 文化知识、文创市集、我的作品
  - 灵感引擎、仪表盘、设置
  - 个人中心、探索、文化活动等
- **使用方式**：用户可以说"带我去创作中心"、"我想去广场"等

### 2. 平台操作指导
- **功能**：AI 助手可以提供详细的平台功能操作指南
- **支持场景**：
  - 如何发布作品
  - 如何使用 AI 生成功能
  - 如何参与文化活动
  - 新手指南、FAQ 等
- **特点**：分步骤指导，包含详细操作说明

### 3. 长记忆功能
- **功能**：AI 助手可以记住用户的偏好、习惯和目标
- **记忆类型**：
  - 偏好（Preference）：用户喜欢的内容类型
  - 习惯（Habit）：用户的使用习惯
  - 目标（Goal）：用户的短期和长期目标
  - 事实（Fact）：用户的基本信息
- **隐私保护**：每个用户的记忆仅自己可见

### 4. 对话历史持久化
- **功能**：对话历史保存到数据库，支持跨会话访问
- **特点**：
  - 用户登录后可查看历史对话
  - 支持多会话管理
  - 支持对话搜索和归档

### 5. 数据隔离与隐私保护
- **RLS 策略**：所有表启用行级安全策略
- **用户隔离**：用户只能访问自己的数据
- **权限控制**：
  - 用户只能访问自己的对话和记忆
  - 平台知识库只读，仅管理员可修改

## 技术实现

### 数据库表结构

#### 1. ai_conversations - 对话会话表
```sql
- id: UUID 主键
- user_id: 用户ID（外键）
- title: 对话标题
- model_id: 使用的AI模型
- created_at/updated_at: 时间戳
- is_active: 是否活跃
- context_summary: 上下文摘要
- message_count: 消息数量
```

#### 2. ai_messages - 对话消息表
```sql
- id: UUID 主键
- conversation_id: 会话ID（外键）
- role: 角色（user/assistant/system）
- content: 消息内容
- timestamp: 时间戳
- is_error: 是否错误消息
- feedback_rating/feedback_comment: 用户反馈
```

#### 3. ai_user_memories - 用户长记忆表
```sql
- id: UUID 主键
- user_id: 用户ID（外键）
- memory_type: 记忆类型
- content: 记忆内容
- importance: 重要程度
- expires_at: 过期时间
- is_active: 是否活跃
```

#### 4. ai_platform_knowledge - 平台知识库表
```sql
- id: UUID 主键
- category: 分类（navigation/operation/feature/guide/faq）
- question: 问题
- answer: 答案
- related_pages: 相关页面
- keywords: 关键词
- steps: 操作步骤（JSON）
- priority: 优先级
```

#### 5. ai_user_settings - 用户AI设置表
```sql
- id: UUID 主键
- user_id: 用户ID（外键）
- personality: 助手性格
- theme: 主题
- enable_memory: 是否启用记忆
- preferred_model: 首选模型
- custom_settings: 自定义设置
```

### 新增服务文件

#### 1. aiKnowledgeService.ts
- **功能**：平台知识库查询和导航识别
- **主要方法**：
  - `searchKnowledge()` - 搜索知识库
  - `recognizeNavigationIntent()` - 识别导航意图
  - `generateSmartResponse()` - 生成智能回复
  - `getContextualQuestions()` - 获取上下文相关问题

#### 2. aiMemoryService.ts
- **功能**：用户长记忆和对话历史管理
- **主要方法**：
  - `createConversation()` - 创建对话
  - `saveMessage()` - 保存消息
  - `getConversationHistory()` - 获取对话历史
  - `addMemory()` - 添加记忆
  - `getMemories()` - 获取记忆
  - `extractAndSaveMemories()` - 从对话提取记忆

#### 3. aiAssistantService.ts
- **功能**：整合知识库、记忆和LLM服务
- **主要方法**：
  - `initialize()` - 初始化服务
  - `processMessage()` - 处理用户消息
  - `generateLLMResponse()` - 生成LLM回复
  - `getConversationHistory()` - 获取对话历史

### 修改的文件

#### FloatingAIAssistant.tsx
- 添加 AI 助手服务导入
- 修改 `handleSendMessage()` 使用新的 AI 助手服务
- 修改 `getPresetQuestions()` 使用知识库服务
- 修改快捷操作（新对话、清空历史）使用记忆服务
- 添加初始化逻辑，加载历史对话

## 使用指南

### 用户如何使用

1. **页面导航**
   - "带我去创作中心"
   - "我想去津脉广场"
   - "打开我的作品"

2. **获取操作指导**
   - "如何发布作品？"
   - "怎么使用AI生成？"
   - "新手如何快速上手？"

3. **查看历史对话**
   - 登录后自动加载历史对话
   - 点击"新对话"开始新会话
   - 历史对话自动保存

### 开发者如何扩展

1. **添加新的导航页面**
   - 在 `aiKnowledgeService.ts` 的 `PAGE_NAVIGATION_MAP` 中添加

2. **添加新的知识库内容**
   - 在数据库 `ai_platform_knowledge` 表中插入数据
   - 或使用 `aiKnowledgeService.searchKnowledge()` 接口

3. **调整记忆提取逻辑**
   - 修改 `aiMemoryService.ts` 中的 `extractPreference()`、`extractGoal()` 等方法

## 数据库迁移

迁移文件位置：`supabase/migrations/20260219000000_create_ai_assistant_tables.sql`

执行方式：
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 粘贴迁移文件内容并执行

或者使用脚本：
```bash
node scripts/apply-ai-migration-v3.mjs
```

## 注意事项

1. **隐私保护**：所有用户数据通过 RLS 策略隔离，确保用户只能访问自己的数据
2. **性能优化**：知识库查询有5分钟缓存，记忆查询有10分钟缓存
3. **错误处理**：所有数据库操作都有错误处理和降级方案
4. **向后兼容**：未登录用户仍可正常使用基础功能

## 后续优化方向

1. **语义搜索**：使用向量数据库实现更智能的知识库搜索
2. **记忆压缩**：对长期记忆进行智能压缩和摘要
3. **多模态**：支持图片、视频等多模态内容的理解和记忆
4. **个性化推荐**：基于用户记忆提供个性化内容推荐
