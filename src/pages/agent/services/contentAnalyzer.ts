/**
 * 内容分析器服务
 * 分析消息内容，智能决定是否将内容生成到画布上
 */

import { AgentMessage, AgentType } from '../types/agent';

export type ContentType = 
  | 'character_design' 
  | 'concept_art' 
  | 'three_view' 
  | 'poster' 
  | 'character_profile'
  | 'style_selection'
  | 'satisfaction_check'
  | 'derivative_options'
  | 'text'
  | 'other';

export interface ContentAnalysisResult {
  shouldGenerateToCanvas: boolean;
  contentType: ContentType;
  confidence: number; // 0-1
  extractedData: {
    characterName?: string;
    style?: string;
    designType?: string;
    images?: string[];
    hasVisualContent: boolean;
    isFinalOutput: boolean;
  };
  reason: string; // 决策原因说明
}

// 设计相关关键词
const DESIGN_KEYWORDS = [
  '角色', 'IP', '形象', '设计', '概念图', '三视图', '海报',
  'character', 'design', 'concept', 'art', 'poster', 'mascot'
];

// 最终成果关键词
const FINAL_OUTPUT_KEYWORDS = [
  '完成', '生成', '设计好了', '做好了', '最终', '定稿',
  'completed', 'finished', 'done', 'final', 'ready'
];

// 中间过程关键词（不应添加到画布）
const INTERMEDIATE_KEYWORDS = [
  '选择', '请选', '确认', '满意', '修改', '调整',
  'select', 'choose', 'confirm', 'satisfied', 'modify'
];

// 视觉内容关键词
const VISUAL_KEYWORDS = [
  '图', '图片', '图像', '视觉', '画', '效果图',
  'image', 'picture', 'visual', 'drawing', 'render'
];

/**
 * 分析消息内容
 */
export function analyzeContent(message: AgentMessage): ContentAnalysisResult {
  // 空值检查
  if (!message) {
    return {
      shouldGenerateToCanvas: false,
      contentType: 'text',
      confidence: 0,
      extractedData: {
        hasVisualContent: false,
        isFinalOutput: false
      },
      reason: '消息为空'
    };
  }

  const content = message.content || '';
  const metadata = message.metadata || {};

  // 基础检查 - 使用可选链避免 undefined 错误
  const hasImages = metadata?.images && metadata.images.length > 0;
  const messageType = message?.type || 'text';
  const agentType = message?.role as AgentType;
  
  // 提取图片
  const images = metadata.images || [];
  
  // 1. 根据消息类型快速判断
  if (messageType === 'image' && hasImages) {
    return {
      shouldGenerateToCanvas: true,
      contentType: 'concept_art',
      confidence: 0.95,
      extractedData: {
        images,
        hasVisualContent: true,
        isFinalOutput: true
      },
      reason: '包含图片的视觉内容'
    };
  }
  
  // 2. 检查特定消息类型
  if (messageType === 'satisfaction-check' || messageType === 'satisfaction_check') {
    return {
      shouldGenerateToCanvas: false,
      contentType: 'satisfaction_check',
      confidence: 0.99,
      extractedData: {
        hasVisualContent: false,
        isFinalOutput: false
      },
      reason: '满意度确认节点，不生成到画布'
    };
  }
  
  if (messageType === 'style-options' || messageType === 'style_options') {
    return {
      shouldGenerateToCanvas: false,
      contentType: 'style_selection',
      confidence: 0.99,
      extractedData: {
        hasVisualContent: false,
        isFinalOutput: false
      },
      reason: '风格选择提示，中间过程'
    };
  }
  
  if (messageType === 'derivative-options' || messageType === 'derivative_options') {
    return {
      shouldGenerateToCanvas: false,
      contentType: 'derivative_options',
      confidence: 0.99,
      extractedData: {
        hasVisualContent: false,
        isFinalOutput: false
      },
      reason: '衍生选项提示，不生成到画布'
    };
  }
  
  // 3. 分析内容特征
  const contentLower = content.toLowerCase();
  const hasDesignKeywords = DESIGN_KEYWORDS.some(kw => 
    contentLower.includes(kw.toLowerCase())
  );
  const hasFinalOutputKeywords = FINAL_OUTPUT_KEYWORDS.some(kw => 
    contentLower.includes(kw.toLowerCase())
  );
  const hasIntermediateKeywords = INTERMEDIATE_KEYWORDS.some(kw => 
    contentLower.includes(kw.toLowerCase())
  );
  const hasVisualKeywords = VISUAL_KEYWORDS.some(kw => 
    contentLower.includes(kw.toLowerCase())
  );
  
  // 4. 判断内容类型
  let contentType: ContentType = 'text';
  let confidence = 0.5;
  
  // 检查是否是三视图（优先级最高）
  if (content.includes('三视图') || content.includes('three-view') || 
      (content.includes('正面') && content.includes('侧面') && content.includes('背面'))) {
    contentType = 'three_view';
    confidence = 0.95;
  }
  // 检查是否是海报
  else if (content.includes('海报') || content.includes('poster') || 
           content.includes('宣传')) {
    contentType = 'poster';
    confidence = 0.85;
  }
  // 检查是否是角色设定
  else if (content.includes('角色设定') || content.includes('角色介绍') || 
      content.includes('人物设定') || content.includes('Character Profile')) {
    contentType = 'character_profile';
    confidence = 0.85;
  }
  // 检查是否是概念图（需要明确提到概念图，或包含图片且有设计关键词）
  else if (content.includes('概念图') || content.includes('concept art') || 
           content.includes('IP形象') || content.includes('角色形象')) {
    contentType = 'concept_art';
    confidence = 0.9;
  }
  // 检查是否是角色设计相关内容
  else if (hasDesignKeywords) {
    contentType = 'character_design';
    confidence = 0.7;
  }
  
  // 5. 判断是否应生成到画布
  let shouldGenerate = false;
  let reason = '';
  
  // 有图片的视觉内容 - 高优先级
  if (hasImages && hasVisualKeywords) {
    shouldGenerate = true;
    confidence = Math.max(confidence, 0.9);
    reason = '包含图片的视觉内容';
  }
  // 有图片的设计内容
  else if (hasImages && hasDesignKeywords) {
    shouldGenerate = true;
    confidence = Math.max(confidence, 0.85);
    reason = '设计相关的图片内容';
  }
  // 最终成果且有设计关键词
  else if (hasFinalOutputKeywords && hasDesignKeywords && !hasIntermediateKeywords) {
    shouldGenerate = true;
    confidence = Math.max(confidence, 0.8);
    reason = '设计成果完成';
  }
  // 角色设定文本（较长且详细）
  else if (contentType === 'character_profile' && content.length > 200) {
    shouldGenerate = true;
    confidence = 0.75;
    reason = '详细的角色设定';
  }
  // 三视图或海报
  else if (contentType === 'three_view' || contentType === 'poster') {
    shouldGenerate = true;
    confidence = 0.9;
    reason = '完整的设计资产';
  }
  // 中间过程或询问
  else if (hasIntermediateKeywords) {
    shouldGenerate = false;
    reason = '中间过程或需要用户确认';
  }
  // 普通文本
  else {
    shouldGenerate = false;
    reason = '非视觉设计内容';
  }
  
  // 6. 根据 Agent 类型调整
  if (agentType === 'illustrator' && hasImages) {
    shouldGenerate = true;
    confidence = Math.max(confidence, 0.9);
    reason = '插画师生成的视觉内容';
  }
  
  // 7. 提取额外数据
  const extractedData = {
    characterName: extractCharacterName(content),
    style: extractStyle(content),
    designType: contentType,
    images,
    hasVisualContent: hasImages || hasVisualKeywords,
    isFinalOutput: hasFinalOutputKeywords && !hasIntermediateKeywords
  };
  
  return {
    shouldGenerateToCanvas: shouldGenerate,
    contentType,
    confidence,
    extractedData,
    reason
  };
}

/**
 * 提取角色名称
 */
function extractCharacterName(content: string): string | undefined {
  // 匹配常见角色名称格式
  const patterns = [
    // 角色名称：xxx
    /角色[名称]*[：:]\s*["']?([^"'\n]{1,20})["']?/i,
    // xxx 的角色设定
    /["']?([^"'\n]{2,15})["']?\s*的?角色设定/i,
    // 为 xxx 设计
    /为\s*["']?([^"'\n]{2,15})["']?\s*设计/i,
    // xxx 的 IP 形象
    /["']?([^"'\n]{2,15})["']?\s*的?IP形象/i,
    // 为 xxx 生成
    /为\s*["']?([^"'\n]{2,15})["']?\s*生成/i,
    // 为 xxx 创建
    /为\s*["']?([^"'\n]{2,15})["']?\s*创建/i,
    // xxx 的 概念图
    /["']?([^"'\n]{2,15})["']?\s*的?概念图/i,
    // 设计 xxx
    /设计\s*["']?([^"'\n]{2,15})["']?/i,
    // 生成 xxx 的
    /生成\s*["']?([^"'\n]{2,15})["']?\s*的/i,
    // 开头提到的名称（如"好的！我立即开始为你生成【欧里亚】的设计作品"）
    /生成[「【\[]?([^」】\]]{2,15})[」】\]]?/i,
    /为[「【\[]?([^」】\]]{2,15})[」】\]]?/i,
    // 匹配"为 xxx "（如"为欧里亚设计"）
    /为\s*([^\s【\[「\n]{2,15})\s*(?:设计|生成|创建|绘制)/i,
    // 匹配"xxx 的"（如"欧里亚的概念图"）
    /([^\s【\[「\n]{2,15})\s*的\s*(?:概念图|形象|设计|作品)/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // 过滤掉常见的非角色名称
      const nonNames = ['你', '我', '他', '她', '它', '用户', '客户', '大家', '我们', '你们', '角色', '形象', 'IP', '设计', '作品', '方案', '概念图', '风格'];
      if (name && name.length >= 2 && name.length <= 15 && !nonNames.includes(name)) {
        return name;
      }
    }
  }
  
  return undefined;
}

/**
 * 提取风格信息
 */
function extractStyle(content: string): string | undefined {
  const stylePatterns = [
    /风格[：:]\s*([^\n]+)/i,
    /(\w+)风格/i,
    /(\w+)style/i,
  ];
  
  for (const pattern of stylePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

/**
 * 批量分析多条消息
 */
export function analyzeMessages(messages: AgentMessage[]): ContentAnalysisResult[] {
  return messages.map(msg => analyzeContent(msg));
}

/**
 * 获取应该生成到画布的消息
 */
export function getCanvasWorthyMessages(
  messages: AgentMessage[],
  minConfidence: number = 0.7
): Array<{ message: AgentMessage; analysis: ContentAnalysisResult }> {
  return messages
    .map(msg => ({ message: msg, analysis: analyzeContent(msg) }))
    .filter(({ analysis }) => 
      analysis.shouldGenerateToCanvas && analysis.confidence >= minConfidence
    );
}
