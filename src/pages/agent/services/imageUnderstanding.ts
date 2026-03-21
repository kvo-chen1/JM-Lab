// 图像理解服务 - 图像分析和草图识别

import { callQwenChat } from '@/services/llm/chatProviders';
import { getVectorStore } from './vectorStore';

// 图像分析结果
export interface ImageAnalysisResult {
  description: string;
  objects: string[];
  colors: string[];
  style: string;
  mood: string;
  composition: string;
  tags: string[];
  confidence: number;
}

// 风格分析结果
export interface StyleAnalysisResult {
  style: string;
  styleConfidence: number;
  similarStyles: string[];
  characteristics: string[];
  recommendations: string[];
}

// 草图理解结果
export interface SketchUnderstandingResult {
  subject: string;
  elements: string[];
  suggestedStyle: string;
  suggestedColors: string[];
  improvementTips: string[];
}

// 视觉相似度结果
export interface VisualSimilarityResult {
  similarImages: {
    id: string;
    similarity: number;
    description: string;
  }[];
  commonFeatures: string[];
}

/**
 * 图像理解服务
 * 提供图像分析、风格识别、草图理解等功能
 */
export class ImageUnderstandingService {
  private vectorStore = getVectorStore();

  /**
   * 分析图像内容
   */
  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    try {
      // 使用AI分析图像
      const prompt = `分析这张图片的内容，返回JSON格式：
{
  "description": "详细描述",
  "objects": ["物体1", "物体2"],
  "colors": ["主色调"],
  "style": "风格",
  "mood": "氛围/情感",
  "composition": "构图",
  "tags": ["标签1", "标签2"],
  "confidence": 0-1
}

图片URL: ${imageUrl}`;

      const response = await callQwenChat({
        model: 'qwen-vl-plus', // 使用视觉模型
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      // 解析JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description || '无法描述',
          objects: parsed.objects || [],
          colors: parsed.colors || [],
          style: parsed.style || '未知',
          mood: parsed.mood || '中性',
          composition: parsed.composition || '标准',
          tags: parsed.tags || [],
          confidence: parsed.confidence || 0.5
        };
      }
    } catch (error) {
      console.error('[ImageUnderstanding] Analysis failed:', error);
    }

    // 返回默认结果
    return {
      description: '这是一张图片',
      objects: [],
      colors: [],
      style: '未知',
      mood: '中性',
      composition: '标准',
      tags: [],
      confidence: 0.3
    };
  }

  /**
   * 分析图像风格
   */
  async analyzeStyle(imageUrl: string): Promise<StyleAnalysisResult> {
    try {
      const prompt = `分析这张图片的设计风格，返回JSON格式：
{
  "style": "主要风格",
  "styleConfidence": 0-1,
  "similarStyles": ["相似风格1", "相似风格2"],
  "characteristics": ["特征1", "特征2"],
  "recommendations": ["建议1", "建议2"]
}

图片URL: ${imageUrl}`;

      const response = await callQwenChat({
        model: 'qwen-vl-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          style: parsed.style || '未知',
          styleConfidence: parsed.styleConfidence || 0.5,
          similarStyles: parsed.similarStyles || [],
          characteristics: parsed.characteristics || [],
          recommendations: parsed.recommendations || []
        };
      }
    } catch (error) {
      console.error('[ImageUnderstanding] Style analysis failed:', error);
    }

    return {
      style: '未知',
      styleConfidence: 0.3,
      similarStyles: [],
      characteristics: [],
      recommendations: ['尝试使用更清晰的参考图']
    };
  }

  /**
   * 理解草图
   */
  async understandSketch(imageUrl: string): Promise<SketchUnderstandingResult> {
    try {
      const prompt = `这是一张草图/线稿，请理解其内容并提供设计建议，返回JSON格式：
{
  "subject": "主题",
  "elements": ["元素1", "元素2"],
  "suggestedStyle": "建议风格",
  "suggestedColors": ["建议颜色1", "建议颜色2"],
  "improvementTips": ["改进建议1", "改进建议2"]
}

草图URL: ${imageUrl}`;

      const response = await callQwenChat({
        model: 'qwen-vl-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 800
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          subject: parsed.subject || '未识别',
          elements: parsed.elements || [],
          suggestedStyle: parsed.suggestedStyle || '彩色铅笔',
          suggestedColors: parsed.suggestedColors || ['暖色调'],
          improvementTips: parsed.improvementTips || []
        };
      }
    } catch (error) {
      console.error('[ImageUnderstanding] Sketch understanding failed:', error);
    }

    return {
      subject: '未识别',
      elements: [],
      suggestedStyle: '彩色铅笔',
      suggestedColors: ['暖色调', '柔和色'],
      improvementTips: ['可以尝试添加更多细节', '使用更清晰的线条']
    };
  }

  /**
   * 提取颜色方案
   */
  async extractColorPalette(imageUrl: string): Promise<{
    dominant: string[];
    accent: string[];
    palette: string[];
  }> {
    try {
      const prompt = `提取这张图片的主要颜色，返回JSON格式：
{
  "dominant": ["主色1", "主色2"],
  "accent": ["强调色1", "强调色2"],
  "palette": ["完整色板"]
}

图片URL: ${imageUrl}`;

      const response = await callQwenChat({
        model: 'qwen-vl-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          dominant: parsed.dominant || [],
          accent: parsed.accent || [],
          palette: parsed.palette || []
        };
      }
    } catch (error) {
      console.error('[ImageUnderstanding] Color extraction failed:', error);
    }

    return {
      dominant: ['#FF6B6B', '#4ECDC4'],
      accent: ['#FFE66D', '#1A535C'],
      palette: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#F7FFF7']
    };
  }

  /**
   * 生成基于参考图的设计建议
   */
  async generateDesignSuggestions(
    referenceImageUrl: string,
    designType: string
  ): Promise<{
    description: string;
    style: string;
    colorScheme: string[];
    keyElements: string[];
    prompt: string;
  }> {
    // 分析参考图
    const [analysis, style, colors] = await Promise.all([
      this.analyzeImage(referenceImageUrl),
      this.analyzeStyle(referenceImageUrl),
      this.extractColorPalette(referenceImageUrl)
    ]);

    // 生成设计建议
    const description = `基于参考图的设计风格：${style.style}，${analysis.description}`;
    
    // 构建生成Prompt
    const prompt = `设计一个${designType}，参考风格：${style.style}，` +
      `主要元素：${analysis.objects.join('、')}，` +
      `色彩方案：${colors.dominant.join('、')}，` +
      `氛围：${analysis.mood}`;

    return {
      description,
      style: style.style,
      colorScheme: colors.palette,
      keyElements: analysis.objects,
      prompt
    };
  }

  /**
   * 比较图像相似度
   */
  async compareImages(imageUrl1: string, imageUrl2: string): Promise<{
    similarity: number;
    commonElements: string[];
    differences: string[];
  }> {
    try {
      const prompt = `比较这两张图片的相似度，返回JSON格式：
{
  "similarity": 0-1,
  "commonElements": ["共同元素1"],
  "differences": ["差异1"]
}

图片1: ${imageUrl1}
图片2: ${imageUrl2}`;

      const response = await callQwenChat({
        model: 'qwen-vl-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          similarity: parsed.similarity || 0.5,
          commonElements: parsed.commonElements || [],
          differences: parsed.differences || []
        };
      }
    } catch (error) {
      console.error('[ImageUnderstanding] Comparison failed:', error);
    }

    return {
      similarity: 0.5,
      commonElements: [],
      differences: ['无法准确比较']
    };
  }

  /**
   * 生成图像描述（用于向量存储）
   */
  async generateImageDescription(imageUrl: string): Promise<string> {
    const analysis = await this.analyzeImage(imageUrl);
    
    return `${analysis.description}。风格：${analysis.style}。` +
      `色彩：${analysis.colors.join('、')}。` +
      `元素：${analysis.objects.join('、')}。` +
      `氛围：${analysis.mood}。` +
      `标签：${analysis.tags.join('、')}`;
  }

  /**
   * 将图像添加到向量存储
   */
  async indexImage(
    imageUrl: string,
    metadata: {
      title: string;
      type: 'reference' | 'sketch' | 'generated';
      tags?: string[];
    }
  ): Promise<string> {
    // 生成描述
    const description = await this.generateImageDescription(imageUrl);
    
    // 添加到向量存储
    const id = await this.vectorStore.addVector(description, {
      type: 'reference',
      tags: metadata.tags || [],
      imageUrl,
      title: metadata.title,
      ...metadata
    });

    console.log('[ImageUnderstanding] Indexed image:', id);
    return id;
  }

  /**
   * 搜索相似图像
   */
  async searchSimilarImages(
    queryImageUrl: string,
    limit: number = 5
  ): Promise<VisualSimilarityResult> {
    // 生成查询描述
    const description = await this.generateImageDescription(queryImageUrl);
    
    // 向量搜索
    const results = await this.vectorStore.searchSimilar(description, {
      limit,
      filter: (item) => item.metadata.type === 'reference'
    });

    return {
      similarImages: results.map(r => ({
        id: r.item.id,
        similarity: r.score,
        description: r.item.content.substring(0, 100)
      })),
      commonFeatures: results.length > 0 
        ? results[0].item.metadata.tags || []
        : []
    };
  }
}

// 导出单例
let imageUnderstandingInstance: ImageUnderstandingService | null = null;

export function getImageUnderstandingService(): ImageUnderstandingService {
  if (!imageUnderstandingInstance) {
    imageUnderstandingInstance = new ImageUnderstandingService();
  }
  return imageUnderstandingInstance;
}

export function resetImageUnderstandingService(): void {
  imageUnderstandingInstance = null;
}
