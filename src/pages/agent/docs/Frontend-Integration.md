# Skill 架构前端集成指南

## 概述

Skill 架构不仅可以在服务层使用，也可以直接在前端 React 组件中使用。通过 `useSkill` Hook，你可以：

1. **自动意图识别** - 根据用户输入自动识别意图并执行最佳 Skill
2. **直接执行 Skill** - 手动调用特定 Skill
3. **管理 Skill 状态** - 获取执行状态、错误信息、结果数据
4. **动态注册 Skill** - 在运行时注册自定义 Skill

## 快速开始

### 1. 基础使用

```tsx
import { useSkill } from './hooks';

function MyComponent() {
  const { processMessage, isProcessing, error } = useSkill();

  const handleSend = async (message: string) => {
    try {
      const result = await processMessage(message);
      console.log('结果:', result);
    } catch (err) {
      console.error('错误:', err);
    }
  };

  return (
    <div>
      {isProcessing && <span>处理中...</span>}
      {error && <span className="error">{error}</span>}
      <button onClick={() => handleSend('帮我画一个Logo')}>
        发送
      </button>
    </div>
  );
}
```

### 2. 配置选项

```tsx
const {
  processMessage,
  executeSkill,
  // ...
} = useSkill({
  userId: 'user-123',              // 用户ID
  sessionId: 'session-456',        // 会话ID
  autoRegisterDefaultSkills: true  // 自动注册默认Skill
});
```

### 3. 完整示例

```tsx
import React, { useState } from 'react';
import { useSkill } from './hooks';
import { SkillCategory } from './types/skill';

export const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');

  const {
    processMessage,
    isProcessing,
    error,
    getAvailableSkills,
    getSkillsByCategory
  } = useSkill({
    userId: 'current-user',
    autoRegisterDefaultSkills: true
  });

  // 获取可用的 Skill
  const allSkills = getAvailableSkills();
  const creationSkills = getSkillsByCategory(SkillCategory.CREATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    try {
      // 自动识别意图并执行
      const result = await processMessage(input);

      // 添加 Skill 响应
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.content,
        type: result.type
      }]);

      setInput('');
    } catch (err) {
      console.error('处理失败:', err);
    }
  };

  return (
    <div className="chat-container">
      {/* 显示可用的 Skill */}
      <div className="skills-info">
        <p>可用 Skill: {allSkills.map(s => s.name).join(', ')}</p>
        <p>创作类: {creationSkills.map(s => s.name).join(', ')}</p>
      </div>

      {/* 消息列表 */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isProcessing && <div className="loading">处理中...</div>}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入消息..."
          disabled={isProcessing}
        />
        <button type="submit" disabled={isProcessing}>
          发送
        </button>
      </form>

      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

## API 参考

### useSkill Hook

#### 配置选项

```typescript
interface UseSkillOptions {
  userId?: string;                    // 用户ID，默认 'anonymous'
  sessionId?: string;                 // 会话ID，默认 'default'
  autoRegisterDefaultSkills?: boolean; // 自动注册默认Skill，默认 true
}
```

#### 返回值

```typescript
interface UseSkillReturn {
  // 状态
  isProcessing: boolean;              // 是否正在处理
  error: string | null;               // 错误信息
  lastResult: SkillResult | null;     // 最后执行结果

  // 方法
  processMessage: (message: string, options?) => Promise<SkillResult>;
  executeSkill: (skillId: string, options) => Promise<SkillResult>;
  getAvailableSkills: () => ISkill[];
  getSkillsByCategory: (category: SkillCategory) => ISkill[];
  matchIntent: (intent: UserIntent) => SkillMatchResult[];
  registerSkill: (skill: ISkill, priority?: number) => void;
  getSkillStats: (skillId: string) => SkillStats | undefined;
  clearError: () => void;

  // 高级使用
  registry: SkillRegistry;
  matcher: SkillMatcher;
}
```

### 方法详解

#### processMessage

自动识别用户意图并执行最佳匹配的 Skill。

```typescript
const result = await processMessage('帮我画一个Logo', {
  history: previousMessages,  // 历史消息
  parameters: {               // 额外参数
    style: '简约',
    size: '1024x1024'
  },
  currentAgent: 'designer'    // 当前Agent
});

// 结果
// {
//   success: true,
//   content: 'image-url',
//   type: 'image',
//   metadata: { ... }
// }
```

#### executeSkill

直接执行指定的 Skill。

```typescript
const result = await executeSkill('image-generation', {
  message: '生成图像',
  parameters: {
    prompt: '一个现代风格的Logo',
    style: '简约'
  }
});
```

#### getAvailableSkills

获取所有已注册的 Skill。

```typescript
const skills = getAvailableSkills();
// [
//   { id: 'intent-recognition', name: '意图识别', ... },
//   { id: 'image-generation', name: '图像生成', ... },
//   ...
// ]
```

#### getSkillsByCategory

按分类获取 Skill。

```typescript
const creationSkills = getSkillsByCategory(SkillCategory.CREATION);
// 返回所有创作类 Skill
```

#### registerSkill

动态注册自定义 Skill。

```typescript
import { MyCustomSkill } from './skills';

registerSkill(new MyCustomSkill(), 100);
```

## 使用场景

### 场景 1：智能对话界面

```tsx
function SmartChat() {
  const { processMessage, isProcessing } = useSkill();

  const handleUserMessage = async (text: string) => {
    // 自动识别意图：
    // "帮我画个图" -> 调用 ImageGenerationSkill
    // "写个文案" -> 调用 TextGenerationSkill
    // "分析一下" -> 调用 RequirementAnalysisSkill
    const result = await processMessage(text);
    
    // 根据结果类型显示不同UI
    switch (result.type) {
      case 'image':
        showImage(result.content);
        break;
      case 'text':
        showText(result.content);
        break;
      case 'structured':
        showStructuredData(result.metadata);
        break;
    }
  };

  // ...
}
```

### 场景 2：快捷操作面板

```tsx
function QuickActions() {
  const { executeSkill, getSkillsByCategory } = useSkill();
  const creationSkills = getSkillsByCategory(SkillCategory.CREATION);

  return (
    <div className="quick-actions">
      {creationSkills.map(skill => (
        <button
          key={skill.id}
          onClick={() => executeSkill(skill.id, {
            message: `快速执行 ${skill.name}`,
            parameters: { quick: true }
          })}
        >
          {skill.name}
        </button>
      ))}
    </div>
  );
}
```

### 场景 3：Skill 管理面板

```tsx
function SkillManager() {
  const { getAvailableSkills, getSkillStats, registerSkill } = useSkill();
  const skills = getAvailableSkills();

  return (
    <div className="skill-manager">
      <h2>Skill 管理</h2>
      
      {skills.map(skill => {
        const stats = getSkillStats(skill.id);
        return (
          <div key={skill.id} className="skill-card">
            <h3>{skill.name}</h3>
            <p>{skill.description}</p>
            <p>分类: {skill.category}</p>
            <p>执行次数: {stats?.totalExecutions || 0}</p>
            <p>成功率: {stats 
              ? (stats.successfulExecutions / stats.totalExecutions * 100).toFixed(1)
              : 0}%
            </p>
          </div>
        );
      })}
    </div>
  );
}
```

## 最佳实践

### 1. 错误处理

```tsx
const { processMessage, error, clearError } = useSkill();

// 显示错误
{error && (
  <div className="error">
    {error}
    <button onClick={clearError}>关闭</button>
  </div>
)}
```

### 2. 加载状态

```tsx
const { isProcessing } = useSkill();

<button disabled={isProcessing}>
  {isProcessing ? '处理中...' : '发送'}
</button>
```

### 3. 结果缓存

```tsx
const [results, setResults] = useState<Map<string, SkillResult>>(new Map());

const handleProcess = async (message: string) => {
  // 检查缓存
  if (results.has(message)) {
    return results.get(message);
  }

  const result = await processMessage(message);
  
  // 缓存结果
  setResults(prev => new Map(prev).set(message, result));
  
  return result;
};
```

### 4. 批量执行

```tsx
const { executeSkill } = useSkill();

const batchExecute = async (messages: string[]) => {
  const promises = messages.map(msg => 
    executeSkill('text-generation', { message: msg })
  );
  
  const results = await Promise.all(promises);
  return results;
};
```

## 注意事项

1. **Skill 注册** - 默认会自动注册常用 Skill，如需自定义，设置 `autoRegisterDefaultSkills: false`

2. **状态管理** - `isProcessing` 是全局的，同一时间只能处理一个请求

3. **错误处理** - 始终使用 try-catch 包裹 `processMessage` 和 `executeSkill`

4. **性能优化** - 大量使用 `getAvailableSkills` 时，考虑使用 useMemo 缓存结果

5. **内存管理** - 组件卸载时会自动清理，但长时间运行的页面建议定期调用 `registry.clear()`

## 示例组件

完整的示例组件请查看：[SkillDemo.tsx](../components/SkillDemo.tsx)

运行示例：

```tsx
import { SkillDemo } from './components/SkillDemo';

function App() {
  return <SkillDemo />;
}
```
