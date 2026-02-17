import { SmartLayoutConfig, LayoutRecommendation, GeneratedResult } from '../types';

// 平台预设配置
const PLATFORM_CONFIGS: Record<string, { ratio: string; width: number; height: number }> = {
  xiaohongshu: { ratio: '3:4', width: 1242, height: 1660 },
  weibo: { ratio: '1:1', width: 1080, height: 1080 },
  douyin: { ratio: '9:16', width: 1080, height: 1920 },
  wechat: { ratio: '1:1', width: 1080, height: 1080 },
  instagram: { ratio: '1:1', width: 1080, height: 1080 },
  poster: { ratio: '2:3', width: 1200, height: 1800 },
};

// 场景推荐映射
const SCENARIO_RECOMMENDATIONS: Record<string, { template: string; textStyle: string; description: string }> = {
  product: { 
    template: 'center', 
    textStyle: 'minimal', 
    description: '产品展示推荐使用中心聚焦布局，突出产品主体' 
  },
  festival: { 
    template: 'fullscreen', 
    textStyle: 'bold', 
    description: '节日海报推荐使用全屏沉浸布局，营造氛围' 
  },
  quote: { 
    template: 'top-text', 
    textStyle: 'elegant', 
    description: '金句分享推荐使用上文下图布局，文字为主' 
  },
  event: { 
    template: 'left-text', 
    textStyle: 'bold', 
    description: '活动宣传推荐使用左文右图布局，信息清晰' 
  },
  brand: { 
    template: 'center', 
    textStyle: 'overlay', 
    description: '品牌宣传推荐使用中心聚焦布局，图文叠加' 
  },
  social: { 
    template: 'masonry', 
    textStyle: 'frame', 
    description: '社交媒体推荐使用瀑布流布局，适合多图' 
  },
};

// 模板样式配置 - 使用更宽松的类型
interface TemplateStyle {
  layoutStyle: {
    display: string;
    flexDirection?: string;
    alignItems?: string;
    justifyContent?: string;
    gridTemplateColumns?: string;
    flexWrap?: string;
  };
  imageStyle: {
    width: string;
    height: string;
    objectFit: string;
    borderRadius: string;
    margin?: string;
  };
  textStyle: {
    position: string;
    textAlign: string;
    padding: string;
    width?: string;
    height?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  center: {
    layoutStyle: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column'
    },
    imageStyle: { 
      width: '80%', 
      height: 'auto',
      objectFit: 'contain',
      borderRadius: '12px'
    },
    textStyle: {
      position: 'relative',
      textAlign: 'center',
      padding: '20px'
    }
  },
  'left-text': {
    layoutStyle: { 
      display: 'flex', 
      flexDirection: 'row',
      alignItems: 'center'
    },
    imageStyle: { 
      width: '60%', 
      height: '100%',
      objectFit: 'cover',
      borderRadius: '0 12px 12px 0'
    },
    textStyle: {
      position: 'relative',
      textAlign: 'left',
      padding: '30px',
      width: '40%'
    }
  },
  'top-text': {
    layoutStyle: { 
      display: 'flex', 
      flexDirection: 'column'
    },
    imageStyle: { 
      width: '100%', 
      height: '70%',
      objectFit: 'cover',
      borderRadius: '0 0 12px 12px'
    },
    textStyle: {
      position: 'relative',
      textAlign: 'center',
      padding: '20px',
      height: '30%'
    }
  },
  grid: {
    layoutStyle: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    imageStyle: { 
      width: '100%', 
      height: '100%',
      objectFit: 'cover',
      borderRadius: '8px'
    },
    textStyle: {
      position: 'absolute',
      textAlign: 'center',
      padding: '10px',
      bottom: '10px',
      left: '10px',
      right: '10px'
    }
  },
  masonry: {
    layoutStyle: { 
      display: 'flex', 
      flexWrap: 'wrap',
      alignItems: 'flex-start'
    },
    imageStyle: { 
      width: '48%', 
      height: 'auto',
      objectFit: 'cover',
      borderRadius: '8px',
      margin: '1%'
    },
    textStyle: {
      position: 'absolute',
      textAlign: 'left',
      padding: '15px',
      bottom: '20px',
      left: '20px'
    }
  },
  fullscreen: {
    layoutStyle: { 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center'
    },
    imageStyle: { 
      width: '100%', 
      height: '100%',
      objectFit: 'cover',
      borderRadius: '0'
    },
    textStyle: {
      position: 'absolute',
      textAlign: 'center',
      padding: '30px',
      bottom: '40px',
      left: '20px',
      right: '20px'
    }
  }
};

// 文字样式配置
interface TextStyleConfig {
  fontSize: string;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  borderRadius: string;
}

const TEXT_STYLE_CONFIGS: Record<string, TextStyleConfig> = {
  minimal: {
    fontSize: '18px',
    fontWeight: '400',
    color: '#333333',
    backgroundColor: 'transparent',
    borderRadius: '0'
  },
  elegant: {
    fontSize: '24px',
    fontWeight: '500',
    color: '#2c2c2c',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: '8px'
  },
  bold: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: '12px'
  },
  vertical: {
    fontSize: '20px',
    fontWeight: '500',
    color: '#1a1a1a',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: '8px'
  },
  overlay: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: '8px'
  },
  frame: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#333333',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: '16px'
  }
};

/**
 * 生成智能排版推荐
 */
export async function generateLayoutRecommendation(
  config: SmartLayoutConfig,
  generatedResults: GeneratedResult[],
  selectedResult: number | null
): Promise<LayoutRecommendation> {
  // 模拟AI分析延迟
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 获取平台配置
  const platformConfig = PLATFORM_CONFIGS[config.platform] || PLATFORM_CONFIGS.xiaohongshu;
  
  // 获取场景推荐
  const scenarioRec = SCENARIO_RECOMMENDATIONS[config.scenario] || SCENARIO_RECOMMENDATIONS.product;
  
  // 获取模板样式
  const templateStyle = TEMPLATE_STYLES[config.template] || TEMPLATE_STYLES.center;
  
  // 获取文字样式
  const textStyleConfig = TEXT_STYLE_CONFIGS[config.textStyle] || TEXT_STYLE_CONFIGS.minimal;
  
  // 分析图片内容（模拟）
  const hasMultipleImages = generatedResults.length > 1;
  
  // 根据内容调整推荐
  let adjustedTemplate = config.template;
  let adjustedTextStyle = config.textStyle;
  let recommendationText = scenarioRec.description;
  
  if (hasMultipleImages && config.scenario === 'social') {
    adjustedTemplate = 'grid';
    recommendationText = '检测到多张图片，推荐使用网格布局展示';
  } else if (config.customText && config.customText.length > 50) {
    adjustedTextStyle = 'elegant';
    recommendationText += '，文字较多建议使用优雅衬线样式';
  }
  
  // 构建完整的排版推荐
  const recommendation: LayoutRecommendation = {
    scenario: config.scenario,
    platform: config.platform,
    template: adjustedTemplate,
    textStyleId: adjustedTextStyle,
    aspectRatio: platformConfig.ratio,
    canvasSize: {
      width: platformConfig.width,
      height: platformConfig.height
    },
    layoutStyle: templateStyle.layoutStyle,
    imageStyle: {
      width: templateStyle.imageStyle.width || '100%',
      height: templateStyle.imageStyle.height || 'auto',
      objectFit: templateStyle.imageStyle.objectFit || 'cover',
      borderRadius: templateStyle.imageStyle.borderRadius || '8px'
    },
    textStyle: {
      position: templateStyle.textStyle.position,
      fontSize: textStyleConfig.fontSize,
      fontWeight: textStyleConfig.fontWeight,
      textAlign: templateStyle.textStyle.textAlign,
      color: textStyleConfig.color,
      backgroundColor: textStyleConfig.backgroundColor,
      padding: templateStyle.textStyle.padding,
      borderRadius: textStyleConfig.borderRadius,
      width: templateStyle.textStyle.width,
      height: templateStyle.textStyle.height
    },
    recommendation: recommendationText
  };
  
  return recommendation;
}

/**
 * 根据平台获取推荐尺寸
 */
export function getRecommendedSize(platform: string): { width: number; height: number; ratio: string } {
  return PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.xiaohongshu;
}

/**
 * 获取场景推荐模板
 */
export function getScenarioRecommendation(scenario: string): { template: string; textStyle: string; description: string } {
  return SCENARIO_RECOMMENDATIONS[scenario] || SCENARIO_RECOMMENDATIONS.product;
}

/**
 * 分析图片比例并推荐最佳布局
 */
export function analyzeImageAspectRatio(imageWidth: number, imageHeight: number): {
  ratio: string;
  recommendedTemplate: string;
  description: string;
} {
  const ratio = imageWidth / imageHeight;
  
  if (ratio > 1.5) {
    return {
      ratio: 'landscape',
      recommendedTemplate: 'left-text',
      description: '横向图片适合左文右图布局'
    };
  } else if (ratio < 0.7) {
    return {
      ratio: 'portrait',
      recommendedTemplate: 'top-text',
      description: '纵向图片适合上文下图布局'
    };
  } else {
    return {
      ratio: 'square',
      recommendedTemplate: 'center',
      description: '方形图片适合中心聚焦布局'
    };
  }
}
