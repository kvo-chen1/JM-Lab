# 本地API服务器重构计划

## 当前问题

`local-api.mjs` 文件当前大小约 182KB，存在以下问题：

1. **单文件过大** - 所有API路由、中间件、工具函数都在一个文件中
2. **职责混杂** - 包含认证、AI服务代理、文件上传、数据分析等多个不相关功能
3. **难以维护** - 代码行数过多，查找和修改困难
4. **测试困难** - 无法单独测试某个模块
5. **代码重复** - 错误处理、日志记录等逻辑重复出现

## 重构目标

1. 将单体文件拆分为多个职责单一的模块
2. 建立清晰的目录结构
3. 统一错误处理和日志记录
4. 提高代码可测试性
5. 保持现有API接口不变（向后兼容）

## 建议目录结构

```
server/
├── index.mjs                    # 入口文件，仅负责启动服务器
├── config/
│   ├── index.mjs               # 配置汇总
│   ├── database.mjs            # 数据库配置
│   ├── ai-services.mjs         # AI服务配置（豆包、Kimi等）
│   └── security.mjs            # 安全相关配置
├── middleware/
│   ├── auth.mjs                # 认证中间件
│   ├── cors.mjs                # CORS中间件
│   ├── rate-limit.mjs          # 限流中间件
│   ├── error-handler.mjs       # 全局错误处理
│   ├── request-logger.mjs      # 请求日志
│   └── security.mjs            # 安全头部、CSRF防护等
├── routes/
│   ├── index.mjs               # 路由汇总
│   ├── auth.mjs                # 认证相关路由
│   ├── ai/
│   │   ├── index.mjs           # AI服务路由汇总
│   │   ├── doubao.mjs          # 豆包AI路由
│   │   ├── kimi.mjs            # Kimi AI路由
│   │   └── openai.mjs          # OpenAI路由
│   ├── upload.mjs              # 文件上传路由
│   ├── analytics.mjs           # 数据分析路由
│   ├── notifications.mjs       # 通知路由
│   └── health.mjs              # 健康检查路由
├── services/
│   ├── ai/
│   │   ├── doubao.mjs          # 豆包AI服务
│   │   ├── kimi.mjs            # Kimi AI服务
│   │   └── openai.mjs          # OpenAI服务
│   ├── email.mjs               # 邮件服务（已存在）
│   ├── storage.mjs             # 文件存储服务
│   └── analytics.mjs           # 数据分析服务
├── utils/
│   ├── logger.mjs              # 日志工具（已创建）
│   ├── response.mjs            # 统一响应格式
│   ├── validator.mjs           # 参数验证
│   └── crypto.mjs              # 加密工具
└── REFACTORING_PLAN.md         # 本文件
```

## 重构步骤

### 第一阶段：基础设施（1-2天）

1. **创建目录结构**
   - 创建所有必要的目录
   - 添加 `.gitkeep` 文件

2. **提取配置**
   - 将环境变量读取集中到 `config/index.mjs`
   - 创建 `config/ai-services.mjs` 管理AI服务配置

3. **完善工具函数**
   - 完成 `utils/response.mjs` 统一API响应格式
   - 完成 `utils/validator.mjs` 参数验证工具

### 第二阶段：中间件（2-3天）

1. **认证中间件**
   - 从原文件提取JWT验证逻辑
   - 创建 `middleware/auth.mjs`

2. **错误处理中间件**
   - 创建统一的错误处理中间件
   - 统一错误响应格式

3. **其他中间件**
   - CORS、限流、请求日志等

### 第三阶段：服务层（3-4天）

1. **AI服务**
   - 创建 `services/ai/doubao.mjs`
   - 创建 `services/ai/kimi.mjs`
   - 提取流式响应处理逻辑

2. **其他服务**
   - 文件存储服务
   - 数据分析服务

### 第四阶段：路由层（2-3天）

1. **按功能拆分路由**
   - 认证路由
   - AI服务路由
   - 文件上传路由
   - 其他路由

2. **创建路由汇总**
   - `routes/index.mjs` 统一注册所有路由

### 第五阶段：入口文件（1天）

1. **重构 `index.mjs`**
   - 仅保留服务器启动逻辑
   - 引入所有中间件和路由

2. **测试验证**
   - 确保所有API正常工作
   - 性能测试

## 代码示例

### 1. 统一响应格式 (utils/response.mjs)

```javascript
export const success = (res, data, message = 'Success') => {
  res.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const error = (res, message, code = 500, details = null) => {
  res.status(code).json({
    success: false,
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  });
};
```

### 2. 认证中间件 (middleware/auth.mjs)

```javascript
import jwt from 'jsonwebtoken';
import { error } from '../utils/response.mjs';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return error(res, '未提供认证令牌', 401);
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, '认证令牌无效', 401);
  }
};
```

### 3. AI服务 (services/ai/doubao.mjs)

```javascript
import fetch from 'node-fetch';
import { createLogger } from '../../utils/logger.mjs';

const logger = createLogger('ai-doubao');

export class DoubaoService {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }
  
  async chat(messages, options = {}) {
    logger.info({ action: 'chat', messageCount: messages.length });
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'doubao-lite-4k',
          messages,
          stream: options.stream || false
        })
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      return response;
    } catch (err) {
      logger.error({ action: 'chat', error: err.message });
      throw err;
    }
  }
}
```

### 4. 路由 (routes/ai/doubao.mjs)

```javascript
import { Router } from 'express';
import { DoubaoService } from '../../services/ai/doubao.mjs';
import { success, error } from '../../utils/response.mjs';
import { authenticate } from '../../middleware/auth.mjs';

const router = Router();
const doubaoService = new DoubaoService({
  baseUrl: process.env.DOUBAO_BASE_URL,
  apiKey: process.env.DOUBAO_API_KEY
});

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages, stream } = req.body;
    
    if (stream) {
      const response = await doubaoService.chat(messages, { stream: true });
      // 处理流式响应...
    } else {
      const response = await doubaoService.chat(messages);
      const data = await response.json();
      success(res, data);
    }
  } catch (err) {
    error(res, err.message, 500);
  }
});

export default router;
```

### 5. 入口文件 (index.mjs)

```javascript
import express from 'express';
import cors from 'cors';
import { config } from './config/index.mjs';
import { errorHandler } from './middleware/error-handler.mjs';
import { requestLogger } from './middleware/request-logger.mjs';
import routes from './routes/index.mjs';

const app = express();

// 中间件
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 预期收益

1. **可维护性提升**
   - 每个文件职责单一，易于理解和修改
   - 新功能开发更容易找到对应位置

2. **可测试性提升**
   - 可以单独测试服务层
   - 可以Mock依赖进行单元测试

3. **代码复用**
   - 统一的错误处理、日志记录
   - 通用的工具函数

4. **团队协作**
   - 不同开发者可以并行工作在不同模块
   - 代码审查更容易

5. **性能优化**
   - 可以按需加载模块
   - 更容易识别性能瓶颈

## 风险评估

1. **API兼容性**
   - 风险：重构可能引入API变更
   - 缓解：保持所有API路径和响应格式不变

2. **引入新Bug**
   - 风险：代码移动可能引入错误
   - 缓解：充分的测试，逐步迁移

3. **时间成本**
   - 风险：重构耗时超出预期
   - 缓解：分阶段进行，每阶段可独立部署

## 建议

1. **逐步重构** - 不要一次性重写所有代码
2. **保持测试** - 每完成一个模块就进行测试
3. **代码审查** - 重构代码需要团队审查
4. **文档更新** - 同步更新API文档
5. **监控部署** - 部署后密切监控错误日志
