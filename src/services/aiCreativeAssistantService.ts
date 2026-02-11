// AI创意助手服务，用于生成创意建议
import { llmService } from './llmService';

// 创意建议类型定义
export interface CreativeSuggestion {
  id: string;
  type: 'theme' | 'style' | 'color' | 'element' | 'layout' | 'concept';
  content: string;
  description: string;
  tags: string[];
  relevance: number; // 0-100，相关性评分
  createdAt: Date;
}

// 创意方向类型定义
export interface CreativeDirection {
  id: string;
  name: string;
  description: string;
  examples: string[];
  tags: string[];
}

// AI创意助手服务类
class AICreativeAssistantService {
  private nextSuggestionId = 1;
  private nextDirectionId = 1;
  private creativeDirections: CreativeDirection[] = [];

  constructor() {
    this.initCreativeDirections();
  }

  // 初始化创意方向
  private initCreativeDirections(): void {
    this.creativeDirections = [
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '国潮融合',
        description: '将传统中国元素与现代潮流设计相结合',
        examples: [
          '将青花瓷纹样与街头潮流服饰结合',
          '用中国传统色彩搭配现代UI设计',
          '将书法艺术融入数字媒体设计',
          '传统纹样与现代插画风格融合',
          '中国传统节日元素的现代演绎'
        ],
        tags: ['国潮', '传统', '现代', '融合', '时尚']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '文化传承',
        description: '传承和弘扬中国传统文化元素',
        examples: [
          '基于非物质文化遗产的创意设计',
          '传统工艺的现代应用',
          '文化符号的创新表达',
          '传统故事的现代视觉化呈现',
          '传统技艺的数字化保存与传播'
        ],
        tags: ['文化', '传承', '传统', '创新', '非遗']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '科技未来',
        description: '融合科技元素，展现未来感和科技感',
        examples: [
          'AI生成艺术与传统设计结合',
          '元宇宙概念设计',
          '数字化传统文化表达',
          'AR/VR技术在文化展示中的应用',
          'AI辅助创意生成与设计'
        ],
        tags: ['科技', '未来', 'AI', '数字化', 'AR/VR']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '生态环保',
        description: '以生态环保为主题，倡导可持续发展',
        examples: [
          '环保材料的创意应用',
          '生态主题的视觉设计',
          '可持续发展理念的创意表达',
          '自然元素与现代设计结合',
          '环保主题的互动装置设计'
        ],
        tags: ['环保', '生态', '可持续', '绿色', '自然']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '地域特色',
        description: '突出地域文化特色，展现地方魅力',
        examples: [
          '天津杨柳青年画风格设计',
          '苏州园林元素应用',
          '敦煌壁画艺术创新',
          '北京胡同文化的现代设计',
          '四川巴蜀文化的创意表达'
        ],
        tags: ['地域', '特色', '地方', '文化', '民俗']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '极简主义',
        description: '以简洁、纯净的设计语言表达核心概念',
        examples: [
          '传统元素的极简抽象表达',
          '留白艺术在现代设计中的应用',
          '简约风格的文化创意产品',
          '少即是多的设计理念实践',
          '简洁线条与传统色彩的结合'
        ],
        tags: ['极简', '简约', '抽象', '纯净', '留白']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '叙事设计',
        description: '通过设计讲述故事，传达情感和理念',
        examples: [
          '传统故事的视觉叙事设计',
          '文化主题的系列化设计',
          '情感化设计与文化元素结合',
          '交互式叙事设计',
          '沉浸式体验设计'
        ],
        tags: ['叙事', '故事', '情感', '系列', '互动']
      }
    ];
  }

  // 生成创意建议
  generateCreativeSuggestions(prompt: string, count: number = 5): CreativeSuggestion[] {
    // 生成更智能的创意建议，基于提示词内容进行更精准的匹配
    const suggestions: CreativeSuggestion[] = [];
    const types: Array<'theme' | 'style' | 'color' | 'element' | 'layout' | 'concept'> = ['theme', 'style', 'color', 'element', 'layout', 'concept'];
    const tags = this.extractTags(prompt);
    
    // 根据提示词内容调整建议类型的权重
    const weightedTypes = this.getWeightedTypes(prompt, types);

    for (let i = 0; i < count; i++) {
      // 从加权类型中随机选择，确保建议类型的多样性
      const randomIndex = Math.floor(Math.random() * weightedTypes.length);
      const type = weightedTypes[randomIndex];
      const suggestion = this.generateSuggestionByType(type, prompt, tags);
      suggestions.push(suggestion);
    }

    // 根据相关性评分排序
    return suggestions.sort((a, b) => b.relevance - a.relevance);
  }
  
  // 根据提示词内容调整建议类型的权重
  private getWeightedTypes(prompt: string, types: Array<CreativeSuggestion['type']>): Array<CreativeSuggestion['type']> {
    // 创建类型权重映射
    const typeWeights: Record<CreativeSuggestion['type'], number> = {
      theme: 1,
      style: 1,
      color: 1,
      element: 1,
      layout: 1,
      concept: 1
    };
    
    // 根据提示词内容调整权重
    const lowerPrompt = prompt.toLowerCase();
    
    // 如果提示词包含与主题相关的关键词，增加主题建议的权重
    if (lowerPrompt.includes('主题') || lowerPrompt.includes('idea') || lowerPrompt.includes('concept')) {
      typeWeights.theme = 2;
    }
    
    // 如果提示词包含与风格相关的关键词，增加风格建议的权重
    if (lowerPrompt.includes('风格') || lowerPrompt.includes('style') || lowerPrompt.includes('design')) {
      typeWeights.style = 2;
    }
    
    // 如果提示词包含与色彩相关的关键词，增加色彩建议的权重
    if (lowerPrompt.includes('色彩') || lowerPrompt.includes('color') || lowerPrompt.includes('配色')) {
      typeWeights.color = 2;
    }
    
    // 如果提示词包含与元素相关的关键词，增加元素建议的权重
    if (lowerPrompt.includes('元素') || lowerPrompt.includes('element') || lowerPrompt.includes('component')) {
      typeWeights.element = 2;
    }
    
    // 如果提示词包含与布局相关的关键词，增加布局建议的权重
    if (lowerPrompt.includes('布局') || lowerPrompt.includes('layout') || lowerPrompt.includes('structure')) {
      typeWeights.layout = 2;
    }
    
    // 如果提示词包含与概念相关的关键词，增加概念建议的权重
    if (lowerPrompt.includes('概念') || lowerPrompt.includes('concept') || lowerPrompt.includes('idea')) {
      typeWeights.concept = 2;
    }
    
    // 生成加权类型数组
    const weightedTypes: Array<CreativeSuggestion['type']> = [];
    for (const type of types) {
      for (let i = 0; i < typeWeights[type]; i++) {
        weightedTypes.push(type);
      }
    }
    
    return weightedTypes;
  }

  // 根据类型生成创意建议
  private generateSuggestionByType(type: CreativeSuggestion['type'], prompt: string, tags: string[]): CreativeSuggestion {
    // 为不同类型的建议添加更丰富的基础建议
    const baseSuggestions: Record<CreativeSuggestion['type'], string[]> = {
      theme: [
        '将传统节日元素与现代设计结合',
        '以自然景观为灵感的创意设计',
        '融合不同文化元素的跨界设计',
        '以历史故事为主题的创意表达',
        '关注社会热点的创意设计',
        '以科技未来为主题的创意探索',
        '围绕环保可持续发展的创意设计',
        '突出地域文化特色的创意表达',
        '以人文情感为核心的创意设计',
        '结合艺术与科技的创新设计',
        '以非遗文化传承为主题的设计',
        '融合多元文化元素的创意表达',
        '以数字化转型为主题的设计',
        '以健康生活为主题的设计',
        '以教育科普为主题的设计'
      ],
      style: [
        '尝试使用扁平化设计风格',
        '采用渐变色彩和玻璃拟态效果',
        '结合手绘风格和数字艺术',
        '使用极简主义设计语言',
        '尝试复古风格与现代元素结合',
        '采用未来主义设计风格',
        '运用波普艺术风格进行创作',
        '尝试新艺术运动风格设计',
        '使用几何抽象风格进行创作',
        '结合东方美学与西方设计风格',
        '采用新中式设计风格',
        '运用蒸汽朋克风格元素',
        '尝试赛博朋克风格设计',
        '使用孟菲斯风格的大胆配色',
        '尝试像素艺术风格'
      ],
      color: [
        '使用中国传统色彩配色方案',
        '尝试对比色搭配增强视觉冲击力',
        '使用渐变色营造层次感',
        '采用单色调设计突出主题',
        '使用柔和色调营造温馨氛围',
        '尝试互补色搭配创造视觉张力',
        '使用类似色搭配营造和谐感',
        '采用低饱和度色彩方案',
        '使用高对比度色彩增强可读性',
        '结合地域特色色彩进行设计',
        '使用季节色彩搭配方案',
        '尝试冷暖色调对比',
        '使用金色和黑色的奢华配色',
        '采用马卡龙色系营造甜美感',
        '使用莫兰迪色系营造高级感'
      ],
      element: [
        '融入传统纹样元素',
        '添加动态效果增强交互性',
        '使用几何图形构建视觉层次',
        '添加纹理效果增强质感',
        '使用文字作为设计元素',
        '融入自然元素增强亲和力',
        '添加科技感元素突出未来感',
        '使用符号化元素传达核心概念',
        '结合3D元素增强立体感',
        '添加动态交互元素提升用户体验',
        '融入传统书法元素',
        '添加粒子效果增强视觉冲击力',
        '使用光影效果营造氛围',
        '融入民俗文化符号',
        '添加AR/VR交互元素'
      ],
      layout: [
        '尝试非对称布局设计',
        '使用网格系统构建秩序感',
        '采用分层设计增强立体感',
        '使用留白营造呼吸感',
        '尝试动态布局设计',
        '采用黄金比例布局增强美感',
        '使用居中布局突出核心内容',
        '尝试卡片式布局提升可读性',
        '采用瀑布流布局展示内容',
        '使用响应式布局适配不同设备',
        '尝试沉浸式全景布局',
        '采用模块化布局设计',
        '使用流体布局增强动感',
        '尝试分层视差滚动布局',
        '采用对比式布局设计'
      ],
      concept: [
        '以故事性为核心的设计',
        '强调情感共鸣的创意表达',
        '采用隐喻和象征手法',
        '关注用户体验的设计',
        '尝试跨学科融合的创意',
        '以问题解决为导向的设计',
        '强调可持续发展的设计理念',
        '采用以人为本的设计思路',
        '尝试沉浸式体验设计',
        '结合传统文化与现代科技的创意',
        '以数字化叙事为核心的设计',
        '强调互动参与的设计理念',
        '采用开放式结局的设计思路',
        '以社会责任感为核心的设计',
        '尝试跨界融合的创新设计'
      ]
    };

    // 根据提示词内容选择更相关的建议
    const relevantSuggestions = this.filterRelevantSuggestions(baseSuggestions[type], prompt);
    // 如果没有相关建议，从所有建议中随机选择
    const availableSuggestions = relevantSuggestions.length > 0 ? relevantSuggestions : baseSuggestions[type];
    const content = availableSuggestions[Math.floor(Math.random() * availableSuggestions.length)];
    const description = this.generateDescription(type, content);
    
    // 生成更精准的相关性评分
    const relevance = this.calculateRelevance(content, prompt);

    // 为建议添加更相关的标签
    const enhancedTags = this.enhanceSuggestionTags(type, content, tags);

    return {
      id: `suggestion-${this.nextSuggestionId++}`,
      type,
      content,
      description,
      tags: enhancedTags,
      relevance,
      createdAt: new Date()
    };
  }
  
  // 过滤与提示词相关的建议
  private filterRelevantSuggestions(suggestions: string[], prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const relevant: string[] = [];
    const general: string[] = [];
    
    // 关键词匹配，将建议分为相关和一般两类
    suggestions.forEach(suggestion => {
      const lowerSuggestion = suggestion.toLowerCase();
      if (this.isSuggestionRelevant(lowerSuggestion, lowerPrompt)) {
        relevant.push(suggestion);
      } else {
        general.push(suggestion);
      }
    });
    
    // 如果有相关建议，优先返回相关建议；否则返回所有建议
    return relevant.length > 0 ? relevant : suggestions;
  }
  
  // 检查建议是否与提示词相关
  private isSuggestionRelevant(suggestion: string, prompt: string): boolean {
    // 定义相关关键词
    const relevantKeywords = {
      '传统': ['传统', '非遗', '文化', '历史', '经典'],
      '现代': ['现代', '潮流', '时尚', '当代', '前卫'],
      '科技': ['科技', 'AI', '智能', '数字', '未来'],
      '自然': ['自然', '环保', '生态', '绿色', '可持续'],
      '艺术': ['艺术', '设计', '创意', '美学', '视觉'],
      '地域': ['地域', '地方', '特色', '本土', '民族']
    };
    
    // 检查建议是否包含与提示词相关的关键词
    for (const [category, keywords] of Object.entries(relevantKeywords)) {
      if (prompt.includes(category) && keywords.some(keyword => suggestion.includes(keyword))) {
        return true;
      }
    }
    
    return false;
  }
  
  // 计算建议与提示词的相关性评分
  private calculateRelevance(suggestion: string, prompt: string): number {
    const lowerSuggestion = suggestion.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();
    let baseScore = 70;
    
    // 如果建议包含提示词中的关键词，增加相关性评分
    const promptWords = lowerPrompt.split(/\s+/).filter(word => word.length > 1);
    promptWords.forEach(word => {
      if (lowerSuggestion.includes(word)) {
        baseScore += 5;
      }
    });
    
    // 根据建议类型调整相关性评分
    if (lowerSuggestion.includes('传统') && lowerPrompt.includes('传统')) {
      baseScore += 3;
    }
    if (lowerSuggestion.includes('现代') && lowerPrompt.includes('现代')) {
      baseScore += 3;
    }
    if (lowerSuggestion.includes('科技') && lowerPrompt.includes('科技')) {
      baseScore += 3;
    }
    if (lowerSuggestion.includes('自然') && lowerPrompt.includes('自然')) {
      baseScore += 3;
    }
    if (lowerSuggestion.includes('艺术') && lowerPrompt.includes('艺术')) {
      baseScore += 3;
    }
    if (lowerSuggestion.includes('地域') && lowerPrompt.includes('地域')) {
      baseScore += 3;
    }
    
    // 确保相关性评分在70-100之间
    return Math.min(100, baseScore);
  }

  // 生成建议描述
  private generateDescription(type: CreativeSuggestion['type'], content: string): string {
    const descriptions: Record<CreativeSuggestion['type'], string[]> = {
      theme: [
        '这个主题可以帮助你更好地表达设计理念',
        '尝试从这个角度出发，可能会有新的灵感',
        '这个主题适合当前的设计需求',
        '这个主题可以吸引目标受众的注意力',
        '尝试将这个主题与你的设计结合'
      ],
      style: [
        '这种风格可以增强设计的视觉效果',
        '尝试使用这种风格，可能会有意外的效果',
        '这种风格适合当前的设计主题',
        '这种风格可以提升设计的专业感',
        '尝试将这种风格与其他元素结合'
      ],
      color: [
        '这种配色方案可以营造特定的氛围',
        '尝试使用这种配色，可能会增强视觉冲击力',
        '这种配色适合当前的设计主题',
        '这种配色可以提升设计的美感',
        '尝试将这种配色与其他设计元素结合'
      ],
      element: [
        '添加这个元素可以增强设计的层次感',
        '尝试使用这个元素，可能会丰富设计内容',
        '这个元素适合当前的设计风格',
        '这个元素可以提升设计的独特性',
        '尝试将这个元素与其他元素结合'
      ],
      layout: [
        '这种布局可以增强设计的可读性',
        '尝试使用这种布局，可能会提升用户体验',
        '这种布局适合当前的设计内容',
        '这种布局可以增强设计的视觉引导',
        '尝试将这种布局与其他设计元素结合'
      ],
      concept: [
        '这个概念可以帮助你更好地表达设计思想',
        '尝试从这个概念出发，可能会有新的创意方向',
        '这个概念适合当前的设计目标',
        '这个概念可以提升设计的深度',
        '尝试将这个概念与其他设计元素结合'
      ]
    };

    return descriptions[type][Math.floor(Math.random() * descriptions[type].length)];
  }

  // 从提示词中提取标签
  private extractTags(prompt: string): string[] {
    // 扩展的标签提取算法
    const commonTags = [
      '国潮', '传统', '现代', '文化', '创意', '设计', '艺术', '科技', '环保', '地域',
      '非遗', '时尚', '未来', '融合', '创新', '自然', '故事', '情感', '互动', '简约'
    ];
    const extractedTags: string[] = [];

    commonTags.forEach(tag => {
      if (prompt.includes(tag)) {
        extractedTags.push(tag);
      }
    });

    // 如果没有提取到标签，返回默认标签
    if (extractedTags.length === 0) {
      return ['创意', '设计'];
    }

    return extractedTags;
  }

  // 增强建议标签
  private enhanceSuggestionTags(type: CreativeSuggestion['type'], content: string, originalTags: string[]): string[] {
    // 类型相关标签
    const typeTags: Record<CreativeSuggestion['type'], string[]> = {
      theme: ['主题', '核心', '概念'],
      style: ['风格', '视觉', '美学'],
      color: ['色彩', '配色', '色调'],
      element: ['元素', '组件', '细节'],
      layout: ['布局', '结构', '排版'],
      concept: ['创意', '理念', '思路']
    };

    // 内容相关标签
    const contentTags: string[] = [];
    const lowerContent = content.toLowerCase();

    // 根据内容关键词添加标签
    if (lowerContent.includes('传统')) contentTags.push('传统');
    if (lowerContent.includes('现代')) contentTags.push('现代');
    if (lowerContent.includes('科技')) contentTags.push('科技');
    if (lowerContent.includes('环保')) contentTags.push('环保');
    if (lowerContent.includes('地域')) contentTags.push('地域');
    if (lowerContent.includes('国潮')) contentTags.push('国潮');
    if (lowerContent.includes('简约')) contentTags.push('简约');
    if (lowerContent.includes('创新')) contentTags.push('创新');
    if (lowerContent.includes('融合')) contentTags.push('融合');
    if (lowerContent.includes('互动')) contentTags.push('互动');
    if (lowerContent.includes('故事')) contentTags.push('故事');
    if (lowerContent.includes('情感')) contentTags.push('情感');

    // 合并所有标签，去重并限制数量
    const allTags = [...originalTags, ...typeTags[type], ...contentTags];
    const uniqueTags = [...new Set(allTags)];
    
    // 限制标签数量，确保最相关的标签在前
    return uniqueTags.slice(0, 8);
  }

  // 获取创意方向列表
  getCreativeDirections(): CreativeDirection[] {
    return [...this.creativeDirections];
  }

  // 根据ID获取创意方向
  getCreativeDirectionById(id: string): CreativeDirection | undefined {
    return this.creativeDirections.find(direction => direction.id === id);
  }

  // 根据标签获取创意方向
  getCreativeDirectionsByTag(tag: string): CreativeDirection[] {
    return this.creativeDirections.filter(direction => direction.tags.includes(tag));
  }

  // 搜索创意方向
  searchCreativeDirections(query: string): CreativeDirection[] {
    const lowerQuery = query.toLowerCase();
    return this.creativeDirections.filter(direction => 
      direction.name.toLowerCase().includes(lowerQuery) ||
      direction.description.toLowerCase().includes(lowerQuery) ||
      direction.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // 生成创意方案
  async generateCreativePlan(prompt: string, direction: string): Promise<string> {
    // 获取创意方向对象
    const directionObj = this.getCreativeDirectionById(direction);
    const directionName = directionObj?.name || '通用';
    
    // 构建AI提示词
    const aiPrompt = `请基于以下创作提示和创意方向，生成一个详细的创意设计方案：

创作提示：${prompt}
创意方向：${directionName}
方向描述：${directionObj?.description || ''}

请按照以下结构生成创意方案：
1. 创意方向 - 包含方向名称、描述、核心概念和相关标签
2. 设计建议 - 具体的设计思路和建议
3. 预期效果 - 实施后的预期效果
4. 实施步骤 - 具体的实施步骤
5. 资源建议 - 需要的资源和工具
6. 优化建议 - 后续优化的方向

请确保方案详细、具体、可实施，并且符合创意方向的要求。`;
    
    try {
      // 调用AI API生成创意方案
      const result = await llmService.directGenerateResponse(aiPrompt);
      return result;
    } catch (error) {
      console.error('生成创意方案失败:', error);
      // 生成失败时，返回本地生成的方案作为备选
      return this.generateLocalCreativePlan(prompt, direction);
    }
  }
  
  // 本地生成创意方案的备选方法
  private generateLocalCreativePlan(prompt: string, direction: string): string {
    // 生成更详细、更相关的创意方案
    const directionObj = this.getCreativeDirectionById(direction);
    const examples = directionObj?.examples || [];
    const example = examples[Math.floor(Math.random() * examples.length)];
    
    // 根据创意方向和提示词生成更具体的设计建议
    const designSuggestions = this.generateDesignSuggestions(prompt, directionObj?.name || '通用');
    
    // 根据设计建议生成预期效果
    const expectedEffects = this.generateExpectedEffects(designSuggestions);
    
    // 生成实施步骤
    const implementationSteps = this.generateImplementationSteps();
    
    // 生成资源建议
    const resourceSuggestions = this.generateResourceSuggestions(prompt, directionObj?.name || '通用');

    return `基于"${prompt}"的创意方案：

1. 创意方向：${directionObj?.name || '通用'}
   - 方向描述：${directionObj?.description || ''}
   - 核心概念：${example}
   - 相关标签：${directionObj?.tags.join('、') || ''}

2. 设计建议：
${designSuggestions.map((suggestion, index) => `   ${index + 1}. ${suggestion}`).join('\n')}

3. 预期效果：
${expectedEffects.map((effect, index) => `   ${index + 1}. ${effect}`).join('\n')}

4. 实施步骤：
${implementationSteps.map((step, index) => `   ${index + 1}. ${step}`).join('\n')}

5. 资源建议：
${resourceSuggestions.map((resource, index) => `   ${index + 1}. ${resource}`).join('\n')}

6. 优化建议：
   - 可以尝试多种设计方案，从中选择最适合的一种进行深入开发
   - 结合用户反馈不断优化设计方案
   - 考虑不同平台和设备的适配需求
   - 关注设计的可实现性和成本效益
   - 保持品牌一致性和文化传承性

建议：在实施过程中，保持开放的心态，勇于尝试新的创意和技术，同时注重设计的核心价值和用户体验。`;
  }
  
  // 生成设计建议
  private generateDesignSuggestions(prompt: string, direction: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const lowerDirection = direction.toLowerCase();
    
    // 基础设计建议
    const baseSuggestions = [
      '尝试将传统元素与现代设计结合',
      '使用鲜明的色彩对比增强视觉效果',
      '添加动态元素提升交互体验',
      '注重用户体验和情感共鸣'
    ];
    
    // 根据方向和提示词添加特定建议
    if (lowerDirection.includes('国潮') || lowerPrompt.includes('国潮')) {
      baseSuggestions.push('融入中国传统纹样和符号元素');
      baseSuggestions.push('使用中国传统色彩配色方案');
      baseSuggestions.push('结合中国传统工艺和现代技术');
    }
    
    if (lowerDirection.includes('文化传承') || lowerPrompt.includes('文化')) {
      baseSuggestions.push('深入研究传统文化元素的内涵和意义');
      baseSuggestions.push('尊重文化元素的原有语境和价值');
      baseSuggestions.push('创新文化元素的表达方式和应用场景');
    }
    
    if (lowerDirection.includes('科技未来') || lowerPrompt.includes('科技')) {
      baseSuggestions.push('运用AI生成技术辅助创意设计');
      baseSuggestions.push('添加AR/VR元素增强沉浸感');
      baseSuggestions.push('采用未来主义设计语言和视觉元素');
    }
    
    if (lowerDirection.includes('生态环保') || lowerPrompt.includes('环保')) {
      baseSuggestions.push('使用环保材料和可持续设计理念');
      baseSuggestions.push('融入自然元素和生态主题');
      baseSuggestions.push('传达环保理念和社会责任');
    }
    
    if (lowerDirection.includes('地域特色') || lowerPrompt.includes('地域')) {
      baseSuggestions.push('突出地方文化特色和地域优势');
      baseSuggestions.push('结合当地传统工艺和材料');
      baseSuggestions.push('关注地方用户的需求和偏好');
    }
    
    // 随机选择5-7条建议
    const randomCount = Math.floor(Math.random() * 3) + 5;
    const shuffled = baseSuggestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, randomCount);
  }
  
  // 生成预期效果
  private generateExpectedEffects(designSuggestions: string[]): string[] {
    const effects: string[] = [];
    
    // 根据设计建议生成相应的预期效果
    if (designSuggestions.some(s => s.includes('传统') && s.includes('现代'))) {
      effects.push('突出传统与现代的融合，展现独特的设计风格');
    }
    
    if (designSuggestions.some(s => s.includes('色彩'))) {
      effects.push('通过色彩搭配营造特定的氛围和情感');
    }
    
    if (designSuggestions.some(s => s.includes('动态'))) {
      effects.push('提升用户参与度和交互体验');
    }
    
    if (designSuggestions.some(s => s.includes('用户体验'))) {
      effects.push('增强用户满意度和品牌忠诚度');
    }
    
    if (designSuggestions.some(s => s.includes('AI') || s.includes('科技'))) {
      effects.push('展现品牌的创新能力和科技实力');
    }
    
    if (designSuggestions.some(s => s.includes('环保'))) {
      effects.push('传达品牌的社会责任感和环保理念');
    }
    
    // 添加基础预期效果
    effects.push('突出主题，吸引目标受众的注意力');
    effects.push('传达清晰的设计理念和核心价值');
    effects.push('达到预期的设计目标和业务需求');
    
    return effects;
  }
  
  // 生成实施步骤
  private generateImplementationSteps(): string[] {
    return [
      '进行市场调研和用户需求分析',
      '确定设计目标和核心概念',
      '收集相关参考资料和灵感',
      '进行草图设计和概念验证',
      '制作详细设计方案和原型',
      '进行用户测试和反馈收集',
      '根据反馈优化设计方案',
      '最终定稿和实施'
    ];
  }
  
  // 生成资源建议
  private generateResourceSuggestions(prompt: string, direction: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const lowerDirection = direction.toLowerCase();
    
    // 基础资源建议
    const baseResources = [
      '设计软件：Adobe Creative Suite、Figma、Sketch等',
      '素材资源：Unsplash、Pexels、Freepik等',
      'AI生成工具：MidJourney、DALL-E、Stable Diffusion等',
      '参考资料：设计书籍、行业报告、优秀案例等',
      '协作工具：Slack、Trello、Notion等',
      '测试资源：用户测试平台、原型测试工具等'
    ];
    
    // 根据方向和提示词添加特定资源建议
    const specificResources: string[] = [];
    
    if (lowerDirection.includes('国潮') || lowerPrompt.includes('国潮') || lowerPrompt.includes('传统')) {
      specificResources.push('传统素材库：中国传统纹样、书法字体、传统色彩库等');
      specificResources.push('非遗资源平台：非遗文化数据库、传统工艺教程等');
      specificResources.push('国潮设计参考：优秀国潮设计案例、国潮品牌案例集等');
    }
    
    if (lowerDirection.includes('科技未来') || lowerPrompt.includes('科技') || lowerPrompt.includes('未来')) {
      specificResources.push('3D建模工具：Blender、C4D等');
      specificResources.push('AR/VR开发工具：Unity、Unreal Engine等');
      specificResources.push('AI编程资源：TensorFlow、PyTorch等AI框架文档');
    }
    
    if (lowerDirection.includes('生态环保') || lowerPrompt.includes('环保') || lowerPrompt.includes('自然')) {
      specificResources.push('环保素材库：自然元素、环保图标、绿色设计案例等');
      specificResources.push('可持续设计指南：环保材料手册、可持续设计原则等');
      specificResources.push('生态主题参考：自然摄影集、生态艺术作品等');
    }
    
    if (lowerDirection.includes('地域特色') || lowerPrompt.includes('地域') || lowerPrompt.includes('地方')) {
      specificResources.push('地域文化数据库：地方文化资料、地域特色纹样等');
      specificResources.push('民俗文化参考：地方民俗活动、传统节日资料等');
      specificResources.push('地域色彩库：地方特色色彩系统、传统色彩参考等');
    }
    
    if (lowerDirection.includes('叙事设计') || lowerPrompt.includes('故事') || lowerPrompt.includes('叙事')) {
      specificResources.push('故事板工具：Storyboarder、Canva故事板模板等');
      specificResources.push('叙事设计参考：电影分镜、漫画设计、交互叙事案例等');
      specificResources.push('脚本写作工具：Final Draft、Celtx等剧本写作软件');
    }
    
    if (lowerDirection.includes('极简主义') || lowerPrompt.includes('极简') || lowerPrompt.includes('简约')) {
      specificResources.push('极简设计参考：优秀极简设计案例集、极简主义设计书籍等');
      specificResources.push('留白设计指南：留白设计原则、负空间使用技巧等');
      specificResources.push('简约字体库：无衬线字体、简约字体集等');
    }
    
    // 合并基础资源和特定资源，去重并限制数量
    const allResources = [...specificResources, ...baseResources];
    const uniqueResources = [...new Set(allResources)];
    
    return uniqueResources.slice(0, 8);
  }
}

// 创建单例实例
const aiCreativeAssistantService = new AICreativeAssistantService();

export { aiCreativeAssistantService };
export default aiCreativeAssistantService;