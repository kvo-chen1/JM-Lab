import type { IntentType } from './intentService';

export interface RefinementContext {
  originalIntent: IntentType;
  originalParams: Record<string, string>;
  originalResult?: {
    imageUrl?: string;
    textContent?: string;
    attachments?: Array<{ type: string; url?: string; content?: string }>;
  };
}

export interface RefinementRequest {
  type: 'partial' | 'full';
  modifiedFields: Record<string, string>;
  preserveFields?: string[];
}

export interface RefinementResult {
  success: boolean;
  newParams: Record<string, string>;
  needsRegeneration: boolean;
  partialOnly: boolean;
}

const COLOR_KEYWORDS = ['蓝色', '红色', '绿色', '紫色', '橙色', '黄色', '黑色', '白色', '金色', '银色', '粉色', '青色'];
const STYLE_KEYWORDS = ['简约', '现代', '科技', '复古', '可爱', '高端', '时尚', '酷', '专业', '活泼'];
const SIZE_KEYWORDS = ['大', '小', '中', '横版', '竖版', '方形', '长图', '方图'];

export const parseRefinementRequest = (
  userMessage: string,
  context: RefinementContext
): RefinementRequest => {
  const modifiedFields: Record<string, string> = {};
  let type: 'partial' | 'full' = 'partial';

  // 检测颜色修改
  for (const color of COLOR_KEYWORDS) {
    if (userMessage.includes(color) || userMessage.includes(`${color}色`)) {
      modifiedFields['colorPreference'] = `${color}色系`;
      modifiedFields['colorTone'] = `${color}色调`;
      break;
    }
  }

  // 检测风格修改
  for (const style of STYLE_KEYWORDS) {
    if (userMessage.includes(style)) {
      modifiedFields['style'] = style;
      break;
    }
  }

  // 检测尺寸修改
  for (const size of SIZE_KEYWORDS) {
    if (userMessage.includes(size)) {
      modifiedFields['size'] = size;
      break;
    }
  }

  // 检测整体重新生成（不保留原参数）
  const fullRegenerationPatterns = [
    /重新生成/,
    /再来一个/,
    /换一个/,
    /另一个/,
    /不同.*风格/,
    /换个.*样式/,
  ];

  if (fullRegenerationPatterns.some(p => p.test(userMessage))) {
    type = 'full';
  }

  // 如果用户明确说"只要改..."则只修改指定字段
  const partialPatterns = [
    /只要.*颜色/,
    /只要.*风格/,
    /只改.*颜色/,
    /只改.*风格/,
    /换.*颜色/,
    /换.*风格/,
  ];

  if (partialPatterns.some(p => p.test(userMessage))) {
    type = 'partial';
  }

  return {
    type,
    modifiedFields,
  };
};

export const applyRefinement = (
  originalParams: Record<string, string>,
  refinement: RefinementRequest,
  context: RefinementContext
): RefinementResult => {
  if (refinement.type === 'full') {
    return {
      success: true,
      newParams: refinement.modifiedFields,
      needsRegeneration: true,
      partialOnly: false,
    };
  }

  const newParams = { ...originalParams };

  for (const [key, value] of Object.entries(refinement.modifiedFields)) {
    newParams[key] = value;
  }

  return {
    success: true,
    newParams,
    needsRegeneration: true,
    partialOnly: true,
  };
};

export const extractRefinementInstructions = (
  userMessage: string
): {
  instructions: string;
  targetAspect?: string;
} => {
  let targetAspect: string | undefined;

  if (COLOR_KEYWORDS.some(c => userMessage.includes(c))) {
    targetAspect = 'color';
  } else if (STYLE_KEYWORDS.some(s => userMessage.includes(s))) {
    targetAspect = 'style';
  } else if (SIZE_KEYWORDS.some(s => userMessage.includes(s))) {
    targetAspect = 'size';
  }

  const instructionPatterns = [
    /换成(.+)/i,
    /改成(.+)/i,
    /变成(.+)/i,
    /调成(.+)/i,
    /改成(.+)/i,
    /更好.*/i,
    /更.*一些/i,
  ];

  let instructions = userMessage;
  for (const pattern of instructionPatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      instructions = match[1].trim();
      break;
    }
  }

  return { instructions, targetAspect };
};

export const buildRefinedPrompt = (
  originalPrompt: string,
  refinement: RefinementRequest,
  context: RefinementContext
): string => {
  const { instructions } = extractRefinementInstructions(
    Object.values(refinement.modifiedFields).join(' ')
  );

  let refinedPrompt = originalPrompt;

  if (refinement.modifiedFields['colorPreference']) {
    refinedPrompt = refinedPrompt.replace(
      /颜色[：:]?\s*[^，,。]*/,
      `颜色：${refinement.modifiedFields['colorPreference']}`
    );
  }

  if (refinement.modifiedFields['style']) {
    refinedPrompt = refinedPrompt.replace(
      /风格[：:]?\s*[^，,。]*/,
      `风格：${refinement.modifiedFields['style']}`
    );
  }

  refinedPrompt += `\n\n修改要求：${instructions}`;

  return refinedPrompt;
};

export const isRefinementIntent = (userMessage: string): boolean => {
  const refinementPatterns = [
    /优化/,
    /调整/,
    /改一下/,
    /换/,
    /改成/,
    /变成/,
    /换个/,
    /更好/,
    /改进/,
    /改善/,
    /完善/,
  ];

  const referencePatterns = [
    /这个/,
    /那个/,
    /它/,
    /这/,
    /那/,
    /上一个/,
    /之前/,
    /刚才/,
    /上面/,
  ];

  const hasRefinementKeyword = refinementPatterns.some(p => p.test(userMessage));
  const hasReferenceKeyword = referencePatterns.some(p => p.test(userMessage));

  return hasRefinementKeyword && hasReferenceKeyword;
};

export default {
  parseRefinementRequest,
  applyRefinement,
  extractRefinementInstructions,
  buildRefinedPrompt,
  isRefinementIntent,
};
