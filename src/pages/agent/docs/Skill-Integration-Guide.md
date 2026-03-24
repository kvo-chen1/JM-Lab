# Agent-Skill 集成使用指南

## 概述

本文档介绍如何在 Agent 页面中使用新的 Skill 架构，实现 Agent 与 Skill 的融合。

## 核心概念

- **Agent**: 角色身份（设计总监、设计师、插画师等）
- **Skill**: 能力工具（图像生成、文本生成、意图识别等）
- **Agent-Skill 映射**: 每个 Agent 拥有一组特定的 Skill

## 快速开始

### 1. 使用 useSkill Hook

```tsx
import { useSkill } from '../hooks/useSkill';
import { AgentType } from '../types/agent';

function MyComponent() {
  const currentAgent: AgentType = 'designer';
  
  const {
    processMessage,        // 处理用户消息，自动匹配 Skill
    executeSkill,         // 直接执行指定 Skill
    getAgentAvailableSkills, // 获取当前 Agent 可用的 Skill
    isProcessing,
    error,
    lastResult
  } = useSkill({
    userId: 'user-123',
    sessionId: 'session-456',
    currentAgent,          // 传入当前 Agent，用于 Skill 匹配
    autoRegisterDefaultSkills: true
  });

  // 处理用户输入
  const handleSend = async (message: string) => {
    try {
      const result = await processMessage(message, {
        history: messages,
        currentAgent
      });
      
      console.log('执行结果:', result);
    } catch (err) {
      console.error('处理失败:', err);
    }
  };

  // 获取当前 Agent 的 Skill
  const availableSkills = getAgentAvailableSkills();
  console.log('可用 Skill:', availableSkills.map(s => s.name));
}
```

### 2. 显示 Agent 的 Skill 面板

```tsx
import { SkillPanel } from '../components/SkillPanel';

function ChatPanel() {
  const [showSkillPanel, setShowSkillPanel] = useState(false);
  const currentAgent: AgentType = 'designer';

  return (
    <div>
      {/* Skill 能力面板 */}
      <SkillPanel 
        agentType={currentAgent}
        isExpanded={showSkillPanel}
        onToggle={() => setShowSkillPanel(!showSkillPanel)}
      />
      
      {/* 其他内容 */}
    </div>
  );
}
```

### 3. 直接执行特定 Skill

```tsx
// 执行图像生成 Skill
const handleGenerateImage = async (prompt: string) => {
  const result = await executeSkill('image-generation', {
    message: prompt,
    parameters: {
      style: 'color-pencil',
      size: '1024x1024'
    },
    currentAgent
  });

  if (result.success && result.type === 'image') {
    console.log('生成的图片:', result.metadata?.imageUrl);
  }
};

// 执行文本生成 Skill
const handleGenerateCopy = async (topic: string) => {
  const result = await executeSkill('text-generation', {
    message: topic,
    parameters: {
      style: 'professional',
      length: 'medium'
    },
    currentAgent
  });

  if (result.success) {
    console.log('生成的文案:', result.content);
  }
};
```

## Agent-Skill 配置

### 查看 Agent 的 Skill 配置

```tsx
import { 
  AGENT_SKILL_CONFIG,
  getAgentSkills,
  AGENT_CAPABILITY_DESCRIPTIONS 
} from '../skills/registry';

// 获取 designer 的所有 Skill ID
const designerSkills = AGENT_SKILL_CONFIG.designer;
// ['intent-recognition', 'image-generation', 'style-recommendation', ...]

// 获取 Agent 的能力描述
const capabilityInfo = AGENT_CAPABILITY_DESCRIPTIONS.designer;
console.log(capabilityInfo.title);      // '品牌设计师'
console.log(capabilityInfo.description); // '专注视觉设计...'
console.log(capabilityInfo.skills);     // [{ id, name, description }, ...]
```

### 检查 Skill 支持

```tsx
import { isSkillSupportedByAgent, getAgentsBySkill } from '../skills/registry';

// 检查某个 Skill 是否支持指定 Agent
const isSupported = isSkillSupportedByAgent('image-generation', 'designer');
// true

// 获取支持某个 Skill 的所有 Agent
const agents = getAgentsBySkill('image-generation');
// ['designer', 'illustrator', 'director']
```

## 高级用法

### 自定义 Skill 匹配

```tsx
import { getSkillMatcher } from '../skills/registry';

const matcher = getSkillMatcher();

// 手动匹配 Skill
const matches = matcher.match(
  {
    type: 'image-generation',
    confidence: 0.9,
    keywords: ['画', '设计', 'logo'],
    entities: { style: 'modern' },
    rawMessage: '帮我设计一个现代风格的 Logo'
  },
  {
    userId: 'user-123',
    sessionId: 'session-456',
    message: '帮我设计一个现代风格的 Logo',
    history: [],
    currentAgent: 'designer'  // 会根据这个过滤 Skill
  }
);

// matches 会按匹配度排序，且只包含 designer 支持的 Skill
console.log('最佳匹配:', matches[0]?.skill.name);
```

### 注册自定义 Skill

```tsx
import { useSkill, BaseSkill } from '../hooks/useSkill';
import { SkillCategory } from '../types/skill';

// 创建自定义 Skill
class MyCustomSkill extends BaseSkill {
  readonly id = 'my-custom-skill';
  readonly name = '我的自定义 Skill';
  readonly description = '这是一个示例 Skill';
  readonly category = SkillCategory.CREATION;
  readonly capabilities = [];
  protected supportedAgents = ['designer', 'director'];

  canHandle(intent) {
    return intent.type === 'custom-intent';
  }

  async doExecute(context) {
    return this.createSuccessResult(
      '执行成功',
      'text',
      { customData: true }
    );
  }
}

// 在组件中注册
function MyComponent() {
  const { registerSkill } = useSkill();

  useEffect(() => {
    registerSkill(new MyCustomSkill(), 80);
  }, [registerSkill]);
}
```

## 迁移指南

### 从旧架构迁移

**旧代码**:
```tsx
import { processWithOrchestrator } from '../services/agentOrchestrator';

const handleSend = async () => {
  const response = await processWithOrchestrator(userMessage, context);
  // 处理响应
};
```

**新代码**:
```tsx
import { useSkill } from '../hooks/useSkill';

const { processMessage } = useSkill({
  userId,
  sessionId,
  currentAgent
});

const handleSend = async () => {
  const result = await processMessage(userMessage, {
    history: messages,
    currentAgent
  });
  // 处理结果
};
```

## 调试技巧

### 查看 Skill 注册情况

```tsx
const { registry, matcher } = useSkill();

// 查看所有注册的 Skill
console.log('所有 Skill:', registry.getAllSkills().map(s => ({
  id: s.id,
  name: s.name,
  category: s.category,
  supportedAgents: s.getMetadata().supportedAgents
})));

// 查看 Skill 统计
console.log('Skill 统计:', registry.getRegistryStats());
```

### 追踪 Skill 执行

```tsx
const { processMessage, lastResult, error, isProcessing } = useSkill();

// 在 UI 中显示执行状态
{isProcessing && <div>正在处理...</div>}

// 显示执行结果
{lastResult && (
  <div>
    <p>类型: {lastResult.type}</p>
    <p>成功: {lastResult.success ? '是' : '否'}</p>
    <p>内容: {lastResult.content}</p>
  </div>
)}

// 显示错误
{error && <div className="error">{error}</div>}
```

## 最佳实践

1. **始终传入 currentAgent**: 这样 SkillMatcher 才能正确过滤 Skill
2. **处理错误**: Skill 执行可能失败，始终使用 try-catch
3. **利用 Skill 面板**: 让用户知道当前 Agent 有什么能力
4. **渐进式迁移**: 可以逐步将旧代码迁移到新架构，两者可以共存

## 常见问题

### Q: 为什么我的 Skill 没有被匹配到？
A: 检查以下几点：
- Skill 的 `supportedAgents` 是否包含当前 Agent
- Skill 的 `canHandle` 方法是否正确实现
- 意图识别的结果是否符合预期

### Q: 如何让多个 Agent 共享同一个 Skill？
A: 在 Skill 的 `supportedAgents` 中添加多个 Agent：
```tsx
protected supportedAgents = ['designer', 'illustrator', 'director'];
```

### Q: 可以动态修改 Agent 的 Skill 吗？
A: 可以通过配置修改，但不建议运行时动态修改。更好的方式是创建新的 Skill 版本。
