# 津小脉Agent智能化优化 - 使用指南

## 优化概述

本次优化针对津小脉Agent的智能化问题，实现了以下核心改进：

### 阶段一：意图识别增强 ✅
1. **语义意图分析器** (`semanticIntentAnalyzer.ts`)
   - 使用Embedding和向量相似度实现语义匹配
   - 支持多意图识别和置信度评估
   - 提供深度语义分析（LLM辅助）

2. **实体提取器** (`entityExtractor.ts`)
   - 15种设计领域实体类型
   - 规则+LLM双模式提取
   - 实体关系识别

3. **Embedding服务** (`embeddingService.ts`)
   - 文本向量化
   - 语义相似度计算
   - 语义搜索和聚类

### 阶段二：上下文理解增强 ✅
4. **对话状态追踪器** (`dialogStateTracker.ts`)
   - 9种对话状态管理
   - 需求信息槽位追踪
   - 状态转换和回退

5. **智能上下文压缩器** (`smartContextCompressor.ts`)
   - 基于重要性的消息筛选
   - 智能摘要生成
   - 保留关键决策信息

6. **指代消解器** (`coreferenceResolver.ts`)
   - 代词指代解析
   - 跨句子实体关联
   - 用户确认机制

### 阶段三：记忆和学习 ✅
7. **用户画像服务** (`userProfileService.ts`)
   - 偏好学习（风格、颜色等）
   - 行为模式分析
   - 个性化推荐

---

## 快速开始

### 1. 导入优化服务

```typescript
import {
  // 意图识别
  getSemanticIntentAnalyzer,
  getEntityExtractor,
  getEmbeddingService,
  
  // 上下文理解
  getDialogStateTracker,
  getSmartContextCompressor,
  getCoreferenceResolver,
  
  // 用户画像
  getUserProfileService
} from './services';
```

### 2. 基础使用示例

```typescript
// ========== 意图识别 ==========
const intentAnalyzer = getSemanticIntentAnalyzer();

// 分析用户输入
const result = await intentAnalyzer.analyze('我想设计一个可爱的Logo');
console.log(result);
// {
//   primaryIntent: 'CREATE_DESIGN',
//   confidence: 0.92,
//   secondaryIntents: [...],
//   semanticScore: 0.85
// }

// ========== 实体提取 ==========
const entityExtractor = getEntityExtractor();

const extraction = await entityExtractor.extract('我想要一个简约风格的蓝色Logo');
console.log(extraction.entities);
// [
//   { type: 'STYLE', value: '简约', confidence: 0.9 },
//   { type: 'COLOR', value: '蓝色', confidence: 0.85 },
//   { type: 'DESIGN_TYPE', value: 'Logo', confidence: 0.95 }
// ]

// ========== 对话状态追踪 ==========
const stateTracker = getDialogStateTracker('session_123');

// 处理用户消息
const message = { id: '1', role: 'user', content: '我想设计Logo' };
const { context, nextAction } = await stateTracker.processUserMessage(message);

console.log(context.state); // 'COLLECTING'
console.log(nextAction);    // 'ASK_STYLE'

// ========== 指代消解 ==========
const corefResolver = getCoreferenceResolver();

const resolution = await corefResolver.resolve(
  '那个风格能改一下吗？',
  previousMessages
);
console.log(resolution.resolvedText); 
// '那个风格(简约)能改一下吗？'

// ========== 用户画像 ==========
const profileService = getUserProfileService();

// 开始会话
profileService.startSession('user_123');

// 更新偏好
profileService.updatePreference('user_123', 'styles', '可爱', 0.9);

// 获取个性化问候
const greeting = profileService.getPersonalizedGreeting('user_123');
console.log(greeting); // '下午好！很高兴再次见到你...'
```

---

## 高级用法

### 组合使用所有服务

```typescript
class EnhancedAgent {
  private intentAnalyzer = getSemanticIntentAnalyzer();
  private entityExtractor = getEntityExtractor();
  private stateTracker = getDialogStateTracker(this.sessionId);
  private contextCompressor = getSmartContextCompressor();
  private corefResolver = getCoreferenceResolver();
  private profileService = getUserProfileService();

  async processMessage(userMessage: AgentMessage): Promise<string> {
    const userId = 'user_123';
    
    // 1. 指代消解
    const corefResult = await this.corefResolver.resolve(
      userMessage.content,
      this.messageHistory
    );
    
    // 2. 意图识别
    const intentResult = await this.intentAnalyzer.analyze(corefResult.resolvedText);
    
    // 3. 实体提取
    const entityResult = await this.entityExtractor.extract(corefResult.resolvedText);
    
    // 4. 更新对话状态
    const { context, nextAction } = await this.stateTracker.processUserMessage({
      ...userMessage,
      content: corefResult.resolvedText
    });
    
    // 5. 更新用户画像
    for (const entity of entityResult.entities) {
      this.profileService.updatePreference(userId, entity.type, entity.value);
    }
    
    // 6. 压缩上下文
    const { compressed, summary } = await this.contextCompressor.compress(
      this.messageHistory
    );
    
    // 7. 生成回复
    const response = await this.generateResponse({
      intent: intentResult,
      entities: entityResult,
      state: context,
      nextAction,
      compressedContext: compressed,
      summary
    });
    
    return response;
  }
}
```

---

## 集成到现有Agent

### 修改 agentService.ts

```typescript
import {
  getSemanticIntentAnalyzer,
  getEntityExtractor,
  getDialogStateTracker,
  getUserProfileService
} from './services';

export class AgentService {
  private intentAnalyzer = getSemanticIntentAnalyzer();
  private entityExtractor = getEntityExtractor();
  private profileService = getUserProfileService();

  async handleUserInput(input: string, sessionId: string): Promise<AgentResponse> {
    // 1. 语义意图识别（替代原有的简单规则）
    const intentResult = await this.intentAnalyzer.analyze(input);
    
    // 2. 实体提取
    const entityResult = await this.entityExtractor.extract(input);
    
    // 3. 获取对话状态
    const stateTracker = getDialogStateTracker(sessionId);
    const { context, nextAction } = await stateTracker.processUserMessage({
      id: Date.now().toString(),
      role: 'user',
      content: input
    });
    
    // 4. 根据状态生成回复
    switch (nextAction) {
      case 'ASK_STYLE':
        // 获取用户历史偏好推荐
        const userId = 'user_123';
        const recommendedStyles = this.profileService.getRecommendedStyles(userId);
        return {
          content: `好的！请选择一个风格：${recommendedStyles.join('、')}，或者其他你喜欢的风格？`,
          suggestedActions: recommendedStyles.map(s => ({ label: s, value: s }))
        };
        
      case 'SUMMARIZE_AND_CONFIRM':
        const summary = stateTracker.getCollectedInfoSummary();
        return {
          content: `让我确认一下你的需求：${summary}。对吗？`,
          suggestedActions: [
            { label: '对的，开始设计', value: 'confirm' },
            { label: '需要修改', value: 'modify' }
          ]
        };
        
      default:
        // 原有逻辑...
        return this.handleByIntent(intentResult.primaryIntent, entityResult);
    }
  }
}
```

---

## 性能优化建议

### 1. 缓存策略

```typescript
// Embedding缓存（已内置）
const embeddingService = getEmbeddingService();
// 自动使用localStorage缓存，LRU淘汰策略

// 手动清除缓存
embeddingService.clearCache();

// 查看缓存统计
const stats = embeddingService.getCacheStats();
console.log(`缓存命中率: ${stats.hitRate}`);
```

### 2. 批量处理

```typescript
// 批量获取Embedding
const embeddings = await embeddingService.getEmbeddings([
  '文本1',
  '文本2',
  '文本3'
]);

// 批量分析意图
const results = await intentAnalyzer.analyzeBatch([
  '我想设计Logo',
  '帮我做个海报',
  '需要IP形象'
]);
```

### 3. 降级策略

```typescript
// 所有服务都有降级机制
try {
  const embedding = await embeddingService.getEmbedding(text);
} catch (error) {
  // 自动降级到本地简单Embedding
  console.log('使用本地Embedding');
}
```

---

## 配置选项

### 自定义压缩器配置

```typescript
import { SmartContextCompressor } from './services';

const compressor = new SmartContextCompressor({
  maxTokens: 3000,        // 最大Token数
  maxMessages: 15,        // 最大消息数
  preserveRecent: 3,      // 保留最近N条
  useSummarization: true, // 启用摘要
  summaryLength: 150      // 摘要长度
});
```

### 自定义Embedding配置

```typescript
import { EmbeddingService } from './services';

const embeddingService = new EmbeddingService({
  dimension: 768,         // 向量维度
  cacheEnabled: true,     // 启用缓存
  cacheMaxSize: 500       // 最大缓存数
});
```

---

## 调试和监控

### 查看重要性评分

```typescript
const compressor = getSmartContextCompressor();
const { compressed, stats } = await compressor.compress(messages);

// 查看每条消息的重要性
for (const msg of messages) {
  const importance = compressor.getMessageImportance(msg.id);
  console.log(`${msg.content}: ${importance?.importance} - ${importance?.reasons.join(', ')}`);
}
```

### 查看对话状态

```typescript
const stateTracker = getDialogStateTracker(sessionId);
const stats = stateTracker.getStats();

console.log(`
  对话轮数: ${stats.turnCount}
  已收集信息: ${stats.collectedSlotCount}/${stats.collectedSlotCount + stats.pendingSlotCount}
  完成度: ${stats.completionPercentage}%
`);
```

### 查看用户画像

```typescript
const profileService = getUserProfileService();
const profile = profileService.getProfile(userId);

console.log(`
  用户标签: ${profile.tags.join(', ')}
  满意度: ${profile.statistics.satisfactionScore}
  偏好风格: ${profile.preferences.styles.map(s => s.value).join(', ')}
`);
```

---

## 预期效果

### 量化指标提升

| 指标 | 优化前 | 优化后（预期） | 提升 |
|------|--------|----------------|------|
| 意图识别准确率 | ~60% | 85%+ | +25% |
| 上下文连贯性 | ~40% | 80%+ | +40% |
| 对话完成率 | ~50% | 75%+ | +25% |
| 用户满意度 | - | 4.5/5 | - |

### 质性改进

1. **理解能力**: 能理解更复杂、更模糊的表达
2. **个性化**: 回复更贴合用户偏好和风格
3. **连贯性**: 长对话中保持上下文一致
4. **主动性**: 能主动提供帮助和建议

---

## 后续优化方向

1. **长期记忆存储**: 使用向量数据库持久化对话记忆
2. **反馈学习**: 基于用户反馈优化回复策略
3. **Prompt优化**: 动态生成个性化Prompt
4. **回复多样性**: 避免重复回复，增加表达多样性

---

## 注意事项

1. **兼容性**: 新服务与原有服务完全兼容，可逐步替换
2. **性能**: Embedding计算有一定开销，建议使用缓存
3. **隐私**: 用户画像数据建议加密存储
4. **测试**: 建议在生产环境使用前充分测试
