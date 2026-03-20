/**
 * IP 形象展示海报生成服务
 * 使用 AI 生成专业的 IP 形象设计展示海报
 */

import { generateImage } from './imageGenerationService';

// IP 海报生成参数
export interface IPPosterGenerationParams {
  characterName: string;
  characterDescription: string;
  characterStory: string;
  theme: 'culture' | 'mascot' | 'brand' | 'festival' | 'custom';
  style: 'cute' | 'realistic' | 'anime' | 'chibi' | 'watercolor';
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  elements: {
    mainVisual: boolean;
    threeViews: boolean;
    emojis: boolean;
    actionPoses: boolean;
    colorPalette: boolean;
    merchandise: boolean;
  };
  layout: 'grid' | 'masonry' | 'timeline' | 'classic';
  backgroundStyle: 'gradient' | 'pattern' | 'scene' | 'minimal';
}

// 生成结果
export interface IPPosterGenerationResult {
  mainPoster: string;
  threeViews?: string;
  emojiSheet?: string;
  actionSheet?: string;
  colorPalette?: string;
  merchandiseMockup?: string;
}

// 提示词模板
export const promptTemplates = {
  // 主视觉海报提示词
  mainVisual: (params: IPPosterGenerationParams) => `
Create a professional IP character design showcase poster for "${params.characterName}".

Character Description: ${params.characterDescription}
Story: ${params.characterStory}

Design Requirements:
- Style: ${params.style} style character design
- Color Scheme: Primary ${params.colorScheme.primary}, Secondary ${params.colorScheme.secondary}, Accent ${params.colorScheme.accent}
- Layout: ${params.layout} layout
- Background: ${params.backgroundStyle} background

The poster should include:
1. Large central character illustration with dynamic pose
2. Character name in both Chinese and English (elegant typography)
3. Tagline or subtitle
4. Decorative elements matching the theme
5. Professional design portfolio aesthetic
6. Clean, modern composition with good visual hierarchy

Quality: High-end design portfolio standard, suitable for professional presentation.
`,

  // 三视图提示词
  threeViews: (params: IPPosterGenerationParams) => `
Create a professional three-view character design sheet for "${params.characterName}".

Character Description: ${params.characterDescription}
Style: ${params.style}

Requirements:
- Front view (center)
- Side view (left)
- Back view (right)
- Clean white or light gray background
- Technical drawing style with subtle shadows
- Consistent proportions across all views
- Character height guidelines
- Color swatches below each view
- Professional character design sheet layout

Quality: Industry standard character design reference sheet.
`,

  // 表情包提示词
  emojiSheet: (params: IPPosterGenerationParams) => `
Create an emoji expression sheet for "${params.characterName}".

Character Description: ${params.characterDescription}
Style: ${params.style}

Include 8 different expressions:
1. Happy/Joyful
2. Sad/Crying
3. Angry/Frustrated
4. Surprised/Shocked
5. Thinking/Pondering
6. Sleeping/Tired
7. Love/Heart eyes
8. Cool/Confident

Layout: 2x4 or 4x2 grid
Background: Simple pattern or solid color matching theme
Style: Consistent character design, expressive faces, cute and appealing
Quality: Professional emoji set suitable for messaging apps.
`,

  // 动作延展提示词
  actionSheet: (params: IPPosterGenerationParams) => `
Create an action pose sheet for "${params.characterName}".

Character Description: ${params.characterDescription}
Style: ${params.style}

Include 6 dynamic action poses:
1. Running/Jumping
2. Sitting/Relaxing
3. Waving/Greeting
4. Celebrating/Victory pose
5. Reading/Studying
6. Dancing/Moving

Layout: Dynamic composition showing movement
Background: Simple gradient or minimal scene elements
Style: Full body poses, showing character personality through movement
Quality: Animation reference sheet quality.
`,

  // 配色方案提示词
  colorPalette: (params: IPPosterGenerationParams) => `
Create a professional color palette and style guide for "${params.characterName}".

Primary Color: ${params.colorScheme.primary}
Secondary Color: ${params.colorScheme.secondary}
Accent Color: ${params.colorScheme.accent}

Include:
1. Main color swatches with hex codes
2. Gradient combinations
3. Color usage examples on character
4. Background color options
5. Text color recommendations
6. Do's and don'ts for color usage

Layout: Clean, organized design system presentation
Style: Modern brand guidelines aesthetic
Quality: Professional brand style guide standard.
`,

  // 周边设计 mockup 提示词
  merchandiseMockup: (params: IPPosterGenerationParams) => `
Create merchandise mockup designs for "${params.characterName}".

Character Description: ${params.characterDescription}
Style: ${params.style}

Products to showcase:
1. Plush toy/stuffed animal
2. T-shirt/apparel
3. Phone case
4. Tote bag
5. Sticker sheet
6. Mug/cup

Layout: Realistic product mockups arranged in appealing composition
Background: Clean studio setting or lifestyle scene
Style: Photorealistic mockups, professional product photography aesthetic
Quality: E-commerce ready product showcase.
`,
};

// 中文提示词模板（用于通义万相等中文模型）
const chinesePromptTemplates = {
  mainVisual: (params: IPPosterGenerationParams) => `
为"${params.characterName}"创作一张专业的IP形象设计展示海报。

角色描述：${params.characterDescription}
背景故事：${params.characterStory}

设计要求：
- 风格：${params.style === 'cute' ? '可爱' : params.style === 'realistic' ? '写实' : params.style === 'anime' ? '动漫' : params.style === 'chibi' ? 'Q版' : '水彩'}风格
- 配色：主色${params.colorScheme.primary}，辅色${params.colorScheme.secondary}，点缀色${params.colorScheme.accent}
- 布局：${params.layout === 'grid' ? '网格' : params.layout === 'masonry' ? '瀑布流' : params.layout === 'timeline' ? '时间线' : '经典'}布局
- 背景：${params.backgroundStyle === 'gradient' ? '渐变' : params.backgroundStyle === 'pattern' ? '图案' : params.backgroundStyle === 'scene' ? '场景' : '极简'}风格

海报应包含：
1. 中央大幅角色立绘，动态姿势
2. 中英文角色名称（优雅字体）
3. 副标题或标语
4. 符合主题的 decorative 元素
5. 专业设计作品集美学
6. 简洁现代的构图，良好的视觉层次

质量：高端设计作品集标准，适合专业展示。
`,

  threeViews: (params: IPPosterGenerationParams) => `
为"${params.characterName}"创作一张专业的人物三视图设计稿。

角色描述：${params.characterDescription}
风格：${params.style === 'cute' ? '可爱' : params.style === 'realistic' ? '写实' : params.style === 'anime' ? '动漫' : params.style === 'chibi' ? 'Q版' : '水彩'}风格

要求：
- 正视图（中央）
- 侧视图（左侧）
- 背视图（右侧）
- 干净的白色或浅灰背景
- 技术绘图风格，带微妙阴影
- 各视图比例一致
- 角色身高参考线
- 每个视图下方有色卡
- 专业角色设计稿布局

质量：行业标准角色设计参考稿。
`,

  emojiSheet: (params: IPPosterGenerationParams) => `
为"${params.characterName}"创作一套表情包设计稿。

角色描述：${params.characterDescription}
风格：${params.style === 'cute' ? '可爱' : params.style === 'realistic' ? '写实' : params.style === 'anime' ? '动漫' : params.style === 'chibi' ? 'Q版' : '水彩'}风格

包含8种不同表情：
1. 开心/喜悦
2. 伤心/哭泣
3. 生气/沮丧
4. 惊讶/震惊
5. 思考/沉思
6. 睡觉/疲倦
7. 喜爱/花痴
8. 酷炫/自信

布局：2x4 或 4x2 网格
背景：简单图案或符合主题的纯色
风格：统一的角色设计，表情丰富，可爱吸引人
质量：适合聊天应用的专业表情包。
`,
};

/**
 * 生成 IP 形象展示海报
 */
export async function generateIPPoster(
  params: IPPosterGenerationParams
): Promise<IPPosterGenerationResult> {
  const results: IPPosterGenerationResult = {
    mainPoster: '',
  };

  try {
    // 生成主视觉海报
    console.log('[IP Poster] Generating main visual...');
    const mainVisualPrompt = promptTemplates.mainVisual(params);
    const mainVisualResult = await generateImage({
      prompt: mainVisualPrompt,
      size: '1024x1024',
      model: 'wanx2.1-t2i-turbo',
    });
    results.mainPoster = mainVisualResult.data?.[0]?.url || '';

    // 生成三视图
    if (params.elements.threeViews) {
      console.log('[IP Poster] Generating three views...');
      const threeViewsPrompt = promptTemplates.threeViews(params);
      const threeViewsResult = await generateImage({
        prompt: threeViewsPrompt,
        size: '1024x1024',
        model: 'wanx2.1-t2i-turbo',
      });
      results.threeViews = threeViewsResult.data?.[0]?.url;
    }

    // 生成表情包
    if (params.elements.emojis) {
      console.log('[IP Poster] Generating emoji sheet...');
      const emojiPrompt = promptTemplates.emojiSheet(params);
      const emojiResult = await generateImage({
        prompt: emojiPrompt,
        size: '1024x1024',
        model: 'wanx2.1-t2i-turbo',
      });
      results.emojiSheet = emojiResult.data?.[0]?.url;
    }

    // 生成动作延展
    if (params.elements.actionPoses) {
      console.log('[IP Poster] Generating action poses...');
      const actionPrompt = promptTemplates.actionSheet(params);
      const actionResult = await generateImage({
        prompt: actionPrompt,
        size: '1024x1024',
        model: 'wanx2.1-t2i-turbo',
      });
      results.actionSheet = actionResult.data?.[0]?.url;
    }

    // 生成配色方案
    if (params.elements.colorPalette) {
      console.log('[IP Poster] Generating color palette...');
      const colorPrompt = promptTemplates.colorPalette(params);
      const colorResult = await generateImage({
        prompt: colorPrompt,
        size: '1024x1024',
        model: 'wanx2.1-t2i-turbo',
      });
      results.colorPalette = colorResult.data?.[0]?.url;
    }

    // 生成周边 mockup
    if (params.elements.merchandise) {
      console.log('[IP Poster] Generating merchandise mockups...');
      const merchandisePrompt = promptTemplates.merchandiseMockup(params);
      const merchandiseResult = await generateImage({
        prompt: merchandisePrompt,
        size: '1024x1024',
        model: 'wanx2.1-t2i-turbo',
      });
      results.merchandiseMockup = merchandiseResult.data?.[0]?.url;
    }

    return results;
  } catch (error) {
    console.error('[IP Poster] Generation failed:', error);
    throw error;
  }
}

/**
 * 生成单张海报
 */
export async function generateSinglePoster(
  type: keyof typeof promptTemplates,
  params: IPPosterGenerationParams
): Promise<string> {
  const prompt = promptTemplates[type](params);
  
  const result = await generateImage({
    prompt,
    size: '1024x1024',
    model: 'wanx2.1-t2i-turbo',
  });

  return result.data?.[0]?.url || '';
}

/**
 * 批量生成海报
 */
export async function generatePosterBatch(
  types: (keyof typeof promptTemplates)[],
  params: IPPosterGenerationParams
): Promise<Partial<IPPosterGenerationResult>> {
  const results: Partial<IPPosterGenerationResult> = {};

  await Promise.all(
    types.map(async (type) => {
      try {
        const url = await generateSinglePoster(type, params);
        switch (type) {
          case 'mainVisual':
            results.mainPoster = url;
            break;
          case 'threeViews':
            results.threeViews = url;
            break;
          case 'emojiSheet':
            results.emojiSheet = url;
            break;
          case 'actionSheet':
            results.actionSheet = url;
            break;
          case 'colorPalette':
            results.colorPalette = url;
            break;
          case 'merchandiseMockup':
            results.merchandiseMockup = url;
            break;
        }
      } catch (error) {
        console.error(`[IP Poster] Failed to generate ${type}:`, error);
      }
    })
  );

  return results;
}

export default {
  generateIPPoster,
  generateSinglePoster,
  generatePosterBatch,
};
