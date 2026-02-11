# 灵感脉络 - 创作思维导图系统设计文档

> 文档版本：v1.0  
> 更新日期：2026-02-11  
> 文档状态：技术实现方案

---

## 一、功能概述

### 1.1 核心价值

**灵感脉络**是一个将天津老字号文化、AI创作辅助和用户创意思维可视化的系统。它将每一次创作过程记录为思维导图节点，形成完整的创作脉络。

### 1.2 解决的问题

- **创作过程不可见**：传统创作工具只关注结果，忽略了创作思路的演变
- **文化元素难融合**：创作者难以将传统文化元素与现代设计结合
- **灵感难以复现**：优秀的创作思路无法被记录和分享
- **学习曲线陡峭**：新手难以学习资深设计师的创作方法

### 1.3 创新亮点

| 亮点 | 说明 |
|------|------|
| **文化数字化** | 将老字号文化元素拆解为可创作的数字化组件 |
| **过程可视化** | 创作过程本身成为可视化的艺术作品 |
| **AI协作创作** | AI不仅是工具，更是创作伙伴和记录者 |
| **故事化输出** | 自动生成创作故事，增强作品文化内涵 |
| **社交化分享** | 脉络可分享、可fork，形成创作社区 |

---

## 二、系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    灵感脉络系统架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│   │  老字号灵感库  │───▶│  AI辅助创作   │───▶│  脉络可视化   │ │
│   │  (文化元素)   │    │  (智能建议)   │    │  (思维导图)   │ │
│   └──────────────┘    └──────────────┘    └──────────────┘ │
│          │                   │                   │          │
│          ▼                   ▼                   ▼          │
│   ┌──────────────────────────────────────────────────────┐ │
│   │                    脉络节点类型                        │ │
│   ├──────────┬──────────┬──────────┬──────────┬──────────┤ │
│   │ 灵感触发  │ 文化融合  │ AI生成   │ 人工调整  │ 最终作品  │ │
│   │  (根节点) │  (分支)  │  (节点)  │  (节点)  │  (叶子)  │ │
│   └──────────┴──────────┴──────────┴──────────┴──────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据流向

```
用户选择老字号品牌
       │
       ▼
┌──────────────┐
│ 文化元素提取  │ ← 从品牌故事、历史、工艺中提取
└──────────────┘
       │
       ▼
┌──────────────┐
│ AI灵感建议   │ ← 基于元素生成创作建议
└──────────────┘
       │
       ▼
┌──────────────┐
│ 创建脉络节点  │ ← 记录创作决策
└──────────────┘
       │
       ▼
┌──────────────┐
│ 迭代创作     │ ← AI生成 → 人工调整 → AI优化
└──────────────┘
       │
       ▼
┌──────────────┐
│ 生成脉络图   │ ← 可视化展示完整创作过程
└──────────────┘
       │
       ▼
n┌──────────────┐
│ 输出作品+故事 │ ← 最终作品和创作故事
└──────────────┘
```

---

## 三、数据模型设计

### 3.1 核心类型定义

```typescript
// ============================================
// 灵感脉络核心数据模型
// ============================================

/**
 * 创作脉络
 * 代表一次完整的创作过程
 */
export interface CreationMindMap {
  id: string;
  userId: string;
  title: string;
  description: string;
  
  // 关联的老字号品牌
  relatedBrands: BrandReference[];
  
  // 节点数据
  nodes: MindNode[];
  
  // 脉络设置
  settings: MindMapSettings;
  
  // 统计信息
  stats: MindMapStats;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

/**
 * 品牌引用
 */
export interface BrandReference {
  brandId: string;           // 品牌ID
  brandName: string;         // 品牌名称
  brandCategory: string;     // 品牌类别
  extractedElements: CulturalElement[]; // 提取的文化元素
}

/**
 * 文化元素
 * 从老字号中提取的可用于创作的元素
 */
export interface CulturalElement {
  id: string;
  name: string;              // 元素名称，如"十八个褶"
  type: 'visual' | 'story' | 'emotion' | 'craft';
  description: string;       // 元素描述
  meaning: string;           // 文化内涵
  visualAttributes: {
    colors?: string[];       // 相关颜色
    shapes?: string[];       // 相关形状
    textures?: string[];     // 相关纹理
    patterns?: string[];     // 相关图案
  };
  storyContext?: string;     // 相关故事
  aiPrompts: string[];       // 可用于AI生成的提示词
}

/**
 * 脉络节点
 * 思维导图中的每个节点
 */
export interface MindNode {
  id: string;
  mapId: string;
  
  // 节点类型
  type: NodeType;
  category: NodeCategory;
  
  // 节点内容
  content: NodeContent;
  
  // 文化关联
  culturalContext?: CulturalContext;
  
  // 脉络关系
  parentId?: string;
  children: string[];
  siblings: string[];
  
  // 时间线
  createdAt: string;
  updatedAt: string;
  version: number;
  
  // 可视化
  position: NodePosition;
  style: NodeStyle;
}

/**
 * 节点类型
 */
export type NodeType = 'root' | 'branch' | 'leaf';

/**
 * 节点类别
 */
export type NodeCategory = 
  | 'inspiration'      // 灵感触发
  | 'culture'          // 文化融合
  | 'ai_generate'      // AI生成
  | 'manual_edit'      // 人工调整
  | 'reference'        // 参考资料
  | 'final';           // 最终作品

/**
 * 节点内容
 */
export interface NodeContent {
  title: string;
  description: string;
  images?: string[];           // 参考图片
  aiPrompt?: string;           // AI提示词
  aiResult?: AIResult;         // AI生成结果
  userNotes?: string;          // 用户笔记
  tags?: string[];             // 标签
}

/**
 * AI生成结果
 */
export interface AIResult {
  type: 'text' | 'image' | 'design' | 'idea';
  content: string;
  variations?: string[];       // 变体
  parameters?: Record<string, any>; // 生成参数
  timestamp: string;
}

/**
 * 文化上下文
 */
export interface CulturalContext {
  brandId?: string;
  brandName?: string;
  elementId?: string;
  elementName?: string;
  storySnippet?: string;
  historicalContext?: string;
}

/**
 * 节点位置
 */
export interface NodePosition {
  x: number;
  y: number;
  level: number;               // 层级深度
}

/**
 * 节点样式
 */
export interface NodeStyle {
  color: string;
  borderColor: string;
  icon?: string;
  size: 'small' | 'medium' | 'large';
}

/**
 * 脉络设置
 */
export interface MindMapSettings {
  isPublic: boolean;
  allowFork: boolean;
  theme: 'tianjin' | 'modern' | 'minimal';
  autoSave: boolean;
  aiAssistance: boolean;
}

/**
 * 脉络统计
 */
export interface MindMapStats {
  nodeCount: number;
  aiGenerationCount: number;
  totalTime: number;           // 创作总时长（分钟）
  lastActive: string;
  viewCount: number;
  forkCount: number;
}

/**
 * 脉络分享
 */
export interface MindMapShare {
  id: string;
  mindMapId: string;
  shareType: 'link' | 'embed' | 'export';
  shareUrl?: string;
  embedCode?: string;
  viewCount: number;
  likeCount: number;
  forkCount: number;
  createdAt: string;
}

/**
 * 创作故事
 * 基于脉络自动生成的创作故事
 */
export interface CreationStory {
  id: string;
  mapId: string;
  title: string;
  content: string;             // 故事正文
  highlights: StoryHighlight[]; // 精彩节点
  timeline: StoryEvent[];      // 时间线事件
  generatedAt: string;
}

/**
 * 故事亮点
 */
export interface StoryHighlight {
  nodeId: string;
  title: string;
  description: string;
  quote?: string;
}

/**
 * 故事事件
 */
export interface StoryEvent {
  timestamp: string;
  title: string;
  description: string;
  nodeId: string;
}
```

---

## 四、核心服务设计

### 4.1 灵感脉络服务

```typescript
/**
 * 灵感脉络服务
 * 管理创作脉络的完整生命周期
 */
export class InspirationMindMapService {
  
  // ============================================
  // 脉络管理
  // ============================================
  
  /**
   * 创建新的创作脉络
   * @param userId 用户ID
   * @param title 脉络标题
   * @param brandId 关联的老字号品牌ID（可选）
   */
  async createMindMap(
    userId: string, 
    title: string, 
    brandId?: string
  ): Promise<CreationMindMap>;
  
  /**
   * 获取脉络详情
   */
  async getMindMap(mapId: string): Promise<CreationMindMap | null>;
  
  /**
   * 更新脉络
   */
  async updateMindMap(
    mapId: string, 
    updates: Partial<CreationMindMap>
  ): Promise<CreationMindMap>;
  
  /**
   * 删除脉络
   */
  async deleteMindMap(mapId: string): Promise<boolean>;
  
  /**
   * 获取用户的所有脉络
   */
  async getUserMindMaps(userId: string): Promise<CreationMindMap[]>;
  
  // ============================================
  // 节点管理
  // ============================================
  
  /**
   * 添加节点
   * @param mapId 脉络ID
   * @param node 节点数据
   * @param parentId 父节点ID（可选）
   */
  async addNode(
    mapId: string, 
    node: Partial<MindNode>, 
    parentId?: string
  ): Promise<MindNode>;
  
  /**
   * 更新节点
   */
  async updateNode(
    nodeId: string, 
    updates: Partial<MindNode>
  ): Promise<MindNode>;
  
  /**
   * 删除节点
   */
  async deleteNode(nodeId: string): Promise<boolean>;
  
  /**
   * 移动节点
   */
  async moveNode(
    nodeId: string, 
    newParentId?: string
  ): Promise<MindNode>;
  
  // ============================================
  // AI辅助功能
  // ============================================
  
  /**
   * 生成AI创作建议
   * @param nodeId 当前节点ID
   * @param type 建议类型
   */
  async generateAISuggestion(
    nodeId: string, 
    type: 'continue' | 'branch' | 'optimize' | 'culture'
  ): Promise<AISuggestion>;
  
  /**
   * 基于文化元素生成创作方向
   */
  async generateCulturalDirections(
    brandId: string, 
    elementIds: string[]
  ): Promise<CulturalDirection[]>;
  
  /**
   * AI生成内容
   */
  async generateContent(
    nodeId: string, 
    prompt: string, 
    type: 'text' | 'image' | 'design'
  ): Promise<AIResult>;
  
  /**
   * 优化创作路径
   */
  async optimizePath(mapId: string): Promise<PathOptimization>;
  
  // ============================================
  // 可视化与布局
  // ============================================
  
  /**
   * 计算节点布局
   * @param nodes 节点列表
   * @param layoutType 布局类型
   */
  calculateLayout(
    nodes: MindNode[], 
    layoutType: 'tree' | 'radial' | 'timeline'
  ): NodePosition[];
  
  /**
   * 自动排列节点
   */
  autoArrangeNodes(mapId: string): Promise<MindNode[]>;
  
  // ============================================
  // 故事生成
  // ============================================
  
  /**
   * 生成创作故事
   */
  async generateCreationStory(mapId: string): Promise<CreationStory>;
  
  /**
   * 生成时间线视图
   */
  async generateTimeline(mapId: string): Promise<StoryEvent[]>;
  
  // ============================================
  // 分享与导出
  // ============================================
  
  /**
   * 分享脉络
   */
  async shareMindMap(
    mapId: string, 
    shareType: 'link' | 'embed' | 'export'
  ): Promise<MindMapShare>;
  
  /**
   * Fork他人的脉络
   */
  async forkMindMap(
    mapId: string, 
    userId: string
  ): Promise<CreationMindMap>;
  
  /**
   * 导出脉络
   */
  async exportMindMap(
    mapId: string, 
    format: 'png' | 'pdf' | 'json' | 'interactive'
  ): Promise<string>; // 返回下载链接
}
```

### 4.2 老字号灵感服务

```typescript
/**
 * 老字号灵感服务
 * 管理天津老字号文化元素
 */
export class BrandInspirationService {
  
  /**
   * 获取所有老字号品牌
   */
  async getAllBrands(): Promise<Brand[]>;
  
  /**
   * 获取品牌详情
   */
  async getBrand(brandId: string): Promise<Brand | null>;
  
  /**
   * 提取文化元素
   * 从品牌故事中自动提取可用于创作的元素
   */
  async extractCulturalElements(brandId: string): Promise<CulturalElement[]>;
  
  /**
   * 搜索文化元素
   */
  async searchElements(query: string): Promise<CulturalElement[]>;
  
  /**
   * 获取元素关联
   * 获取与指定元素相关的其他元素
   */
  async getElementRelations(elementId: string): Promise<CulturalElement[]>;
  
  /**
   * 生成元素组合建议
   * 建议可以组合使用的文化元素
   */
  async suggestElementCombinations(
    selectedElements: string[]
  ): Promise<ElementCombination[]>;
}
```

---

## 五、组件架构

### 5.1 组件层级

```
InspirationMindMap/
├── MindMapCanvas/              # 思维导图画布（核心容器）
│   ├── index.tsx
│   ├── MindMapCanvas.tsx       # 画布主组件
│   ├── NodeRenderer/           # 节点渲染
│   │   ├── NodeRenderer.tsx
│   │   ├── NodeTypes/          # 不同类型节点
│   │   │   ├── RootNode.tsx    # 根节点（老字号品牌）
│   │   │   ├── BranchNode.tsx  # 分支节点
│   │   │   ├── LeafNode.tsx    # 叶子节点（最终作品）
│   │   │   └── AINode.tsx      # AI生成节点
│   │   └── NodeActions.tsx     # 节点操作菜单
│   ├── ConnectionLine/         # 连线渲染
│   │   ├── ConnectionLine.tsx
│   │   └── LineAnimation.tsx   # 连线动画
│   ├── MiniMap/                # 缩略图
│   └── Toolbar/                # 工具栏
│
├── BrandInspirationPanel/      # 老字号灵感面板
│   ├── index.tsx
│   ├── BrandInspirationPanel.tsx
│   ├── BrandCard/              # 品牌卡片
│   │   ├── BrandCard.tsx
│   │   └── BrandCardGrid.tsx   # 卡片网格
│   ├── ElementExtractor/       # 元素提取器
│   │   ├── ElementExtractor.tsx
│   │   └── ElementCard.tsx
│   └── AIAssistantChat/        # AI助手对话
│       ├── AIAssistantChat.tsx
│       └── ChatMessage.tsx
│
├── NodeEditor/                 # 节点编辑器
│   ├── index.tsx
│   ├── NodeEditor.tsx
│   ├── ContentEditor/          # 内容编辑
│   ├── AIResultViewer/         # AI结果查看
│   ├── VersionHistory/         # 版本历史
│   └── CulturalContext/        # 文化上下文
│
├── StoryGenerator/             # 故事生成器
│   ├── index.tsx
│   ├── StoryGenerator.tsx
│   ├── TimelineView/           # 时间轴视图
│   └── StoryExport/            # 故事导出
│
└── SharePanel/                 # 分享面板
    ├── index.tsx
    ├── SharePanel.tsx
    └── ExportOptions.tsx
```

### 5.2 核心组件接口

```typescript
// MindMapCanvas 组件
interface MindMapCanvasProps {
  mindMap: CreationMindMap;
  onNodeSelect?: (node: MindNode) => void;
  onNodeAdd?: (parentId?: string) => void;
  onNodeDelete?: (nodeId: string) => void;
  onLayoutChange?: (layout: NodePosition[]) => void;
  readonly?: boolean;
  theme?: 'tianjin' | 'modern' | 'minimal';
}

// BrandInspirationPanel 组件
interface BrandInspirationPanelProps {
  onBrandSelect?: (brand: Brand) => void;
  onElementSelect?: (element: CulturalElement) => void;
  onAIRequest?: (request: AIRequest) => void;
  selectedBrand?: string;
  className?: string;
}

// NodeEditor 组件
interface NodeEditorProps {
  node: MindNode;
  onSave?: (node: MindNode) => void;
  onCancel?: () => void;
  onAIGenerate?: (prompt: string) => Promise<AIResult>;
}
```

---

## 六、与现有系统集成

### 6.1 与创作中心集成

```typescript
// 在Create页面集成灵感脉络
// src/pages/create/index.tsx

import { InspirationMindMap } from '@/components/InspirationMindMap';

// 新增"灵感脉络"创作模式
const creationModes = [
  { id: 'normal', name: '常规创作' },
  { id: 'mindmap', name: '灵感脉络' }, // 新增
  { id: 'ai', name: 'AI辅助' },
];

// 当选择"灵感脉络"模式时
function MindMapCreationMode() {
  return (
    <div className="flex h-full">
      {/* 左侧：老字号灵感面板 */}
      <BrandInspirationPanel 
        onBrandSelect={handleBrandSelect}
        onElementSelect={handleElementSelect}
      />
      
      {/* 中间：思维导图画布 */}
      <MindMapCanvas 
        mindMap={currentMindMap}
        onNodeSelect={handleNodeSelect}
      />
      
      {/* 右侧：节点编辑器 */}
      <NodeEditor 
        node={selectedNode}
        onSave={handleNodeSave}
        onAIGenerate={handleAIGenerate}
      />
    </div>
  );
}
```

### 6.2 与AI服务集成

```typescript
// 与现有的llmService集成
// src/services/inspirationMindMapService.ts

import { llmService } from '@/services/llmService';

export class InspirationMindMapService {
  
  async generateAISuggestion(nodeId: string, type: string) {
    const node = await this.getNode(nodeId);
    
    // 构建提示词
    const prompt = this.buildSuggestionPrompt(node, type);
    
    // 调用AI服务
    const response = await llmService.generate({
      prompt,
      systemPrompt: '你是一位创意助手，帮助用户基于天津老字号文化进行创作...',
      temperature: 0.8,
    });
    
    return this.parseSuggestion(response);
  }
  
  async generateContent(nodeId: string, prompt: string, type: string) {
    // 根据类型调用不同的AI生成服务
    switch (type) {
      case 'text':
        return llmService.generateText({ prompt });
      case 'image':
        return llmService.generateImage({ prompt });
      case 'design':
        return llmService.generateDesign({ prompt });
      default:
        throw new Error('不支持的生成类型');
    }
  }
}
```

### 6.3 与数据存储集成

```typescript
// 与Supabase集成
// 存储结构：

// 表：mind_maps
// - id: uuid
// - user_id: uuid (foreign key)
// - title: text
// - description: text
// - settings: jsonb
// - stats: jsonb
// - created_at: timestamp
// - updated_at: timestamp

// 表：mind_map_nodes
// - id: uuid
// - map_id: uuid (foreign key)
// - type: text
// - category: text
// - content: jsonb
// - cultural_context: jsonb
// - parent_id: uuid (self reference)
// - children: uuid[]
// - position: jsonb
// - style: jsonb
// - created_at: timestamp
// - updated_at: timestamp

// 表：cultural_elements
// - id: uuid
// - brand_id: text
// - name: text
// - type: text
// - description: text
// - visual_attributes: jsonb
// - ai_prompts: text[]
```

---

## 七、用户流程设计

### 7.1 创建新脉络流程

```
1. 用户点击"新建脉络"
   │
   ▼
2. 选择创作主题
   ├── 从老字号开始
   ├── 自由创作
   └── 从模板开始
   │
   ▼
3. 如选择"从老字号开始"
   ├── 展示老字号卡片墙
   ├── 用户选择品牌（如"狗不理包子"）
   └── 系统自动提取文化元素
   │
   ▼
4. 创建根节点
   ├── 节点标题：狗不理包子
   ├── 节点类型：根节点
   └── 关联文化元素：18个褶、圆润形态等
   │
   ▼
5. AI生成建议
   ├── "建议从18个褶的螺旋形态入手..."
   ├── "可以尝试将包子圆润造型..."
   └── 用户选择或自定义
   │
   ▼
6. 创建第一层分支节点
   │
   ▼
7. 进入创作迭代循环
   ├── AI生成初稿
   ├── 用户调整
   ├── AI优化
   └── 重复直到满意
   │
   ▼
8. 完成创作
   ├── 生成最终作品
   ├── 生成创作故事
   └── 可选择分享
```

### 7.2 查看他人脉络流程

```
1. 浏览脉络广场
   │
   ▼
2. 查看脉络预览
   ├── 标题、作者、点赞数
   ├── 关联的老字号
   └── 节点数量
   │
   ▼
3. 进入脉络详情
   ├── 查看完整思维导图
   ├── 点击节点查看详情
   └── 播放创作过程动画
   │
   ▼
4. 阅读创作故事
   ├── 时间线形式
   ├── 关键节点高亮
   └── 作者心得
   │
   ▼
5. 互动操作
   ├── 点赞
   ├── 评论
   ├── Fork（复制到自己的脉络）
   └── 分享
```

---

## 八、实施路线图

### 第一阶段（3周）：基础框架
- [ ] 创建数据模型和类型定义
- [ ] 实现基础服务层
- [ ] 创建思维导图画布组件
- [ ] 实现节点CRUD操作
- [ ] 基础可视化布局

### 第二阶段（3周）：老字号融合
- [ ] 扩展老字号数据库
- [ ] 实现文化元素提取器
- [ ] 创建老字号灵感面板
- [ ] 实现AI建议生成
- [ ] 天津风格主题设计

### 第三阶段（2周）：AI集成
- [ ] 集成现有AI服务
- [ ] 实现AI生成节点
- [ ] 创建AI助手对话界面
- [ ] 实现创作路径优化

### 第四阶段（2周）：故事与分享
- [ ] 实现创作故事生成
- [ ] 创建时间线视图
- [ ] 实现分享功能
- [ ] 创建脉络广场

### 第五阶段（2周）：优化与测试
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 全面测试
- [ ] 文档完善

---

## 九、技术要点

### 9.1 性能优化

- **虚拟化渲染**：大量节点时使用虚拟列表
- **增量更新**：只更新变化的节点
- **Web Worker**：复杂布局计算移至后台
- **图片懒加载**：节点图片按需加载

### 9.2 用户体验

- **流畅动画**：使用Framer Motion实现节点动画
- **手势操作**：支持拖拽、缩放、双指操作
- **快捷键**：支持常用操作快捷键
- **自动保存**：防止数据丢失

### 9.3 可访问性

- **键盘导航**：支持纯键盘操作
- **屏幕阅读器**：为节点添加ARIA标签
- **高对比度**：支持高对比度模式
- **字体缩放**：适配不同字体大小

---

## 十、附录

### 10.1 相关文档

- [平台功能完善方案](./PLATFORM_IMPROVEMENT_PLAN.md)
- [数据库设计](./database-schema.md)
- [AI服务文档](../src/services/llmService.ts)

### 10.2 参考资料

- [思维导图库对比](https://www.npmjs.com/package/react-flow-renderer)
- [Framer Motion文档](https://www.framer.com/motion/)
- [天津老字号名录](http://www.tj.gov.cn/)

---

**文档维护**

- 创建人：AI Assistant
- 最后更新：2026-02-11
- 审核状态：待技术评审

---

*本文档为"灵感脉络"功能的技术实现方案，供开发团队参考使用。*
