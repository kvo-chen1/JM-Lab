// 设计元素推荐服务 - 基于设计方向推荐可增强效果的元素

import { Suggestion, SuggestionType } from '../types/suggestion';
import { llmService } from '@/services/llmService';

// 设计元素分类
export interface DesignElement {
  id: string;
  name: string;
  category: 'visual' | 'atmosphere' | 'technical' | 'composition';
  description: string;
  keywords: string[];
  promptSnippet: string;
  impact: 'high' | 'medium' | 'low';
  suitableFor: string[]; // 适合的设计类型
}

// 设计元素库
const DESIGN_ELEMENTS_LIBRARY: DesignElement[] = [
  // 视觉元素
  {
    id: 'particle-effects',
    name: '粒子特效',
    category: 'visual',
    description: '添加闪烁的粒子效果，增加梦幻感',
    keywords: ['粒子', '闪光', '梦幻', '魔法', '星光'],
    promptSnippet: 'particle effects, sparkles, magical atmosphere',
    impact: 'high',
    suitableFor: ['fantasy', 'magical', 'dreamy', 'sci-fi']
  },
  {
    id: 'glow-effect',
    name: '发光效果',
    category: 'visual',
    description: '柔和的发光效果，突出主体',
    keywords: ['发光', '光晕', '柔和', '温暖', '霓虹'],
    promptSnippet: 'glowing effect, soft rim light, luminous',
    impact: 'high',
    suitableFor: ['character', 'product', 'sci-fi', 'modern']
  },
  {
    id: 'texture-detail',
    name: '纹理细节',
    category: 'visual',
    description: '丰富的表面纹理，增加质感',
    keywords: ['纹理', '质感', '细节', '粗糙', '光滑'],
    promptSnippet: 'rich texture, detailed surface, material realism',
    impact: 'medium',
    suitableFor: ['realistic', 'product', 'character', 'nature']
  },
  {
    id: 'depth-layers',
    name: '景深层次',
    category: 'composition',
    description: '前景、中景、背景的层次感',
    keywords: ['景深', '层次', '前景', '背景', '空间感'],
    promptSnippet: 'depth of field, layered composition, atmospheric perspective',
    impact: 'high',
    suitableFor: ['landscape', 'scene', 'environment', 'illustration']
  },
  {
    id: 'motion-blur',
    name: '动态模糊',
    category: 'visual',
    description: '运动感模糊效果，增加活力',
    keywords: ['动感', '模糊', '速度', '运动', '活力'],
    promptSnippet: 'motion blur, dynamic movement, speed lines',
    impact: 'medium',
    suitableFor: ['action', 'sports', 'dynamic', 'anime']
  },
  
  // 氛围元素
  {
    id: 'volumetric-light',
    name: '体积光',
    category: 'atmosphere',
    description: '光束穿透空气的效果，营造神圣感',
    keywords: ['光束', '神圣', '教堂', '丁达尔', '光线'],
    promptSnippet: 'volumetric lighting, god rays, light beams',
    impact: 'high',
    suitableFor: ['fantasy', 'spiritual', 'dramatic', 'cinematic']
  },
  {
    id: 'mist-atmosphere',
    name: '雾气氛围',
    category: 'atmosphere',
    description: '朦胧的雾气，增加神秘感',
    keywords: ['雾气', '朦胧', '神秘', '梦幻', '柔和'],
    promptSnippet: 'misty atmosphere, fog, haze, ethereal',
    impact: 'medium',
    suitableFor: ['landscape', 'fantasy', 'mysterious', 'dreamy']
  },
  {
    id: 'bokeh-background',
    name: '散景背景',
    category: 'atmosphere',
    description: '美丽的焦外虚化光斑',
    keywords: ['散景', '虚化', '光斑', '背景', '柔和'],
    promptSnippet: 'bokeh background, out of focus lights, soft background',
    impact: 'medium',
    suitableFor: ['portrait', 'product', 'romantic', 'soft']
  },
  
  // 技术元素
  {
    id: 'octane-render',
    name: 'OC渲染',
    category: 'technical',
    description: 'Octane渲染器效果，高质量3D',
    keywords: ['3D', '渲染', 'OC', '高质量', '真实'],
    promptSnippet: 'octane render, 3D render, high quality CGI',
    impact: 'high',
    suitableFor: ['3d', 'product', 'sci-fi', 'realistic']
  },
  {
    id: 'unreal-engine',
    name: '虚幻引擎',
    category: 'technical',
    description: '虚幻引擎5的逼真效果',
    keywords: ['虚幻', 'UE5', '游戏', '逼真', '实时'],
    promptSnippet: 'unreal engine 5, UE5, photorealistic',
    impact: 'high',
    suitableFor: ['3d', 'game', 'environment', 'realistic']
  },
  {
    id: '8k-resolution',
    name: '8K超清',
    category: 'technical',
    description: '超高分辨率，极致细节',
    keywords: ['8K', '高清', '超清', '细节', '分辨率'],
    promptSnippet: '8k resolution, ultra detailed, high resolution',
    impact: 'medium',
    suitableFor: ['all']
  },
  {
    id: 'masterpiece-quality',
    name: '大师品质',
    category: 'technical',
    description: '艺术大师级别的品质',
    keywords: ['大师', '杰作', '精品', '艺术', '顶级'],
    promptSnippet: 'masterpiece, best quality, award winning',
    impact: 'medium',
    suitableFor: ['all']
  },
  
  // 构图元素
  {
    id: 'rule-thirds',
    name: '三分构图',
    category: 'composition',
    description: '经典的三分法构图',
    keywords: ['三分', '构图', '平衡', '经典', '专业'],
    promptSnippet: 'rule of thirds composition, balanced layout',
    impact: 'medium',
    suitableFor: ['all']
  },
  {
    id: 'golden-ratio',
    name: '黄金比例',
    category: 'composition',
    description: '黄金螺旋构图，视觉和谐',
    keywords: ['黄金', '比例', '螺旋', '和谐', '美学'],
    promptSnippet: 'golden ratio composition, fibonacci spiral',
    impact: 'medium',
    suitableFor: ['all']
  },
  {
    id: 'leading-lines',
    name: '引导线',
    category: 'composition',
    description: '视觉引导线，突出主体',
    keywords: ['引导', '线条', '视线', '焦点', '方向'],
    promptSnippet: 'leading lines, visual guidance, focal point',
    impact: 'medium',
    suitableFor: ['landscape', 'architecture', 'scene']
  }
];

// 设计方向到元素的映射
const DIRECTION_ELEMENT_MAP: Record<string, string[]> = {
  'fantasy': ['particle-effects', 'volumetric-light', 'mist-atmosphere', 'glow-effect'],
  'sci-fi': ['glow-effect', 'octane-render', 'neon', 'particle-effects'],
  'cute': ['bokeh-background', 'soft-lighting', 'pastel-colors', 'glow-effect'],
  'realistic': ['texture-detail', 'octane-render', '8k-resolution', 'masterpiece-quality'],
  'minimal': ['rule-thirds', 'golden-ratio', 'clean-background', 'negative-space'],
  'dramatic': ['volumetric-light', 'motion-blur', 'high-contrast', 'leading-lines'],
  'nature': ['mist-atmosphere', 'depth-layers', 'natural-light', 'texture-detail'],
  'character': ['glow-effect', 'texture-detail', 'bokeh-background', 'depth-layers'],
  'product': ['octane-render', 'glow-effect', 'bokeh-background', '8k-resolution'],
  'landscape': ['depth-layers', 'mist-atmosphere', 'volumetric-light', 'leading-lines']
};

/**
 * 元素推荐器
 */
export class ElementRecommender {
  private elementLibrary = DESIGN_ELEMENTS_LIBRARY;

  /**
   * 分析设计方向
   */
  analyzeDesignDirection(prompt: string): {
    primaryDirection: string;
    secondaryDirections: string[];
    confidence: number;
  } {
    const lowerPrompt = prompt.toLowerCase();
    
    // 方向关键词映射
    const directionKeywords: Record<string, string[]> = {
      'fantasy': ['幻想', '奇幻', '魔法', '魔幻', '童话', '精灵', '龙', '城堡'],
      'sci-fi': ['科幻', '未来', '科技', '机械', '宇宙', '太空', '赛博', 'cyber'],
      'cute': ['可爱', '萌', '治愈', '温馨', '甜美', '卡通', 'Q版'],
      'realistic': ['真实', '写实', '逼真', '照片', '摄影', 'realistic', 'photo'],
      'minimal': ['极简', '简约', '简单', '干净', '留白', 'minimal', 'clean'],
      'dramatic': ['戏剧', '震撼', '强烈', '对比', 'dramatic', 'cinematic'],
      'nature': ['自然', '风景', '山水', '森林', 'nature', 'landscape'],
      'character': ['角色', '人物', '形象', 'IP', 'character', 'portrait'],
      'product': ['产品', '商品', '物品', 'product', 'item', 'object'],
      'landscape': ['风景', '场景', '环境', 'landscape', 'environment', 'scene']
    };

    // 计算各方向的匹配度
    const scores: Record<string, number> = {};
    for (const [direction, keywords] of Object.entries(directionKeywords)) {
      scores[direction] = keywords.filter(k => lowerPrompt.includes(k)).length;
    }

    // 排序获取主要方向
    const sorted = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return {
        primaryDirection: 'general',
        secondaryDirections: [],
        confidence: 0.3
      };
    }

    const totalScore = sorted.reduce((sum, [, score]) => sum + score, 0);
    return {
      primaryDirection: sorted[0][0],
      secondaryDirections: sorted.slice(1, 3).map(([dir]) => dir),
      confidence: Math.min(sorted[0][1] / 3, 0.95)
    };
  }

  /**
   * 推荐设计元素
   */
  async recommendElements(
    prompt: string,
    currentElements?: string[]
  ): Promise<{
    recommendations: DesignElement[];
    reason: string;
  }> {
    const direction = this.analyzeDesignDirection(prompt);
    const usedElementIds = new Set(currentElements || []);

    // 获取推荐的元素ID
    let recommendedIds = DIRECTION_ELEMENT_MAP[direction.primaryDirection] || [];
    
    // 添加次要方向的元素
    for (const secondaryDir of direction.secondaryDirections) {
      const secondaryIds = DIRECTION_ELEMENT_MAP[secondaryDir] || [];
      recommendedIds = [...recommendedIds, ...secondaryIds];
    }

    // 去重并过滤已使用的
    recommendedIds = [...new Set(recommendedIds)].filter(id => !usedElementIds.has(id));

    // 获取元素详情
    const recommendations = recommendedIds
      .map(id => this.elementLibrary.find(e => e.id === id))
      .filter(Boolean) as DesignElement[];

    // 按影响力排序
    recommendations.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });

    // 生成推荐理由
    let reason = `基于您的${direction.primaryDirection}风格设计`;
    if (direction.secondaryDirections.length > 0) {
      reason += `，融合${direction.secondaryDirections.join('、')}元素`;
    }
    reason += '，以下元素可以增强效果';

    return {
      recommendations: recommendations.slice(0, 4),
      reason
    };
  }

  /**
   * 生成元素添加建议
   */
  async generateElementSuggestion(
    userPrompt: string,
    context?: {
      currentAgent?: string;
      generatedImages?: number;
    }
  ): Promise<Suggestion | null> {
    const { recommendations, reason } = await this.recommendElements(userPrompt);

    if (recommendations.length === 0) {
      return null;
    }

    const topElement = recommendations[0];
    const otherElements = recommendations.slice(1, 3);

    return {
      id: `sugg-element-${Date.now()}`,
      type: SuggestionType.ELEMENT_SUGGESTION,
      title: `✨ 添加${topElement.name}`,
      description: topElement.description,
      action: {
        type: 'message',
        payload: `添加${topElement.name}效果：${topElement.promptSnippet}`
      },
      priority: 75,
      reason,
      confidence: 0.8,
      timestamp: Date.now(),
      metadata: {
        element: topElement,
        alternatives: otherElements,
        promptSnippet: topElement.promptSnippet
      }
    } as Suggestion;
  }

  /**
   * 获取元素组合建议
   */
  getElementCombination(direction: string): {
    name: string;
    elements: DesignElement[];
    description: string;
  } {
    const elementIds = DIRECTION_ELEMENT_MAP[direction] || DIRECTION_ELEMENT_MAP['general'] || [];
    const elements = elementIds
      .map(id => this.elementLibrary.find(e => e.id === id))
      .filter(Boolean) as DesignElement[];

    const combinationNames: Record<string, string> = {
      'fantasy': '梦幻魔法组合',
      'sci-fi': '科幻未来组合',
      'cute': '可爱治愈组合',
      'realistic': '写实精致组合',
      'minimal': '极简优雅组合',
      'dramatic': '戏剧张力组合',
      'nature': '自然意境组合',
      'character': '角色魅力组合',
      'product': '产品展示组合',
      'landscape': '风景大片组合'
    };

    return {
      name: combinationNames[direction] || '经典效果组合',
      elements: elements.slice(0, 3),
      description: `专为${direction}风格设计的元素组合`
    };
  }

  /**
   * 根据已有元素推荐补充元素
   */
  recommendComplementaryElements(
    existingElements: string[],
    prompt: string
  ): DesignElement[] {
    const direction = this.analyzeDesignDirection(prompt);
    const usedIds = new Set(existingElements);
    
    // 获取该方向的所有推荐元素
    const allRecommendedIds = [
      ...(DIRECTION_ELEMENT_MAP[direction.primaryDirection] || []),
      ...direction.secondaryDirections.flatMap(d => DIRECTION_ELEMENT_MAP[d] || [])
    ];

    // 过滤掉已使用的，返回前3个
    return allRecommendedIds
      .filter(id => !usedIds.has(id))
      .slice(0, 3)
      .map(id => this.elementLibrary.find(e => e.id === id))
      .filter(Boolean) as DesignElement[];
  }
}

// 导出单例
let elementRecommenderInstance: ElementRecommender | null = null;

export function getElementRecommender(): ElementRecommender {
  if (!elementRecommenderInstance) {
    elementRecommenderInstance = new ElementRecommender();
  }
  return elementRecommenderInstance;
}

export function resetElementRecommender(): void {
  elementRecommenderInstance = null;
}
