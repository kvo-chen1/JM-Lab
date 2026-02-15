/**
 * 津脉脉络服务
 * 管理创作脉络的完整生命周期 - 使用 Supabase 数据库存储
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
// 津脉脉络服务类
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

  // 获取当前用户ID
  private async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
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
    const now = new Date().toISOString();
    const nowTimestamp = Date.now();

    const mindMapData = {
      user_id: userId,
      title,
      description: '',
      layout_type: 'timeline',
      settings: {
        layoutType: 'timeline',
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
        lastActivityAt: nowTimestamp,
      },
      tags: [],
      is_public: false,
    };

    console.log('[InspirationMindMapService] Creating mind map for user:', userId);
    const { data, error } = await supabase
      .from('inspiration_mindmaps')
      .insert(mindMapData)
      .select()
      .single();

    if (error) {
      console.error('[InspirationMindMapService] 创建脉络失败:', error);
      throw new Error(`创建脉络失败: ${error.message}`);
    }

    console.log('[InspirationMindMapService] Mind map created:', data?.id);
    return this.mapDbToMindMap(data);
  }

  /**
   * 获取脉络详情
   */
  async getMindMap(mapId: string): Promise<CreationMindMap | null> {
    // 获取脉络基本信息
    const { data: mindMapData, error: mindMapError } = await supabase
      .from('inspiration_mindmaps')
      .select('*')
      .eq('id', mapId)
      .single();

    if (mindMapError) {
      if (mindMapError.code === 'PGRST116') {
        return null; // 未找到
      }
      console.error('获取脉络失败:', mindMapError);
      throw new Error(`获取脉络失败: ${mindMapError.message}`);
    }

    // 获取脉络的所有节点
    console.log('[InspirationMindMapService] Fetching nodes for map:', mapId);
    const { data: nodesData, error: nodesError } = await supabase
      .from('inspiration_nodes')
      .select('*')
      .eq('map_id', mapId)
      .order('created_at', { ascending: true });

    if (nodesError) {
      console.error('[InspirationMindMapService] 获取节点失败:', nodesError);
      throw new Error(`获取节点失败: ${nodesError.message}`);
    }
    
    console.log('[InspirationMindMapService] Nodes data:', nodesData?.length || 0, nodesData?.map((n: any) => ({ id: n.id, title: n.title?.substring(0, 20) })));

    const mindMap = this.mapDbToMindMap(mindMapData);
    mindMap.nodes = (nodesData || []).map(this.mapDbToNode);
    
    console.log('[InspirationMindMapService] getMindMap:', mapId, 'nodes:', mindMap.nodes.length);

    return mindMap;
  }

  /**
   * 更新脉络
   */
  async updateMindMap(
    mapId: string,
    updates: Partial<CreationMindMap>
  ): Promise<CreationMindMap> {
    const dbUpdates: any = {};
    
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.layoutType !== undefined) dbUpdates.layout_type = updates.layoutType;
    if (updates.settings !== undefined) dbUpdates.settings = updates.settings;
    if (updates.stats !== undefined) dbUpdates.stats = updates.stats;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;

    const { data, error } = await supabase
      .from('inspiration_mindmaps')
      .update(dbUpdates)
      .eq('id', mapId)
      .select()
      .single();

    if (error) {
      console.error('更新脉络失败:', error);
      throw new Error(`更新脉络失败: ${error.message}`);
    }

    return this.mapDbToMindMap(data);
  }

  /**
   * 删除脉络
   */
  async deleteMindMap(mapId: string): Promise<void> {
    const { error } = await supabase
      .from('inspiration_mindmaps')
      .delete()
      .eq('id', mapId);

    if (error) {
      console.error('删除脉络失败:', error);
      throw new Error(`删除脉络失败: ${error.message}`);
    }
  }

  /**
   * 获取用户的所有脉络
   */
  async getUserMindMaps(userId: string): Promise<CreationMindMap[]> {
    console.log('[InspirationMindMapService] Fetching mind maps for user:', userId);
    const { data, error } = await supabase
      .from('inspiration_mindmaps')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[InspirationMindMapService] 获取用户脉络列表失败:', error);
      throw new Error(`获取脉络列表失败: ${error.message}`);
    }

    console.log('[InspirationMindMapService] Found', data?.length || 0, 'mind maps');
    return (data || []).map(this.mapDbToMindMap);
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
    const now = new Date().toISOString();
    const nowTimestamp = Date.now();

    // 从 nodeData 中排除可能导致问题的字段
    const {
      id, mapId: _, parentId: __, createdAt, updatedAt, history,
      ...cleanNodeData
    } = nodeData as any;

    const nodeDbData = {
      map_id: mapId,
      parent_id: parentId || null,
      title: cleanNodeData.title || '新节点',
      description: cleanNodeData.description || '',
      category: cleanNodeData.category || 'inspiration',
      content: cleanNodeData.content || null,
      ai_prompt: cleanNodeData.aiPrompt || null,
      ai_generated_content: cleanNodeData.aiGeneratedContent || null,
      user_note: cleanNodeData.userNote || null,
      tags: cleanNodeData.tags || [],
      style: cleanNodeData.style || null,
      brand_references: cleanNodeData.brandReferences || null,
      cultural_elements: cleanNodeData.culturalElements || null,
      ai_results: cleanNodeData.aiResults || null,
      position: cleanNodeData.position || null,
      version: 1,
      history: [{
        version: 1,
        timestamp: now,
        action: 'create',
        changes: ['创建节点'],
      }],
    };

    console.log('[InspirationMindMapService] Adding node to map:', mapId);
    const { data, error } = await supabase
      .from('inspiration_nodes')
      .insert(nodeDbData)
      .select()
      .single();

    if (error) {
      console.error('[InspirationMindMapService] 添加节点失败:', error);
      throw new Error(`添加节点失败: ${error.message}`);
    }

    console.log('[InspirationMindMapService] Node added:', data?.id);
    return this.mapDbToNode(data);
  }

  /**
   * 更新节点
   */
  async updateNode(
    nodeId: string,
    updates: Partial<MindNode>
  ): Promise<MindNode> {
    // 先获取当前节点
    const { data: currentNode, error: fetchError } = await supabase
      .from('inspiration_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (fetchError) {
      console.error('获取节点失败:', fetchError);
      throw new Error(`节点不存在: ${fetchError.message}`);
    }

    const dbUpdates: any = {};
    
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.aiPrompt !== undefined) dbUpdates.ai_prompt = updates.aiPrompt;
    if (updates.aiGeneratedContent !== undefined) dbUpdates.ai_generated_content = updates.aiGeneratedContent;
    if (updates.userNote !== undefined) dbUpdates.user_note = updates.userNote;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.style !== undefined) dbUpdates.style = updates.style;
    if (updates.brandReferences !== undefined) dbUpdates.brand_references = updates.brandReferences;
    if (updates.culturalElements !== undefined) dbUpdates.cultural_elements = updates.culturalElements;
    if (updates.aiResults !== undefined) dbUpdates.ai_results = updates.aiResults;
    if (updates.position !== undefined) dbUpdates.position = updates.position;

    // 更新版本和历史
    const newVersion = (currentNode.version || 1) + 1;
    dbUpdates.version = newVersion;
    dbUpdates.history = [
      ...(currentNode.history || []),
      {
        version: newVersion,
        timestamp: new Date().toISOString(),
        action: 'edit',
        changes: Object.keys(updates),
      },
    ];

    const { data, error } = await supabase
      .from('inspiration_nodes')
      .update(dbUpdates)
      .eq('id', nodeId)
      .select()
      .single();

    if (error) {
      console.error('更新节点失败:', error);
      throw new Error(`更新节点失败: ${error.message}`);
    }

    return this.mapDbToNode(data);
  }

  /**
   * 删除节点
   */
  async deleteNode(nodeId: string): Promise<void> {
    // 删除节点及其子节点
    const { error } = await supabase
      .from('inspiration_nodes')
      .delete()
      .or(`id.eq.${nodeId},parent_id.eq.${nodeId}`);

    if (error) {
      console.error('删除节点失败:', error);
      throw new Error(`删除节点失败: ${error.message}`);
    }
  }

  /**
   * 复制节点
   */
  async duplicateNode(nodeId: string): Promise<MindNode> {
    // 获取源节点
    const { data: sourceNode, error: fetchError } = await supabase
      .from('inspiration_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (fetchError) {
      console.error('获取源节点失败:', fetchError);
      throw new Error(`节点不存在: ${fetchError.message}`);
    }

    const duplicatedData: Partial<MindNode> = {
      title: `${sourceNode.title} (复制)`,
      description: sourceNode.description,
      category: sourceNode.category,
      content: sourceNode.content,
      aiPrompt: sourceNode.ai_prompt,
      aiGeneratedContent: sourceNode.ai_generated_content,
      userNote: sourceNode.user_note,
      tags: sourceNode.tags,
      style: sourceNode.style,
      brandReferences: sourceNode.brand_references,
      culturalElements: sourceNode.cultural_elements,
      aiResults: sourceNode.ai_results,
    };

    return this.addNode(sourceNode.map_id, duplicatedData, sourceNode.parent_id);
  }

  // ============================================
  // 布局计算
  // ============================================

  /**
   * 计算节点布局
   */
  calculateLayout(
    nodes: MindNode[],
    layoutType: LayoutType = 'timeline'
  ): NodePosition[] {
    // 只使用时间线布局
    return this.calculateTimelineLayout(nodes);
  }

  /**
   * 时间轴布局
   */
  private calculateTimelineLayout(nodes: MindNode[]): NodePosition[] {
    console.log('[calculateTimelineLayout] Input nodes:', nodes.length, nodes.map(n => ({ id: n.id, createdAt: n.createdAt })));
    
    // 按创建时间排序
    const sortedNodes = [...nodes].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    const positions: NodePosition[] = [];
    // 三行交错布局参数 - 匹配紧凑节点尺寸
    const itemWidth = 200; // 节点宽度 + 间距
    const itemHeight = 120; // 行高（紧凑）
    const rowCount = 3; // 三行

    sortedNodes.forEach((node, index) => {
      // 计算行和列
      const row = index % rowCount; // 0, 1, 2 循环
      const col = Math.floor(index / rowCount);
      
      positions.push({
        nodeId: node.id,
        x: col * itemWidth,
        y: row * itemHeight,
        level: row,
      });

      // 为每个节点（除了第一个）设置前一个节点作为父节点，以便绘制连接线
      if (index > 0) {
        const prevNode = sortedNodes[index - 1];
        (node as any).parentId = prevNode.id;
      }
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
    // 获取节点信息
    const { data: node, error: nodeError } = await supabase
      .from('inspiration_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      console.error('获取节点失败:', nodeError);
      throw new Error(`节点不存在: ${nodeError.message}`);
    }

    // 获取脉络信息
    const { data: mindMap, error: mapError } = await supabase
      .from('inspiration_mindmaps')
      .select('*')
      .eq('id', node.map_id)
      .single();

    if (mapError) {
      console.error('获取脉络失败:', mapError);
    }

    // 构建提示词
    const prompt = this.buildSuggestionPrompt(
      this.mapDbToNode(node),
      mindMap ? this.mapDbToMindMap(mindMap) : null,
      type
    );

    // 调用AI服务
    try {
      const response = await llmService.generateText(prompt);
      
      const suggestion: AISuggestion = {
        id: `suggestion-${Date.now()}`,
        type,
        content: response.content,
        prompt,
        confidence: 0.85,
        timestamp: Date.now(),
      };

      // 保存到数据库
      await supabase.from('inspiration_ai_suggestions').insert({
        node_id: nodeId,
        type,
        content: suggestion.content,
        prompt,
        confidence: suggestion.confidence,
      });

      return suggestion;
    } catch (error) {
      console.error('AI建议生成失败:', error);
      // 如果AI服务失败，返回默认建议
      return this.getDefaultSuggestion(type);
    }
  }

  /**
   * 获取节点的AI建议历史
   */
  async getNodeAISuggestions(nodeId: string): Promise<AISuggestion[]> {
    const { data, error } = await supabase
      .from('inspiration_ai_suggestions')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取AI建议失败:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      content: item.content,
      prompt: item.prompt,
      confidence: item.confidence,
      timestamp: new Date(item.created_at).getTime(),
    }));
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

    const now = new Date().toISOString();
    const nowTimestamp = Date.now();

    // 构建故事内容
    const storyContent = this.buildStoryContent(mindMap);

    // 提取关键转折点
    const keyTurningPoints: TurningPoint[] = mindMap.nodes
      .filter(n => n.category === 'ai_generate' || n.category === 'culture')
      .map(n => ({
        nodeId: n.id,
        description: n.title,
        timestamp: new Date(n.createdAt).toISOString(),
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
        timestamp: new Date(node.createdAt).toISOString(),
        nodeIds: [node.id],
      }));

    // 计算统计
    const stats: StoryStats = {
      totalDuration: nowTimestamp - mindMap.createdAt,
      inspirationCount: mindMap.nodes.filter(n => n.category === 'inspiration').length,
      aiInteractionCount: mindMap.nodes.filter(n => n.category === 'ai_generate').length,
      iterationCount: mindMap.nodes.reduce((sum, n) => sum + (n.version || 1), 0),
    };

    const story: CreationStory = {
      id: `story-${nowTimestamp}`,
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
      generatedAt: nowTimestamp,
    };

    // 保存到数据库
    await supabase.from('inspiration_stories').insert({
      map_id: mapId,
      title: story.title,
      subtitle: story.subtitle,
      full_story: story.fullStory,
      key_turning_points: story.keyTurningPoints,
      culture_elements: story.cultureElements,
      timeline: story.timeline,
      stats: story.stats,
      themes: story.themes,
      participants: story.participants,
    });

    return story;
  }

  /**
   * 获取脉络的创作故事
   */
  async getCreationStory(mapId: string): Promise<CreationStory | null> {
    const { data, error } = await supabase
      .from('inspiration_stories')
      .select('*')
      .eq('map_id', mapId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('获取创作故事失败:', error);
      return null;
    }

    return {
      id: data.id,
      mapId: data.map_id,
      title: data.title,
      subtitle: data.subtitle,
      fullStory: data.full_story,
      keyTurningPoints: data.key_turning_points || [],
      cultureElements: data.culture_elements || [],
      timeline: data.timeline || [],
      stats: data.stats,
      themes: data.themes || [],
      participants: data.participants || [],
      generatedAt: new Date(data.generated_at).getTime(),
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
  // 数据映射方法
  // ============================================

  /**
   * 将数据库记录映射为 CreationMindMap
   */
  private mapDbToMindMap(data: any): CreationMindMap {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description || '',
      nodes: [], // 需要单独加载
      layoutType: data.layout_type || 'timeline',
      settings: data.settings || {
        layoutType: 'timeline',
        theme: 'tianjin',
        autoSave: true,
        showGrid: true,
        snapToGrid: false,
        gridSize: 20,
      },
      stats: {
        totalNodes: data.stats?.totalNodes || 0,
        maxDepth: data.stats?.maxDepth || 0,
        aiGeneratedNodes: data.stats?.aiGeneratedNodes || 0,
        cultureNodes: data.stats?.cultureNodes || 0,
        lastActivityAt: data.stats?.lastActivityAt || new Date(data.updated_at).getTime(),
      },
      tags: data.tags || [],
      isPublic: data.is_public || false,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }

  /**
   * 将数据库记录映射为 MindNode
   */
  private mapDbToNode(data: any): MindNode {
    return {
      id: data.id,
      mapId: data.map_id,
      parentId: data.parent_id,
      title: data.title,
      description: data.description || '',
      category: data.category || 'inspiration',
      content: data.content,
      aiPrompt: data.ai_prompt,
      aiGeneratedContent: data.ai_generated_content,
      userNote: data.user_note,
      tags: data.tags || [],
      style: data.style,
      brandReferences: data.brand_references,
      culturalElements: data.cultural_elements,
      aiResults: data.ai_results,
      position: data.position,
      version: data.version || 1,
      history: data.history || [],
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }
}

// 导出服务实例
export const inspirationMindMapService = InspirationMindMapService.getInstance();

export default inspirationMindMapService;
