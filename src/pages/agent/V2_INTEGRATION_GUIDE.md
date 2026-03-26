# 津小脉 Agent 增强版 (V2) 集成指南

## 概述

增强版 (V2) 编排器已经集成到现有系统中，通过 URL 参数控制启用。V2 版本包含以下核心改进：

1. **深度需求分析** - 使用 LLM 进行多维度需求分析
2. **智能决策引擎** - 基于多因素的智能任务分配
3. **可视化思考过程** - 实时展示 Agent 的思考步骤
4. **强化版设计总监** - 真正的智能大脑，具备指挥调度能力

## 如何启用

### 方法1：通过 URL 参数
在 Agent 页面 URL 后添加 `?v2=true` 或 `?enhanced=true`：

```
http://localhost:3000/agent?v2=true
http://localhost:3000/agent?enhanced=true
```

### 方法2：通过界面切换
在 ChatPanel 的 Agent 指示器旁边，点击 "✨ 试用增强版" 链接即可自动刷新页面并启用 V2。

## 核心组件

### 1. RequirementAnalysisService
**路径**: `src/pages/agent/services/requirementAnalysisService.ts`

深度分析用户需求，包括：
- 项目类型识别 (ip-character/brand-design/packaging/...)
- 需求完整度评估
- 复杂度分析
- Agent 分配建议
- 缺失信息识别

### 2. DecisionEngine
**路径**: `src/pages/agent/services/decisionEngine.ts`

智能决策引擎，基于以下因素做决策：
- 需求分析结果
- Agent 能力匹配度
- 项目复杂度
- 历史协作效果
- 系统负载状态

### 3. DirectorAgent (强化版)
**路径**: `src/pages/agent/agents/DirectorAgent.ts`

强化版设计总监，具备：
- 深度需求分析
- 智能任务规划
- 动态调度决策
- 质量检查与反馈

### 4. AgentOrchestratorV2
**路径**: `src/pages/agent/services/agentOrchestratorV2.ts`

增强版编排器，集成：
- ThinkingRecorder 思考过程记录
- RequirementAnalysisService 需求分析
- DecisionEngine 智能决策
- 完整的可视化思考过程

### 5. ThinkingProcessPanel
**路径**: `src/pages/agent/components/ThinkingProcessPanel.tsx`

思考过程可视化组件：
- 实时展示思考步骤
- 支持展开查看详情
- 显示执行时间和状态
- 内联和面板两种模式

## 使用流程

### 正常流程 (V1)
1. 用户输入消息
2. 编排器简单处理
3. 返回响应

### 增强流程 (V2)
1. 用户输入消息
2. **意图识别** - 分析用户意图类型
3. **需求分析** - 深度分析需求多维度信息
4. **调度决策** - 基于分析结果智能决策
5. **执行决策** - 委派/协作/收集信息
6. **可视化展示** - 实时展示思考过程

## 思考过程展示

V2 版本会在以下位置展示思考过程：

### 1. 浮动面板 (ChatPanel)
- 位置：消息列表右上角
- 显示：当前会话的完整思考过程
- 功能：可收起/展开，查看详情

### 2. 消息内联 (ChatMessage)
- 位置：AI 消息底部
- 显示：该消息的思考步骤摘要
- 功能：点击展开查看详情

### 3. 决策信息
- 显示：决策类型、理由、置信度
- 用途：帮助理解 Agent 的决策逻辑

## 决策类型

V2 编排器支持以下决策类型：

| 类型 | 说明 | 使用场景 |
|------|------|----------|
| `collect` | 信息收集 | 需求不完整时，询问关键信息 |
| `delegate` | 任务委派 | 需求明确，分配给单个 Agent |
| `collaborate` | 多Agent协作 | 复杂项目，需要多领域专家 |
| `respond` | 直接响应 | 问候、咨询等简单交互 |

## 向后兼容

V2 版本完全向后兼容：
- 默认使用 V1 版本（不带 URL 参数）
- V2 响应自动转换为 V1 格式
- 所有现有功能正常工作
- 可随时切换回 V1

## 性能考虑

### 缓存机制
- 需求分析结果缓存 5 分钟
- 相同输入直接返回缓存结果
- 减少 LLM 调用次数

### 降级策略
- 分析失败时返回降级结果
- 保留基本功能可用性
- 记录错误用于后续优化

## 调试技巧

### 查看思考过程
1. 启用 V2 版本 (`?v2=true`)
2. 发送消息
3. 观察右上角的思考过程面板
4. 点击步骤查看详情

### 检查决策信息
在浏览器控制台查看：
```javascript
// 查看最后一条消息的元数据
const lastMessage = document.querySelector('.chat-message:last-child');
console.log(lastMessage.dataset.metadata);
```

### 切换版本对比
1. 打开两个标签页
2. 一个使用 V1 (默认)
3. 一个使用 V2 (`?v2=true`)
4. 发送相同消息对比响应

## 未来优化方向

1. **流式思考过程** - 实时显示思考步骤，减少等待感
2. **用户反馈学习** - 根据用户反馈优化决策逻辑
3. **个性化推荐** - 基于历史偏好优化 Agent 分配
4. **多模态分析** - 支持图片、文档等输入分析

## 常见问题

### Q: V2 版本会影响现有功能吗？
A: 不会。V2 是可选功能，默认关闭，完全向后兼容。

### Q: 为什么需要 URL 参数启用？
A: 方便 A/B 测试和灰度发布，让用户自主选择。

### Q: 思考过程会保存吗？
A: 当前会话的思考过程会显示，但刷新页面后会重置。

### Q: 所有 Agent 都支持 V2 吗？
A: 目前主要是 DirectorAgent 使用 V2 能力，其他 Agent 逐步迁移中。

## 反馈渠道

如遇到 V2 版本的问题或有改进建议，请通过以下方式反馈：
1. 在消息中 @设计总监 反馈
2. 提交 Issue 到项目仓库
3. 联系开发团队
