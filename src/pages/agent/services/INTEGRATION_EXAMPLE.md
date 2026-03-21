# 津小脉Agent智能化集成示例

## 快速开始

### 1. 基础使用（一行代码集成）

```typescript
import { callEnhancedAgent } from './services';

// 替换原有的 callAgent 调用
const response = await callEnhancedAgent(
  systemPrompt,
  history,
  userMessage,
  agent,
  {
    userId: 'user_123',
    sessionId: 'session_456'
  }
);

console.log(response.content);           // AI回复内容
console.log(response.detectedIntent);    // 检测到的意图
console.log(response.extractedEntities); // 提取的实体
console.log(response.suggestedActions);  // 建议操作按钮
```

### 2. 在React组件中使用

```typescript
import React, { useState } from 'react';
import { callEnhancedAgent, collectUserFeedback } from './services';

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const userId = 'user_123';      // 从用户登录信息获取
  const sessionId = 'session_456'; // 从当前会话获取
  
  const handleSend = async () => {
    // 添加用户消息
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // 调用增强版Agent
    const response = await callEnhancedAgent(
      '你是津小脉，一个专业的设计助手...',
      messages,
      input,
      'director',
      { userId, sessionId }
    );
    
    // 添加AI回复
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response.content,
      metadata: {
        detectedIntent: response.detectedIntent,
        extractedEntities: response.extractedEntities,
        suggestedActions: response.suggestedActions
      }
    }]);
  };
  
  // 收集反馈
  const handleFeedback = async (messageId: string, type: 'THUMB_UP' | 'THUMB_DOWN') => {
    await collectUserFeedback(
      userId,
      sessionId,
      messageId,
      type,
      {},
      {
        userInput: messages[messages.length - 2]?.content,
        agentResponse: messages[messages.length - 1]?.content
      }
    );
  };
  
  return (
    <div>
      {/* 渲染消息 */}
      {messages.map((msg, index) => (
        <div key={index}>
          <p>{msg.content}</p>
          
          {/* 显示建议操作按钮 */}
          {msg.metadata?.suggestedActions && (
            <div>
              {msg.metadata.suggestedActions.map(action => (
                <button key={action.value} onClick={() => setInput(action.value)}>
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          {/* 反馈按钮 */}
          {msg.role === 'assistant' && (
            <div>
              <button onClick={() => handleFeedback(index.toString(), 'THUMB_UP')}>
                👍
              </button>
              <button onClick={() => handleFeedback(index.toString(), 'THUMB_DOWN')}>
                👎
              </button>
            </div>
          )}
        </div>
      ))}
      
      {/* 输入框 */}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleSend}>发送</button>
    </div>
  );
}
```

### 3. 渐进式集成（部分功能）

```typescript
import { 
  getSemanticIntentAnalyzer,
  getEntityExtractor 
} from './services';

// 只使用意图识别和实体提取
async function partialIntegration(userMessage: string) {
  const intentAnalyzer = getSemanticIntentAnalyzer();
  const entityExtractor = getEntityExtractor();
  
  // 并行执行
  const [intentResult, entityResult] = await Promise.all([
    intentAnalyzer.analyze(userMessage),
    entityExtractor.extract(userMessage)
  ]);
  
  console.log('意图:', intentResult.primaryIntent);
  console.log('实体:', entityResult.entities);
  
  // 根据结果调整原有逻辑
  if (intentResult.primaryIntent === 'CREATE_DESIGN') {
    // 处理创建设计意图
  }
}
```

### 4. 完整功能开关控制

```typescript
const response = await callEnhancedAgent(
  systemPrompt,
  history,
  userMessage,
  agent,
  {
    userId: 'user_123',
    sessionId: 'session_456',
    enableIntentRecognition: true,   // 启用意图识别
    enableEntityExtraction: true,    // 启用实体提取
    enableContextTracking: true,     // 启用对话状态追踪
    enablePersonalization: true,     // 启用个性化
    enableMemory: true               // 启用长期记忆
  }
);
```

## 响应数据结构

```typescript
interface EnhancedAIResponse {
  // 原有字段
  content: string;                    // AI回复内容
  type: 'text' | 'style-options' | ...; // 响应类型
  thinking?: string;                  // 思考过程
  metadata?: any;                     // 元数据
  
  // 新增字段
  detectedIntent?: string;            // 检测到的意图
  extractedEntities?: Array<{         // 提取的实体
    type: string;
    value: string;
  }>;
  dialogState?: string;               // 对话状态
  usedMemory?: boolean;               // 是否使用了记忆
  personalized?: boolean;             // 是否个性化
  suggestedActions?: Array<{          // 建议操作
    label: string;
    value: string;
    type?: string;
  }>;
}
```

## 调试信息

在控制台可以看到详细的处理日志：

```
[EnhancedAgent] Processing message for user user_123
[EnhancedAgent] Coreference resolved: "那个风格" -> "那个风格(简约)"
[EnhancedAgent] Detected intent: CREATE_DESIGN (confidence: 0.92)
[EnhancedAgent] Extracted 3 entities: [{type: 'DESIGN_TYPE', value: 'Logo'}, ...]
[EnhancedAgent] Dialog state: COLLECTING, Next action: ASK_STYLE
[EnhancedAgent] Context compressed: 15 -> 8 messages
[EnhancedAgent] Retrieved 2 related memories
```

## 预期效果

使用增强版Agent后，你将看到：

1. **更精准的意图理解** - "我想做个东西" → CREATE_DESIGN
2. **自动信息提取** - 从消息中提取风格、颜色、受众等
3. **智能推荐** - 根据用户历史偏好推荐风格
4. **上下文连贯** - 理解"那个风格"指代什么
5. **个性化回复** - 根据用户偏好调整语气和内容
6. **建议操作** - 自动显示相关快捷按钮
