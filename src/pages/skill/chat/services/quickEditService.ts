import { sendMessage } from './chatService';
import { createChatContext } from './chatService';

export interface QuickEditRequest {
  imageUrl: string;
  prompt: string;
  attachments?: File[];
  style?: string;
}

export interface QuickEditResponse {
  editedImageUrl: string;
  appliedEffects: string[];
  description: string;
}

export interface EditSuggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

// 预设编辑建议
export const EDIT_SUGGESTIONS: EditSuggestion[] = [
  { id: 'warm', label: '暖色调', prompt: '将图片调整为暖色调，增加温暖感', icon: 'sun' },
  { id: 'cool', label: '冷色调', prompt: '将图片调整为冷色调，增加清新感', icon: 'snowflake' },
  { id: 'vintage', label: '复古风', prompt: '将图片调整为复古风格，增加怀旧感', icon: 'clock' },
  { id: 'vivid', label: '鲜艳', prompt: '增加图片的饱和度和对比度，让颜色更鲜艳', icon: 'palette' },
  { id: 'soft', label: '柔和', prompt: '将图片调整为柔和风格，降低对比度', icon: 'cloud' },
  { id: 'bw', label: '黑白', prompt: '将图片转换为黑白风格', icon: 'circle' },
  { id: 'bright', label: '增亮', prompt: '增加图片亮度', icon: 'sunrise' },
  { id: 'dark', label: '变暗', prompt: '降低图片亮度，增加神秘感', icon: 'moon' },
];

// 系统提示词 - 用于解析用户的编辑意图
const QUICK_EDIT_SYSTEM_PROMPT = `你是津小脉的图片编辑助手。你的任务是理解用户对图片的编辑需求，并返回结构化的编辑参数。

用户会提供：
1. 当前图片的URL
2. 用户的编辑描述（自然语言）
3. 可选的参考图片

你需要分析用户的编辑意图，返回以下JSON格式的响应：
{
  "effects": {
    "filter": "滤镜名称 (none|grayscale|sepia|warm|cool|vintage|vivid|soft|dramatic)",
    "brightness": 亮度调整 (-100 到 100, 0为不变),
    "contrast": 对比度调整 (-100 到 100, 0为不变),
    "saturation": 饱和度调整 (-100 到 100, 0为不变),
    "rotation": 旋转角度 (0, 90, 180, 270),
    "flipH": 水平翻转 (true|false),
    "flipV": 垂直翻转 (true|false)
  },
  "description": "对用户编辑意图的描述",
  "requiresAI": "是否需要AI重新生成图片 (true|false)"
}

滤镜说明：
- none: 原图
- grayscale: 黑白
- sepia: 复古/怀旧
- warm: 暖色调
- cool: 冷色调
- vintage: 复古胶片风
- vivid: 鲜艳/高饱和
- soft: 柔和/低对比
- dramatic: 戏剧/高对比

如果用户要求的是简单的颜色、亮度调整，使用滤镜参数即可。
如果用户要求的是内容修改（如"把猫换成狗"），则 requiresAI 设为 true。

只返回JSON，不要返回其他内容。`;

// 解析用户的编辑意图
export const parseEditIntent = async (
  prompt: string,
  signal?: AbortSignal
): Promise<{
  effects: {
    filter: string;
    brightness: number;
    contrast: number;
    saturation: number;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
  };
  description: string;
  requiresAI: boolean;
}> => {
  const context = createChatContext([], QUICK_EDIT_SYSTEM_PROMPT);

  try {
    const response = await sendMessage(
      `请分析以下图片编辑需求："${prompt}"`,
      context,
      signal
    );

    // 尝试解析JSON响应
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          effects: {
            filter: result.effects?.filter || 'none',
            brightness: result.effects?.brightness || 0,
            contrast: result.effects?.contrast || 0,
            saturation: result.effects?.saturation || 0,
            rotation: result.effects?.rotation || 0,
            flipH: result.effects?.flipH || false,
            flipV: result.effects?.flipV || false,
          },
          description: result.description || prompt,
          requiresAI: result.requiresAI || false,
        };
      }
    } catch (parseError) {
      console.warn('[QuickEditService] JSON parse failed, using fallback:', parseError);
    }

    // 回退：基于关键词的简单解析
    return parseEditIntentFallback(prompt);
  } catch (error) {
    console.error('[QuickEditService] Parse edit intent failed:', error);
    return parseEditIntentFallback(prompt);
  }
};

// 基于关键词的简单解析（回退方案）
const parseEditIntentFallback = (prompt: string): {
  effects: {
    filter: string;
    brightness: number;
    contrast: number;
    saturation: number;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
  };
  description: string;
  requiresAI: boolean;
} => {
  const lowerPrompt = prompt.toLowerCase();

  // 默认效果
  const effects = {
    filter: 'none',
    brightness: 0,
    contrast: 0,
    saturation: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
  };

  // 滤镜检测
  if (lowerPrompt.includes('黑白') || lowerPrompt.includes('灰度') || lowerPrompt.includes('grayscale')) {
    effects.filter = 'grayscale';
  } else if (lowerPrompt.includes('复古') || lowerPrompt.includes('怀旧') || lowerPrompt.includes('sepia')) {
    effects.filter = 'sepia';
  } else if (lowerPrompt.includes('暖色') || lowerPrompt.includes('warm')) {
    effects.filter = 'warm';
  } else if (lowerPrompt.includes('冷色') || lowerPrompt.includes('cool')) {
    effects.filter = 'cool';
  } else if (lowerPrompt.includes('鲜艳') || lowerPrompt.includes('vivid') || lowerPrompt.includes('饱和')) {
    effects.filter = 'vivid';
    effects.saturation = 30;
  } else if (lowerPrompt.includes('柔和') || lowerPrompt.includes('soft')) {
    effects.filter = 'soft';
  } else if (lowerPrompt.includes('戏剧') || lowerPrompt.includes('dramatic')) {
    effects.filter = 'dramatic';
    effects.contrast = 30;
  }

  // 亮度检测
  if (lowerPrompt.includes('增亮') || lowerPrompt.includes('更亮') || lowerPrompt.includes('bright')) {
    effects.brightness = 20;
  } else if (lowerPrompt.includes('变暗') || lowerPrompt.includes('更暗') || lowerPrompt.includes('dark')) {
    effects.brightness = -20;
  }

  // 对比度检测
  if (lowerPrompt.includes('对比') || lowerPrompt.includes('contrast')) {
    if (lowerPrompt.includes('高') || lowerPrompt.includes('增加')) {
      effects.contrast = 20;
    } else if (lowerPrompt.includes('低') || lowerPrompt.includes('降低')) {
      effects.contrast = -20;
    }
  }

  // 旋转检测
  if (lowerPrompt.includes('左转') || lowerPrompt.includes('向左')) {
    effects.rotation = -90;
  } else if (lowerPrompt.includes('右转') || lowerPrompt.includes('向右')) {
    effects.rotation = 90;
  } else if (lowerPrompt.includes('旋转180') || lowerPrompt.includes('翻转')) {
    effects.rotation = 180;
  }

  // 翻转检测
  if (lowerPrompt.includes('水平翻转') || lowerPrompt.includes('左右翻转')) {
    effects.flipH = true;
  } else if (lowerPrompt.includes('垂直翻转') || lowerPrompt.includes('上下翻转')) {
    effects.flipV = true;
  }

  // 检测是否需要AI重新生成
  const requiresAIKeywords = ['换成', '改为', '添加', '删除', '移除', '变成', '替换'];
  const requiresAI = requiresAIKeywords.some(keyword => lowerPrompt.includes(keyword));

  return {
    effects,
    description: prompt,
    requiresAI,
  };
};

// 应用编辑效果到图片（使用Canvas）
export const applyEditEffects = async (
  imageUrl: string,
  effects: {
    filter: string;
    brightness: number;
    contrast: number;
    saturation: number;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
  }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas 上下文'));
          return;
        }

        // 计算旋转后的画布尺寸
        const rad = (effects.rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        const newWidth = img.naturalWidth * cos + img.naturalHeight * sin;
        const newHeight = img.naturalWidth * sin + img.naturalHeight * cos;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // 构建滤镜字符串
        const brightness = 100 + effects.brightness;
        const contrast = 100 + effects.contrast;
        const saturation = 100 + effects.saturation;
        let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

        // 应用预设滤镜
        const filterMap: Record<string, string> = {
          grayscale: 'grayscale(100%)',
          sepia: 'sepia(100%)',
          warm: 'sepia(30%) saturate(140%) brightness(105%)',
          cool: 'hue-rotate(180deg) saturate(80%)',
          vintage: 'sepia(50%) contrast(120%) brightness(90%)',
          vivid: 'saturate(180%) contrast(110%)',
          soft: 'brightness(110%) contrast(90%) saturate(90%)',
          dramatic: 'contrast(150%) saturate(120%)',
        };

        if (effects.filter !== 'none' && filterMap[effects.filter]) {
          filterString += ' ' + filterMap[effects.filter];
        }

        // 应用变换
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.scale(effects.flipH ? -1 : 1, effects.flipV ? -1 : 1);
        ctx.filter = filterString;
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();

        // 导出为 data URL
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    // 添加时间戳避免缓存问题
    const urlWithTimestamp = imageUrl.includes('?')
      ? `${imageUrl}&_t=${Date.now()}`
      : `${imageUrl}?_t=${Date.now()}`;
    img.src = urlWithTimestamp;
  });
};

// 执行快速编辑
export const performQuickEdit = async (
  request: QuickEditRequest,
  signal?: AbortSignal
): Promise<QuickEditResponse> => {
  // 1. 解析编辑意图
  const intent = await parseEditIntent(request.prompt, signal);

  // 2. 如果需要AI重新生成，调用图片生成API
  if (intent.requiresAI) {
    // TODO: 调用AI图片编辑/生成API
    // 目前先返回需要AI生成的提示
    throw new Error('此编辑需要AI重新生成图片，功能开发中');
  }

  // 3. 应用编辑效果
  const editedImageUrl = await applyEditEffects(request.imageUrl, intent.effects);

  // 4. 构建应用的效果列表
  const appliedEffects: string[] = [];
  if (intent.effects.filter !== 'none') {
    const filterNames: Record<string, string> = {
      grayscale: '黑白',
      sepia: '复古',
      warm: '暖色调',
      cool: '冷色调',
      vintage: '怀旧',
      vivid: '鲜艳',
      soft: '柔和',
      dramatic: '戏剧',
    };
    appliedEffects.push(filterNames[intent.effects.filter] || intent.effects.filter);
  }
  if (intent.effects.brightness !== 0) {
    appliedEffects.push(intent.effects.brightness > 0 ? '增亮' : '变暗');
  }
  if (intent.effects.contrast !== 0) {
    appliedEffects.push(intent.effects.contrast > 0 ? '增加对比度' : '降低对比度');
  }
  if (intent.effects.saturation !== 0) {
    appliedEffects.push(intent.effects.saturation > 0 ? '增加饱和度' : '降低饱和度');
  }
  if (intent.effects.rotation !== 0) {
    appliedEffects.push(`旋转${intent.effects.rotation}度`);
  }
  if (intent.effects.flipH) {
    appliedEffects.push('水平翻转');
  }
  if (intent.effects.flipV) {
    appliedEffects.push('垂直翻转');
  }

  return {
    editedImageUrl,
    appliedEffects: appliedEffects.length > 0 ? appliedEffects : ['原图'],
    description: intent.description,
  };
};

export default {
  parseEditIntent,
  applyEditEffects,
  performQuickEdit,
  EDIT_SUGGESTIONS,
};
