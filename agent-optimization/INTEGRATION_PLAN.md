# 津小脉Agent功能整合方案

## 一、架构现状分析

### 1.1 当前架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面层 (UI)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ ChatPanel   │  │ CanvasPanel │  │ ConversationSidebar │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      状态管理层 (State)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ useAgentStore (Zustand)                               │  │
│  │ - 消息管理  - Agent切换  - 任务管理  - 生成内容管理      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      服务编排层 (Orchestration)               │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ AgentOrchestrator│  │ TaskQueueManager                  │  │
│  │ - 决策引擎       │  │ - 任务队列管理                    │  │
│  │ - 需求收集流程   │  │ - 并发控制                        │  │
│  │ - 任务委派/协作  │  │ - 重试机制                        │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      核心服务层 (Core Services)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ agentService │ │ llmService   │ │ aiTaskQueueService   │ │
│  │ - Agent调用  │ │ - 模型管理   │ │ - 任务队列           │ │
│  │ - 图像/视频  │ │ - 缓存机制   │ │ - 优先级处理         │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      智能服务层 (Intelligence)                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ prediction   │ │ suggestion   │ │ workflow             │ │
│  │ - 行为预测   │ │ - 主动建议   │ │ - 工作流引擎         │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ ragService   │ │ memoryService│ │ voiceService         │ │
│  │ - RAG检索    │ │ - 用户记忆   │ │ - 语音交互           │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      基础设施层 (Infrastructure)              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ errorHandler │ │ vectorStore  │ │ indexedDBStorage     │ │
│  │ - 错误处理   │ │ - 向量存储   │ │ - 本地存储           │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 模块依赖关系

```
useAgentStore
    ├── agentService
    │   ├── llmService
    │   │   └── aiTaskQueueService
    │   ├── errorHandler
    │   ├── ragService
    │   │   └── vectorStore
    │   └── memoryService
    ├── agentOrchestrator
    │   └── agentService
    └── taskQueueManager

llmService
    ├── aiTaskQueueService
    └── errorHandler

predictionService
    ├── memoryService
    └── vectorStore
```

---

## 二、存在的问题

### 2.1 交互连贯性问题

| 问题 | 原因 | 影响 |
|------|------|------|
| 响应延迟高 | 任务队列无超时机制，API调用可能阻塞 | 用户体验差 |
| 状态不同步 | 多个服务独立管理状态，缺乏统一协调 | 数据不一致 |
| 上下文丢失 | Agent切换时上下文传递不完整 | 对话不连贯 |
| 无网络感知 | 缺乏网络状态监听 | 离线时无提示 |

### 2.2 卡壳/无响应问题

| 问题 | 原因 | 影响 |
|------|------|------|
| 任务队列阻塞 | 无超时机制，失败任务占用资源 | 后续任务无法执行 |
| 内存泄漏 | 行为记录无限增长 | 浏览器卡顿 |
| 轮询无限等待 | 视频生成轮询无最大次数限制 | 长时间无响应 |
| Token超限 | 上下文过长未截断 | API调用失败 |

### 2.3 接口不清晰问题

| 问题 | 原因 | 影响 |
|------|------|------|
| 服务间耦合高 | 直接依赖具体实现 | 难以测试和维护 |
| 数据流混乱 | 多个服务修改同一状态 | 竞态条件 |
| 缺乏统一错误处理 | 各服务独立处理错误 | 错误处理不一致 |

---

## 三、功能整合方案

### 3.1 核心改进目标

1. **提升交互连贯性**
   - 实现统一的状态管理
   - 添加网络状态监听
   - 优化上下文传递

2. **消除卡壳/无响应**
   - 添加任务超时机制
   - 实现资源限制和清理
   - 优化错误恢复

3. **清晰化模块接口**
   - 定义统一的服务接口
   - 实现依赖注入
   - 添加事件总线

### 3.2 架构优化方案

#### 3.2.1 新增统一调度层

```typescript
// AgentScheduler - 统一调度所有Agent相关操作
class AgentScheduler {
  private taskQueue: TaskQueueManager;
  private stateManager: StateManager;
  private networkMonitor: NetworkMonitor;
  
  // 统一入口：处理用户输入
  async processUserInput(input: UserInput): Promise<AgentResponse> {
    // 1. 检查网络状态
    if (!this.networkMonitor.isOnline) {
      return this.createOfflineResponse();
    }
    
    // 2. 创建任务并添加到队列
    const task = await this.createTask(input);
    
    // 3. 设置超时
    const timeoutId = setTimeout(() => {
      this.handleTaskTimeout(task.id);
    }, TASK_TIMEOUT);
    
    // 4. 执行任务
    try {
      const result = await this.executeTask(task);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      return this.handleExecutionError(error, task);
    }
  }
}
```

#### 3.2.2 状态管理重构

```typescript
// 统一状态接口
interface AgentState {
  // 对话状态
  conversation: {
    messages: Message[];
    currentAgent: AgentType;
    context: ConversationContext;
  };
  
  // 任务状态
  tasks: {
    active: Task[];
    queue: Task[];
    completed: Task[];
  };
  
  // 系统状态
  system: {
    isOnline: boolean;
    isProcessing: boolean;
    lastError: Error | null;
  };
}

// 使用单一状态源
class StateManager {
  private state: AgentState;
  private listeners: Set<StateListener>;
  
  // 只允许通过此方法修改状态
  dispatch(action: Action): void {
    const newState = this.reducer(this.state, action);
    this.state = newState;
    this.notifyListeners();
  }
}
```

#### 3.2.3 服务接口标准化

```typescript
// 统一服务接口
interface IAgentService {
  generateResponse(input: string, context: Context): Promise<Response>;
  generateImage(params: ImageParams): Promise<ImageResult>;
  generateVideo(params: VideoParams): Promise<VideoResult>;
}

interface ITaskQueue {
  enqueue(task: Task, options?: QueueOptions): Promise<TaskId>;
  dequeue(taskId: TaskId): void;
  getStatus(taskId: TaskId): TaskStatus;
  cancel(taskId: TaskId): boolean;
}

interface IErrorHandler {
  handle(error: Error, context: ErrorContext): ErrorResult;
  registerRecoveryStrategy(strategy: RecoveryStrategy): void;
}
```

### 3.3 数据流优化

#### 优化前（混乱）
```
用户输入 -> useAgentStore -> agentService -> llmService -> aiTaskQueueService
                ↓                ↓              ↓
            直接修改状态    直接修改状态    直接修改状态
```

#### 优化后（清晰）
```
用户输入 -> AgentScheduler -> 创建Task -> TaskQueue
                              ↓
                         StateManager (统一状态更新)
                              ↓
                    通知所有订阅者更新UI
```

---

## 四、关键优化实现

### 4.1 任务超时机制

```typescript
// 在 aiTaskQueueService.ts 中添加
interface TaskTimeoutConfig {
  defaultTimeout: number;      // 默认30秒
  imageGenerationTimeout: number; // 5分钟
  videoGenerationTimeout: number; // 10分钟
}

class AITaskQueueService {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  
  private async executeTask(task: AITask): Promise<void> {
    const timeoutMs = this.getTimeoutForTaskType(task.type);
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TaskTimeoutError(`Task ${task.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.timeouts.set(task.id, timeoutId);
    });
    
    // 竞争执行
    try {
      await Promise.race([
        this.runTaskExecutor(task),
        timeoutPromise
      ]);
    } finally {
      // 清理超时
      const timeoutId = this.timeouts.get(task.id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.timeouts.delete(task.id);
      }
    }
  }
}
```

### 4.2 网络状态监听

```typescript
// networkMonitor.ts
class NetworkMonitor {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(status: boolean) => void> = new Set();
  
  constructor() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
    
    // 定期检查网络质量
    setInterval(() => this.checkNetworkQuality(), 30000);
  }
  
  private updateStatus(online: boolean): void {
    this.isOnline = online;
    this.listeners.forEach(listener => listener(online));
  }
  
  private async checkNetworkQuality(): Promise<void> {
    try {
      const start = Date.now();
      await fetch('/api/health', { method: 'HEAD' });
      const latency = Date.now() - start;
      
      // 延迟过高时触发降级
      if (latency > 5000) {
        this.triggerDegradedMode();
      }
    } catch {
      this.updateStatus(false);
    }
  }
}
```

### 4.3 上下文长度限制

```typescript
// contextManager.ts
class ContextManager {
  private readonly MAX_CONTEXT_LENGTH = 4000; // Token限制
  
  optimizeContext(messages: Message[]): Message[] {
    let totalLength = 0;
    const optimized: Message[] = [];
    
    // 从后向前遍历，保留最近的消息
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgLength = this.estimateTokenLength(msg.content);
      
      if (totalLength + msgLength > this.MAX_CONTEXT_LENGTH) {
        // 添加摘要消息
        optimized.unshift(this.createSummaryMessage(messages.slice(0, i + 1)));
        break;
      }
      
      totalLength += msgLength;
      optimized.unshift(msg);
    }
    
    return optimized;
  }
  
  private estimateTokenLength(text: string): number {
    // 粗略估计：中文字符约1.5个token，英文单词约1个token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }
}
```

### 4.4 资源限制与清理

```typescript
// resourceManager.ts
class ResourceManager {
  private readonly MAX_BEHAVIOR_RECORDS = 500;
  private readonly MAX_MESSAGES = 100;
  private readonly MAX_CACHED_RESPONSES = 50;
  
  // 定期清理
  startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupBehaviorRecords();
      this.cleanupMessages();
      this.cleanupCache();
    }, 60000); // 每分钟检查一次
  }
  
  private cleanupBehaviorRecords(): void {
    const records = this.getBehaviorRecords();
    if (records.length > this.MAX_BEHAVIOR_RECORDS) {
      // 保留最近的数据
      const toKeep = records.slice(-this.MAX_BEHAVIOR_RECORDS);
      this.saveBehaviorRecords(toKeep);
    }
  }
  
  private cleanupMessages(): void {
    const store = useAgentStore.getState();
    if (store.messages.length > this.MAX_MESSAGES) {
      // 归档旧消息
      const toArchive = store.messages.slice(0, -this.MAX_MESSAGES);
      this.archiveMessages(toArchive);
      
      // 只保留最近的消息
      store.updateState({
        messages: store.messages.slice(-this.MAX_MESSAGES)
      });
    }
  }
}
```

---

## 五、实施计划

### 5.1 阶段划分

#### 第一阶段：紧急修复（1-2周）
- [ ] 添加任务超时机制
- [ ] 实现网络状态监听
- [ ] 添加上下文长度限制
- [ ] 修复轮询无限等待问题

#### 第二阶段：架构优化（2-3周）
- [ ] 实现AgentScheduler统一调度层
- [ ] 重构状态管理
- [ ] 标准化服务接口
- [ ] 添加事件总线

#### 第三阶段：性能优化（1-2周）
- [ ] 实现资源限制和清理
- [ ] 优化缓存策略
- [ ] 添加性能监控
- [ ] 实现降级策略

#### 第四阶段：测试验证（1周）
- [ ] 执行完整测试用例
- [ ] 性能压力测试
- [ ] 用户验收测试

### 5.2 风险评估

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 重构引入新bug | 中 | 高 | 保持向后兼容，逐步替换 |
| 性能优化效果不达预期 | 低 | 中 | 先进行小规模测试 |
| 第三方API变更 | 低 | 高 | 封装API调用，便于切换 |

---

## 六、预期效果

### 6.1 性能指标

| 指标 | 当前 | 目标 | 优化方式 |
|------|------|------|----------|
| 平均响应时间 | >5s | <3s | 任务超时+缓存优化 |
| 任务成功率 | ~85% | >95% | 错误恢复+重试优化 |
| 内存占用 | 持续增长 | 稳定<100MB | 资源清理+限制 |
| 离线感知 | 无 | <1s | 网络状态监听 |

### 6.2 用户体验改善

1. **响应更快**：任务超时机制确保不会无限等待
2. **状态可见**：网络状态实时显示，离线有提示
3. **对话连贯**：上下文优化确保Token不超限
4. **稳定可靠**：资源限制防止内存泄漏

---

*文档版本: 1.0*  
*创建日期: 2026-03-10*
