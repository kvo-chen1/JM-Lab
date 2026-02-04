import { llmService } from './llmService';

interface AIRecommendationService {
  getRecommendations(prompt: string): Promise<string[]>;
  getTagRecommendations(tags: string[]): Promise<string[]>;
  generateCreativeDirections(prompt: string): Promise<string[]>;
}

class AIRecommendationServiceImpl implements AIRecommendationService {
  private cache: Record<string, { recommendations: string[]; timestamp: number }> = {};
  private cacheExpiry = 5 * 60 * 1000; // 5分钟缓存

  async getRecommendations(prompt: string): Promise<string[]> {
    if (!prompt.trim()) {
      return this.getDefaultRecommendations();
    }

    // 检查缓存
    const cacheKey = `prompt_${prompt}`;
    if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheExpiry) {
      return this.cache[cacheKey].recommendations;
    }

    try {
      // 调用 LLM 服务获取推荐
      const response = await llmService.generateText({
        prompt: `基于以下输入，生成5个相关的创意建议，每个建议不超过20字：\n${prompt}`,
        max_tokens: 200,
        temperature: 0.7
      });

      // 解析响应
      const recommendations = this.parseRecommendations(response.text);
      
      // 缓存结果
      this.cache[cacheKey] = {
        recommendations,
        timestamp: Date.now()
      };

      return recommendations;
    } catch (error) {
      console.error('获取 AI 建议失败:', error);
      return this.getFallbackRecommendations(prompt);
    }
  }

  async getTagRecommendations(tags: string[]): Promise<string[]> {
    if (tags.length === 0) {
      return [];
    }

    const cacheKey = `tags_${tags.sort().join('_')}`;
    if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheExpiry) {
      return this.cache[cacheKey].recommendations;
    }

    try {
      const response = await llmService.generateText({
        prompt: `基于以下标签，生成3个相关的创意建议，每个建议不超过15字：\n${tags.join(', ')}`,
        max_tokens: 150,
        temperature: 0.7
      });

      const recommendations = this.parseRecommendations(response.text);
      
      this.cache[cacheKey] = {
        recommendations,
        timestamp: Date.now()
      };

      return recommendations;
    } catch (error) {
      console.error('获取标签推荐失败:', error);
      return [];
    }
  }

  async generateCreativeDirections(prompt: string): Promise<string[]> {
    if (!prompt.trim()) {
      return [];
    }

    try {
      const response = await llmService.generateText({
        prompt: `基于以下输入，生成4个创意方向，每个方向不超过10字：\n${prompt}`,
        max_tokens: 150,
        temperature: 0.8
      });

      return this.parseRecommendations(response.text);
    } catch (error) {
      console.error('生成创意方向失败:', error);
      return [];
    }
  }

  private getDefaultRecommendations(): string[] {
    return [
      '杨柳青风格的现代包装设计',
      '天津之眼与赛博朋克融合',
      '泥人张风格的3D角色建模',
      '海河夜景的国潮插画',
      '传统纹样的现代应用'
    ];
  }

  private getFallbackRecommendations(prompt: string): string[] {
    const keywords = this.extractKeywords(prompt);
    const baseRecommendations = [
      `${keywords[0]}风格的创意设计`,
      `${keywords[0]}与现代元素融合`,
      `${keywords[0]}主题的视觉表达`,
      `${keywords[0]}文化的创新应用`,
      `基于${keywords[0]}的艺术创作`
    ];
    return baseRecommendations.slice(0, 5);
  }

  private extractKeywords(text: string): string[] {
    // 简单的关键词提取
    const stopWords = ['的', '了', '和', '与', '或', '是', '在', '有', '为'];
    return text
      .split(/\s+|,|，|、/)
      .filter(word => word.length > 1 && !stopWords.includes(word))
      .slice(0, 3);
  }

  private parseRecommendations(text: string): string[] {
    // 解析 LLM 响应
    const lines = text.split(/\n|\d+\.|\d+、/).filter(line => line.trim());
    return lines.slice(0, 5).map(line => line.trim());
  }
}

export const aiRecommendationService = new AIRecommendationServiceImpl();
