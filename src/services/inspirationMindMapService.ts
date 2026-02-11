/**
 * 灵感脉络服务
 * 管理创作脉络的完整生命周期
 * 
 * 功能说明：
 * - 创作脉络的CRUD操作
 * - 节点管理与可视化布局
 * - AI辅助创作建议
 * - 创作故事生成
 * - 分享与导出功能
 */

import { supabase } from '@/lib/supabase';
import { llmService } from './llmService';
import type { 
  MindNode, 
  NodePosition, 
  NodeStyle,
  CreationMindMap,
  CreationStory,
  CulturalElement,
  BrandReference,
  AISuggestion,
  AIResult,
  NodeContent,
  MindMapSettings,
  MindMapStats,
  TurningPoint,
  TimelineEvent,
  StoryStats,
  LayoutType,
} from '@/components/InspirationMindMap/types';

// 服务内部使用的类型
interface StoryHighlight {
  nodeId: string;
  title: string;
  description: string;
  quote?: string;
}

interface StoryEvent {
  timestamp: number;
  title: string;
  description: string;
  nodeId: string;
}

// ============================================
// 灵感脉络服务类
// ============================================

export class InspirationMindMapService {
  private static instance: InspirationMindMapService;

  private constructor() {}

  public static getInstance(): InspirationMindMapService {
    if (!InspirationMindMapService.instance) {
      InspirationMindMapService.instance = new InspirationMindMapService();
    }
    return InspirationMindMapService.instance;
  }

  // ============================================
  // 脉络管理
  // ============================================

  /**
   * 创建新的创作脉络
   */
  async createMindMap(
    userId: string,
    title: string,
    brandId?: string
  ): Promise<CreationMindMap> {
    const now = Date.now();
    const mapId = `map-${now}`;
    
    const mindMap: CreationMindMap = {
      id: mapId,
      userId,
      title,
      description: '',
      nodes: [],
      layoutType: 'tree',
      settings: {
        layoutType: 'tree',
        theme: 'tianjin',
        autoSave: true,
        showGrid: true,
        snapToGrid: false,
        gridSize: 20,
      },
      stats: {
        totalNodes: 0,
        maxDepth: 0,
        aiGeneratedNodes: 0,
        cultureNodes: 0,
        lastActivityAt: now,
      },
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    };

    // 保存到本地存储
    this.saveToLocalStorage(mindMap);
    
    return mindMap;
  }

  /**
   * 获取脉络详情
   */
  async getMindMap(mapId: string): Promise<CreationMindMap | null> {
    // 从本地存储获取（开发阶段）
    const data = localStorage.getItem(`mindmap-${mapId}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  /**
   * 更新脉络
   */
  async updateMindMap(
    mapId: string,
    updates: Partial<CreationMindMap>
  ): Promise<CreationMindMap> {
    const mindMap = await this.getMindMap(mapId);
    if (!mindMap) {
      throw new Error('脉络不存在');
    }

    const updatedMap = {
      ...mindMap,
      ...updates,
      updatedAt: Date.now(),
    };

    this.saveToLocalStorage(updatedMap);
    return updatedMap;
  }

  /**
   * 删除脉络
   */
  async deleteMindMap(mapId: string): Promise<void> {
    localStorage.removeItem(`mindmap-${mapId}`);
  }

  /**
   * 获取用户的所有脉络
   */
  async getUserMindMaps(userId: string): Promise<CreationMindMap[]> {
    const maps: CreationMindMap[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mindmap-')) {
        const data = localStorage.getItem(key);
        if (data) {
          const map = JSON.parse(data);
          if (map.userId === userId) {
            maps.push(map);
          }
        }
      }
    }
    return maps.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // ============================================
  // 节点管理
  // ============================================

  /**
   * 添加节点
   */
  async addNode(
    mapId: string,
    nodeData: Partial<MindNode>,
    parentId?: string
  ): Promise<MindNode> {
    const mindMap = await this.getMindMap(mapId);
    if (!mindMap) {
      throw new Error('脉络不存在');
    }

    const now = Date.now();
    const newNode: MindNode = {
      id: `node-${now}`,
      mapId,
      parentId,
      title: nodeData.title || '新节点',
      description: nodeData.description || '',
      category: nodeData.category || 'inspiration',
      content: nodeData.content,
      aiPrompt: nodeData.aiPrompt,
      aiGeneratedContent: nodeData.aiGeneratedContent,
      userNote: nodeData.userNote,
      tags: nodeData.tags || [],
      style: nodeData.style,
      brandReferences: nodeData.brandReferences,
      culturalElements: nodeData.culturalElements,
      aiResults: nodeData.aiResults,
      position: nodeData.position,
      version: 1,
      history: [{
        version: 1,
        timestamp: now,
        action: 'create',
        changes: ['创建节点'],
      }],
      createdAt: now,
      updatedAt: now,
    };

    mindMap.nodes.push(newNode);
    mindMap.stats.totalNodes = mindMap.nodes.length;
    mindMap.stats.lastActivityAt = now;
    mindMap.updatedAt = now;

    this.saveToLocalStorage(mindMap);
    return newNode;
  }

  /**
   * 更新节点
   */
  async updateNode(
    nodeId: string,
    updates: Partial<MindNode>
  ): Promise<MindNode> {
    const mindMap = await this.findMindMapByNodeId(nodeId);
    if (!mindMap) {
      throw new Error('节点不存在');
    }

    const nodeIndex = mindMap.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
      throw new Error('节点不存在');
    }

    const node = mindMap.nodes[nodeIndex];
    const now = Date.now();
    
    const updatedNode: MindNode = {
      ...node,
      ...updates,
      version: node.version + 1,
      updatedAt: now,
      history: [
        ...(node.history || []),
        {
          version: node.version + 1,
          timestamp: now,
          action: 'edit',
          changes: Object.keys(updates),
        },
      ],
    };

    mindMap.nodes[nodeIndex] = updatedNode;
    mindMap.stats.lastActivityAt = now;
    mindMap.updatedAt = now;

    this.saveToLocalStorage(mindMap);
    return updatedNode;
  }

  /**
   * 删除节点
   */
  async deleteNode(nodeId: string): Promise<void> {
    const mindMap = await this.findMindMapByNodeId(nodeId);
    if (!mindMap) {
      throw new Error('节点不存在');
    }

    // 删除节点及其子节点
    const nodesToDelete = new Set<string>();
    const collectChildren = (id: string) => {
      nodesToDelete.add(id);
      mindMap.nodes
        .filter(n => n.parentId === id)
        .forEach(child => collectChildren(child.id));
    };
    collectChildren(nodeId);

    mindMap.nodes = mindMap.nodes.filter(n => !nodesToDelete.has(n.id));
    mindMap.stats.totalNodes = mindMap.nodes.length;
    mindMap.stats.lastActivityAt = Date.now();
    mindMap.updatedAt = Date.now();

    this.saveToLocalStorage(mindMap);
  }

  /**
   * 根据节点ID查找脉络
   */
  private async findMindMapByNodeId(nodeId: string): Promise<CreationMindMap | null> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mindmap-')) {
        const data = localStorage.getItem(key);
        if (data) {
          const map = JSON.parse(data);
          if (map.nodes.some((n: MindNode) => n.id === nodeId)) {
            return map;
          }
        }
      }
    }
    return null;
  }

  // ============================================
  // 布局计算
  // ============================================

  /**
   * 计算节点布局
   */
  calculateLayout(
    nodes: MindNode[],
    layoutType: LayoutType = 'tree'
  ): NodePosition[] {
    switch (layoutType) {
      case 'tree':
        return this.calculateTreeLayout(nodes);
      case 'radial':
        return this.calculateRadialLayout(nodes);
      case 'timeline':
        return this.calculateTimelineLayout(nodes);
      default:
        return this.calculateTreeLayout(nodes);
    }
  }

  /**
   * 树形布局
   */
  private calculateTreeLayout(nodes: MindNode[]): NodePosition[] {
    const positions: NodePosition[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // 找到根节点（没有 parentId 的节点）
    const rootNode = nodes.find(n => !n.parentId);
    if (!rootNode) return positions;

    const levelHeight = 150;
    const nodeWidth = 200;
    
    const calculatePosition = (nodeId: string, level: number, index: number, totalSiblings: number): NodePosition => {
      const x = index * nodeWidth - (totalSiblings - 1) * nodeWidth / 2;
      const y = level * levelHeight;
      return { x, y, level };
    };

    const traverse = (nodeId: string, level: number, index: number, totalSiblings: number) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;

      const position = calculatePosition(nodeId, level, index, totalSiblings);
      positions.push({ nodeId, ...position });

      // 从 nodes 数组中查找子节点
      const children = nodes.filter(n => n.parentId === nodeId);
      children.forEach((child, childIndex) => {
        traverse(child.id, level + 1, childIndex, children.length);
      });
    };

    traverse(rootNode.id, 0, 0, 1);
    return positions;
  }

  /**
   * 径向布局
   */
  private calculateRadialLayout(nodes: MindNode[]): NodePosition[] {
    // TODO: 实现径向布局
    return [];
  }

  /**
   * 时间轴布局
   */
  private calculateTimelineLayout(nodes: MindNode[]): NodePosition[] {
    // 按创建时间排序
    const sortedNodes = [...nodes].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const positions: NodePosition[] = [];
    const itemWidth = 250;

    sortedNodes.forEach((node, index) => {
      positions.push({
        nodeId: node.id,
        x: index * itemWidth,
        y: 0,
        level: 0,
      });
    });

    return positions;
  }

  // ============================================
  // AI功能
  // ============================================

  /**
   * 生成AI建议
   */
  async generateAISuggestion(
    nodeId: string,
    type: 'continue' | 'branch' | 'optimize' | 'culture'
  ): Promise<AISuggestion> {
    const mindMap = await this.findMindMapByNodeId(nodeId);
    if (!mindMap) {
      throw new Error('节点不存在');
    }

    const node = mindMap.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error('节点不存在');
    }

    // 构建提示词
    const prompt = this.buildSuggestionPrompt(node, mindMap, type);

    // 调用AI服务
    try {
      const response = await llmService.generateText(prompt);
      
      return {
        id: `suggestion-${Date.now()}`,
        type,
        content: response.content,
        prompt,
        confidence: 0.85,
        timestamp: Date.now(),
      };
    } catch (error) {
      // 如果AI服务失败，返回默认建议
      return this.getDefaultSuggestion(type);
    }
  }

  /**
   * 构建建议提示词
   */
  private buildSuggestionPrompt(
    node: MindNode,
    mindMap: CreationMindMap | null,
    type: string
  ): string {
    let prompt = `当前创作节点：${node.title}\n`;
    if (node.description) {
      prompt += `节点描述：${node.description}\n`;
    }

    prompt += `\n建议类型：${type}\n`;
    prompt += `请提供具体的创作建议，包括：\n`;
    prompt += `1. 建议标题\n`;
    prompt += `2. 详细描述\n`;
    prompt += `3. 可用于AI生成的提示词（可选）\n`;

    return prompt;
  }

  /**
   * 获取默认建议
   */
  private getDefaultSuggestion(type: string): AISuggestion {
    const suggestions: Record<string, { title: string; content: string }> = {
      continue: {
        title: '继续创作建议',
        content: '基于当前节点，建议深入挖掘主题内涵，添加更多细节描述。',
      },
      branch: {
        title: '分支创作建议',
        content: '可以从不同角度展开，创建多个平行的创作方向。',
      },
      optimize: {
        title: '优化建议',
        content: '建议精简表达，突出核心创意，增强视觉冲击力。',
      },
      culture: {
        title: '文化融合建议',
        content: '可以融入更多天津传统文化元素，增强地域特色。',
      },
    };

    const suggestion = suggestions[type] || suggestions.continue;

    return {
      id: `suggestion-${Date.now()}`,
      type: type as any,
      content: suggestion.content,
      prompt: '',
      confidence: 0.7,
      timestamp: Date.now(),
    };
  }

  // ============================================
  // 故事生成
  // ============================================

  /**
   * 生成创作故事
   */
  async generateCreationStory(mapId: string): Promise<CreationStory> {
    const mindMap = await this.getMindMap(mapId);
    if (!mindMap) {
      throw new Error('脉络不存在');
    }

    const now = Date.now();
    
    // 构建故事内容
    const storyContent = this.buildStoryContent(mindMap);
    
    // 提取关键转折点
    const keyTurningPoints: TurningPoint[] = mindMap.nodes
      .filter(n => n.category === 'ai_generate' || n.category === 'culture')
      .map(n => ({
        nodeId: n.id,
        description: n.title,
        timestamp: n.createdAt,
      }));

    // 提取文化元素
    const cultureElements: string[] = [];
    mindMap.nodes.forEach(node => {
      if (node.culturalElements) {
        node.culturalElements.forEach(el => {
          if (!cultureElements.includes(el.name)) {
            cultureElements.push(el.name);
          }
        });
      }
    });

    // 生成时间线
    const timeline: TimelineEvent[] = mindMap.nodes
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(node => ({
        phase: node.category === 'inspiration' ? '灵感收集' : 
               node.category === 'ai_generate' ? 'AI协作' : 
               node.category === 'culture' ? '文化融合' : '创作',
        description: node.title,
        timestamp: node.createdAt,
        nodeIds: [node.id],
      }));

    // 计算统计
    const stats: StoryStats = {
      totalDuration: now - mindMap.createdAt,
      inspirationCount: mindMap.nodes.filter(n => n.category === 'inspiration').length,
      aiInteractionCount: mindMap.nodes.filter(n => n.category === 'ai_generate').length,
      iterationCount: mindMap.nodes.reduce((sum, n) => sum + (n.version || 1), 0),
    };

    return {
      id: `story-${now}`,
      mapId,
      title: `${mindMap.title}的创作故事`,
      subtitle: `从灵感到成品的${mindMap.nodes.length}个节点创作历程`,
      fullStory: storyContent,
      keyTurningPoints,
      cultureElements,
      timeline,
      stats,
      themes: mindMap.tags || ['创作', '灵感'],
      participants: [mindMap.userId],
      generatedAt: now,
    };
  }

  /**
   * 构建故事内容
   */
  private buildStoryContent(mindMap: CreationMindMap): string {
    let content = `# ${mindMap.title}的创作故事\n\n`;
    content += `这是一个充满创意的创作历程。\n\n`;
    
    // 按时间顺序叙述
    const sortedNodes = [...mindMap.nodes].sort((a, b) => 
      a.createdAt - b.createdAt
    );

    sortedNodes.forEach((node, index) => {
      content += `## 第${index + 1}步：${node.title}\n`;
      if (node.description) {
        content += `${node.description}\n\n`;
      }
      
      if (node.userNote) {
        content += `💡 创作者心得：${node.userNote}\n\n`;
      }
    });

    content += `---\n`;
    content += `创作完成于 ${new Date(mindMap.updatedAt).toLocaleDateString('zh-CN')}`;
    
    return content;
  }

  // ============================================
  // 本地存储（开发阶段使用）
  // ============================================

  private saveToLocalStorage(mindMap: CreationMindMap): void {
    localStorage.setItem(`mindmap-${mindMap.id}`, JSON.stringify(mindMap));
  }
}

// 导出服务实例
export const inspirationMindMapService = InspirationMindMapService.getInstance();

export default inspirationMindMapService;
