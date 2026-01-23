# 项目目录结构规范

## 1. 目录结构概述

本项目采用清晰的分层目录结构，将不同类型的文件进行分类管理，确保项目的可维护性和扩展性。

```
project/
├── src/                # 源代码目录
├── public/             # 静态资源目录
├── docs/               # 项目文档
├── scripts/            # 脚本文件
├── config/             # 配置文件
├── e2e/                # 端到端测试
├── tests/              # 单元测试和集成测试
├── server/             # 后端服务器代码
├── api/                # API 路由和代理
├── .github/            # GitHub 配置
└── root files          # 根目录配置文件
```

## 2. 目录详细说明

### 2.1 src/ - 源代码目录

所有应用程序的源代码都存放在此目录下。

```
src/
├── components/         # React 组件
│   ├── common/         # 通用组件
│   ├── layouts/        # 布局组件
│   └── specific/       # 特定功能组件
├── hooks/              # 自定义 React 钩子
├── pages/              # 页面组件
├── services/           # API 服务和业务逻辑
├── utils/              # 工具函数
├── types/              # TypeScript 类型定义
├── assets/             # 源代码内部使用的资源
├── App.tsx             # 应用入口组件
└── main.tsx            # 应用入口文件
```

### 2.2 public/ - 静态资源目录

直接暴露给浏览器的静态资源，不经过构建工具处理。

```
public/
├── images/             # 图片资源
├── fonts/              # 字体资源
├── icons/              # 图标资源
└── manifest.json       # PWA 配置
```

### 2.3 docs/ - 项目文档

项目相关的所有文档。

```
docs/
├── architecture/       # 架构文档
├── api/               # API 文档
├── guides/            # 使用指南
└── reports/           # 测试报告和分析报告
```

### 2.4 scripts/ - 脚本文件

用于项目构建、部署、数据处理等的脚本。

```
scripts/
├── build/             # 构建相关脚本
├── deploy/            # 部署相关脚本
├── data/              # 数据处理脚本
└── utils/             # 脚本工具函数
```

### 2.5 config/ - 配置文件

项目的各种配置文件。

```
config/
├── eslint/            # ESLint 配置
├── jest/              # Jest 配置
└── tailwind/          # Tailwind CSS 配置
```

### 2.6 e2e/ - 端到端测试

使用 Playwright 或 Cypress 等工具编写的端到端测试。

### 2.7 tests/ - 单元测试和集成测试

使用 Jest 等工具编写的单元测试和集成测试。

### 2.8 server/ - 后端服务器代码

后端服务器相关的代码。

### 2.9 api/ - API 路由和代理

API 路由配置和代理设置。

## 3. 文件命名规范

### 3.1 通用命名规则

- 使用 PascalCase 命名组件文件（如：`Button.tsx`）
- 使用 camelCase 命名工具函数和普通文件（如：`utils.ts`）
- 使用 kebab-case 命名 CSS 文件和静态资源文件（如：`main-styles.css`）
- 使用全大写命名环境变量文件（如：`.env.production`）

### 3.2 组件命名

- 组件文件使用 PascalCase（如：`UserProfile.tsx`）
- 组件目录使用 PascalCase（如：`UserProfile/`）
- 组件测试文件使用 `.test.tsx` 或 `.spec.tsx` 后缀（如：`UserProfile.test.tsx`）

### 3.3 资源文件命名

- 图片文件使用 kebab-case（如：`profile-picture.jpg`）
- 图标文件使用 kebab-case（如：`user-icon.svg`）
- 字体文件使用 kebab-case（如：`primary-font.woff2`）

## 4. 文件管理规范

### 4.1 文件存放原则

- 每个文件都应有明确的存放位置
- 避免文件在多个目录中重复存放
- 避免目录层级过深（建议不超过 4 层）
- 同一功能相关的文件应存放在同一目录下

### 4.2 冗余文件管理

- 定期清理临时文件和备份文件
- 不再使用的资源文件应及时删除
- 定期审查项目文件，移除不再使用的代码和资源

## 5. 目录结构维护

### 5.1 定期审查

- 每季度进行一次目录结构审计
- 检查是否存在文件乱放、命名不规范或目录层级过深等问题
- 及时调整和优化目录结构

### 5.2 团队协作

- 所有团队成员必须遵循统一的文件管理规范
- 新增文件时必须按照规范存放
- 对目录结构的修改必须经过团队讨论和批准

## 6. 实施计划

### 6.1 第一阶段：清理和整理

1. 清理根目录下的临时文件和冗余文件
2. 将配置文件统一移至 config/ 目录
3. 将文档文件统一移至 docs/ 目录
4. 将脚本文件统一移至 scripts/ 目录

### 6.2 第二阶段：优化目录结构

1. 优化 src/ 目录结构
2. 统一资源文件管理
3. 建立明确的文件分类标准

### 6.3 第三阶段：建立维护机制

1. 创建目录结构文档
2. 建立命名规范
3. 建立定期审查机制

## 7. 附录

### 7.1 常用文件类型存放位置

| 文件类型 | 存放目录 |
|---------|---------|
| React 组件 | src/components/ |
| 自定义钩子 | src/hooks/ |
| 页面组件 | src/pages/ |
| API 服务 | src/services/ |
| 工具函数 | src/utils/ |
| TypeScript 类型 | src/types/ |
| 配置文件 | config/ |
| 脚本文件 | scripts/ |
| 文档文件 | docs/ |
| 静态资源 | public/ |
| 测试文件 | tests/ 或 e2e/ |

### 7.2 禁止存放的位置

- 禁止在根目录存放源代码文件
- 禁止在 src/ 目录存放配置文件
- 禁止在 public/ 目录存放源代码文件
- 禁止在 docs/ 目录存放可执行脚本
