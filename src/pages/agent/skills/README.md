# Skill 架构使用指南

## 概述

本文档介绍新的 Skill 架构，帮助开发者理解和使用 Skill 系统。

## 架构概览

```
Agent Layer
    │
    ▼
Skill Registry (Skill 注册中心)
    │
    ▼
Skill Layer (技能层)
    ├─ Creation Skills (创作类)
    ├─ Analysis Skills (分析类)
    ├─ Cognition Skills (认知类)
    ├─ Orchestration Skills (编排类)
    └─ Enhancement Skills (增强类)
    │
    ▼
Foundation Layer (基础服务层)
    ├─ LLM Service
    ├─ Vector Store
    └─ File Storage
```

## 快速开始

### 1. 使用现有 Skill

```typescript
import {
  getSkillRegistry,
  ImageGenerationSkill,
  IntentRecognitionSkill
} from './services';

// 获取注册中心
const registry = getSkillRegistry();

// 注册 Skill
registry.register(new ImageGenerationSkill());
registry.register(new IntentRecognitionSkill());

// 使用 Skill
const imageSkill = registry.getSkill('image-generation');
const result = await imageSkill.execute({
  userId: 'user-1',
  sessionId: 'session-1',
  message: '帮我设计一个 Logo',
  history: [],
  parameters: {
    prompt: '一个现代简约风格的科技公司 Logo',
    style: '简约'
  }
});

if (result.success) {
  console.log('生成的图像URL:', result.content);
}
```

### 2. 创建自定义 Skill

```typescript
import { BaseSkill, UserIntent, ExecutionContext, SkillResult, SkillCategory } from './services';

export class MyCustomSkill extends BaseSkill {
  readonly id = 'my-custom-skill';
  readonly name = '我的自定义技能';
  readonly description = '这是一个示例技能';
  readonly category = SkillCategory.CREATION;

  readonly capabilities = [
    {
      id: 'custom-action',
      name: '自定义操作',
      description: '执行自定义操作',
      parameters: [
        { name: 'input', type: 'string', required: true, description: '输入参数' }
      ]
    }
  ];

  canHandle(intent: UserIntent): boolean {
    // 判断是否可以处理该意图
    return intent.type === 'my-custom-intent';
  }

  protected async doExecute(context: ExecutionContext): Promise<SkillResult> {
    const { parameters } = context;

    // 执行技能逻辑
    const result = await doSomething(parameters);

    return this.createSuccessResult(
      result,
      'text',
      { customData: result }
    );
  }
}
```

### 3. 使用 Agent

```typescript
import { createAgent, DirectorAgent, DesignerAgent } from './agents';

// 创建 Agent
const director = new DirectorAgent();
const designer = new DesignerAgent();

// 处理用户消息
const response = await director.handleMessage(
  '帮我设计一个品牌 Logo',
  {
    userId: 'user-1',
    sessionId: 'session-1',
    message: '帮我设计一个品牌 Logo',
    history: []
  }
);

console.log('Agent 响应:', response.content);
```

## Skill 分类

### 创作类 (Creation)
- **ImageGenerationSkill**: 图像生成
- **VideoGenerationSkill**: 视频生成
- **TextGenerationSkill**: 文本生成

### 分析类 (Analysis)
- **IntentRecognitionSkill**: 意图识别
- **RequirementAnalysisSkill**: 需求分析

### 认知类 (Cognition)
- **MemorySkill**: 记忆管理
- **LearningSkill**: 反馈学习

### 编排类 (Orchestration)
- **OrchestrationSkill**: Agent 编排
- **WorkflowSkill**: 工作流管理

### 增强类 (Enhancement)
- **RAGSkill**: RAG 检索增强
- **ContextSkill**: 上下文管理

## 最佳实践

1. **Skill 粒度**: 每个 Skill 应该职责单一，专注于一个具体功能
2. **错误处理**: 使用 `createErrorResult` 返回错误信息
3. **元数据**: 在 Skill 结果中返回有用的元数据
4. **配置**: 使用构造函数参数进行 Skill 配置
5. **日志**: 使用 `console.log` 记录关键操作

## 迁移指南

从旧服务迁移到 Skill 架构：

1. 识别服务中的核心功能
2. 创建对应的 Skill 类
3. 将业务逻辑迁移到 `doExecute` 方法
4. 注册 Skill 到注册中心
5. 更新调用代码使用 Skill 接口

## 调试技巧

```typescript
// 查看所有注册的 Skill
const stats = registry.getRegistryStats();
console.log('注册统计:', stats);

// 查看 Skill 执行统计
const skillStats = registry.getStats('image-generation');
console.log('图像生成 Skill 统计:', skillStats);

// 监听 Skill 事件
registry.on('skill:executed', (event) => {
  console.log('Skill 执行:', event.skillId);
});
```
