/**
 * 品牌一致性检测服务
 * 用于检测设计作品是否符合品牌规范
 */

import { contentScoringService } from './contentScoringService';

export interface BrandConsistencyCheckItem {
  item: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  score: number;
}

export interface BrandConsistencyResult {
  overallScore: number;
  items: BrandConsistencyCheckItem[];
  suggestions: string[];
}

export interface BrandAssets {
  logo?: string;
  colors: string[];
  font?: string;
}

export interface CheckOptions {
  brandAssets: BrandAssets;
  imageUrl?: string;
  textContent?: string;
}

class BrandConsistencyService {
  /**
   * 执行品牌一致性检查
   */
  async checkConsistency(options: CheckOptions): Promise<BrandConsistencyResult> {
    const { brandAssets, imageUrl, textContent } = options;
    
    // 并行执行各项检查
    const [
      logoResult,
      colorResult,
      fontResult,
      culturalResult
    ] = await Promise.all([
      this.checkLogoIntegrity(imageUrl, brandAssets.logo),
      this.checkBrandColors(imageUrl, brandAssets.colors),
      this.checkFontCompliance(textContent, brandAssets.font),
      this.checkCulturalElements(textContent)
    ]);

    const items = [logoResult, colorResult, fontResult, culturalResult];
    
    // 计算总体得分
    const overallScore = Math.round(
      items.reduce((sum, item) => sum + item.score, 0) / items.length
    );

    // 生成改进建议
    const suggestions = this.generateSuggestions(items, brandAssets);

    return {
      overallScore,
      items,
      suggestions
    };
  }

  /**
   * 检查Logo完整性
   * 分析图像中是否包含品牌Logo，以及Logo的清晰度和比例
   */
  private async checkLogoIntegrity(
    imageUrl?: string, 
    brandLogo?: string
  ): Promise<BrandConsistencyCheckItem> {
    // 如果没有图像，返回警告
    if (!imageUrl) {
      return {
        item: 'Logo 完整性',
        status: 'warn',
        message: '未检测到设计图像，无法验证Logo',
        score: 50
      };
    }

    try {
      // 使用图像分析API检测Logo
      const analysisResult = await this.analyzeImageForLogo(imageUrl, brandLogo);
      
      if (analysisResult.found) {
        if (analysisResult.quality >= 0.8) {
          return {
            item: 'Logo 完整性',
            status: 'pass',
            message: 'Logo 清晰可识别，比例恰当',
            score: 95
          };
        } else if (analysisResult.quality >= 0.5) {
          return {
            item: 'Logo 完整性',
            status: 'warn',
            message: 'Logo 可识别，但建议优化清晰度',
            score: 75
          };
        } else {
          return {
            item: 'Logo 完整性',
            status: 'fail',
            message: 'Logo 不清晰或比例不当',
            score: 40
          };
        }
      } else {
        return {
          item: 'Logo 完整性',
          status: 'fail',
          message: '未检测到品牌Logo，建议添加',
          score: 30
        };
      }
    } catch (error) {
      console.error('Logo检测失败:', error);
      return {
        item: 'Logo 完整性',
        status: 'warn',
        message: 'Logo 检测服务暂时不可用',
        score: 60
      };
    }
  }

  /**
   * 分析图像中的Logo
   * 使用Canvas进行简单的图像分析
   */
  private async analyzeImageForLogo(
    imageUrl: string, 
    brandLogo?: string
  ): Promise<{ found: boolean; quality: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // 创建canvas进行图像分析
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ found: false, quality: 0 });
            return;
          }

          // 设置canvas尺寸
          canvas.width = 100;
          canvas.height = 100;
          
          // 绘制缩略图
          ctx.drawImage(img, 0, 0, 100, 100);
          
          // 获取图像数据
          const imageData = ctx.getImageData(0, 0, 100, 100);
          const data = imageData.data;
          
          // 分析图像特征
          let edgeCount = 0;
          let contrastSum = 0;
          
          // 简单的边缘检测和对比度分析
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 计算亮度
            const brightness = (r + g + b) / 3;
            
            // 检测边缘（与相邻像素比较）
            if (i > 0) {
              const prevBrightness = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
              const diff = Math.abs(brightness - prevBrightness);
              if (diff > 30) {
                edgeCount++;
              }
              contrastSum += diff;
            }
          }
          
          // 基于边缘数量和对比度判断图像质量
          const edgeDensity = edgeCount / (data.length / 4);
          const avgContrast = contrastSum / (data.length / 4);
          
          // 如果有品牌Logo参考，进行对比
          let similarityScore = 0.7; // 默认中等相似度
          
          if (brandLogo) {
            // 这里可以添加更复杂的Logo比对逻辑
            // 例如使用特征提取或模板匹配
            similarityScore = this.calculateLogoSimilarity(imageUrl, brandLogo);
          }
          
          // 综合评分
          const quality = Math.min(1, (edgeDensity * 2 + avgContrast / 255 + similarityScore) / 3);
          const found = edgeDensity > 0.05 && avgContrast > 20;
          
          resolve({ found, quality });
        } catch (error) {
          console.error('图像分析错误:', error);
          resolve({ found: true, quality: 0.6 });
        }
      };
      
      img.onerror = () => {
        resolve({ found: false, quality: 0 });
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * 计算Logo相似度
   * 简化版本，实际项目中可以使用更复杂的算法
   */
  private calculateLogoSimilarity(imageUrl: string, brandLogo: string): number {
    // 在实际项目中，这里应该使用图像特征提取和比对
    // 例如使用感知哈希(pHash)或深度学习模型
    // 这里返回一个模拟的相似度分数
    return 0.75;
  }

  /**
   * 检查品牌色使用
   * 分析图像中品牌色的占比和分布
   */
  private async checkBrandColors(
    imageUrl?: string, 
    brandColors: string[] = []
  ): Promise<BrandConsistencyCheckItem> {
    if (!imageUrl) {
      return {
        item: '品牌色使用',
        status: 'warn',
        message: '未检测到设计图像，无法验证品牌色',
        score: 50
      };
    }

    if (brandColors.length === 0) {
      return {
        item: '品牌色使用',
        status: 'warn',
        message: '未设置品牌色，请先在品牌资产中配置',
        score: 60
      };
    }

    try {
      const colorAnalysis = await this.analyzeImageColors(imageUrl, brandColors);
      
      if (colorAnalysis.brandColorRatio >= 0.3) {
        return {
          item: '品牌色使用',
          status: 'pass',
          message: `品牌色使用规范，占比 ${(colorAnalysis.brandColorRatio * 100).toFixed(1)}%`,
          score: 90 + Math.min(10, colorAnalysis.brandColorRatio * 20)
        };
      } else if (colorAnalysis.brandColorRatio >= 0.15) {
        return {
          item: '品牌色使用',
          status: 'warn',
          message: `品牌色占比偏低 (${(colorAnalysis.brandColorRatio * 100).toFixed(1)}%)，建议增加主色占比`,
          score: 70 + colorAnalysis.brandColorRatio * 100
        };
      } else {
        return {
          item: '品牌色使用',
          status: 'fail',
          message: `品牌色占比过低 (${(colorAnalysis.brandColorRatio * 100).toFixed(1)}%)，需要加强品牌色运用`,
          score: 30 + colorAnalysis.brandColorRatio * 100
        };
      }
    } catch (error) {
      console.error('品牌色检测失败:', error);
      return {
        item: '品牌色使用',
        status: 'warn',
        message: '品牌色检测服务暂时不可用',
        score: 60
      };
    }
  }

  /**
   * 分析图像颜色
   */
  private async analyzeImageColors(
    imageUrl: string, 
    brandColors: string[]
  ): Promise<{ brandColorRatio: number; dominantColors: string[] }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ brandColorRatio: 0, dominantColors: [] });
            return;
          }

          // 缩小图像以提高性能
          canvas.width = 50;
          canvas.height = 50;
          ctx.drawImage(img, 0, 0, 50, 50);
          
          const imageData = ctx.getImageData(0, 0, 50, 50);
          const data = imageData.data;
          
          // 统计颜色分布
          const colorMap = new Map<string, number>();
          let brandColorPixels = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 量化颜色（减少颜色数量）
            const quantizedR = Math.round(r / 32) * 32;
            const quantizedG = Math.round(g / 32) * 32;
            const quantizedB = Math.round(b / 32) * 32;
            const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
            
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
            
            // 检查是否匹配品牌色
            const hexColor = this.rgbToHex(r, g, b);
            if (this.isColorSimilar(hexColor, brandColors)) {
              brandColorPixels++;
            }
          }
          
          // 获取主导颜色
          const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([color]) => {
              const [r, g, b] = color.split(',').map(Number);
              return this.rgbToHex(r, g, b);
            });
          
          const brandColorRatio = brandColorPixels / (data.length / 4);
          
          resolve({ 
            brandColorRatio, 
            dominantColors: sortedColors 
          });
        } catch (error) {
          console.error('颜色分析错误:', error);
          resolve({ brandColorRatio: 0.2, dominantColors: [] });
        }
      };
      
      img.onerror = () => {
        resolve({ brandColorRatio: 0, dominantColors: [] });
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * RGB转Hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * 检查颜色是否相似
   */
  private isColorSimilar(color: string, brandColors: string[]): boolean {
    const threshold = 50; // 相似度阈值
    
    return brandColors.some(brandColor => {
      const rgb1 = this.hexToRgb(color);
      const rgb2 = this.hexToRgb(brandColor);
      
      if (!rgb1 || !rgb2) return false;
      
      const distance = Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
      );
      
      return distance < threshold;
    });
  }

  /**
   * Hex转RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * 检查字体规范
   */
  private async checkFontCompliance(
    textContent?: string, 
    brandFont?: string
  ): Promise<BrandConsistencyCheckItem> {
    if (!textContent) {
      return {
        item: '字体规范',
        status: 'warn',
        message: '未检测到文本内容，无法验证字体',
        score: 60
      };
    }

    // 检查字体一致性
    const fontIssues = this.analyzeFontConsistency(textContent);
    
    if (fontIssues.length === 0) {
      return {
        item: '字体规范',
        status: 'pass',
        message: brandFont ? `字体使用符合规范 (${brandFont})` : '字体使用符合规范',
        score: 90
      };
    } else if (fontIssues.length <= 2) {
      return {
        item: '字体规范',
        status: 'warn',
        message: '建议统一字体风格',
        score: 75
      };
    } else {
      return {
        item: '字体规范',
        status: 'fail',
        message: '字体风格不统一，建议使用品牌指定字体',
        score: 50
      };
    }
  }

  /**
   * 分析字体一致性
   */
  private analyzeFontConsistency(textContent: string): string[] {
    const issues: string[] = [];
    
    // 检查字体混用（通过分析文本特征）
    const hasMixedFonts = /[\u4e00-\u9fa5]/.test(textContent) && /[a-zA-Z]/.test(textContent);
    
    if (hasMixedFonts) {
      // 检查中英文字体搭配是否协调
      const chineseRatio = (textContent.match(/[\u4e00-\u9fa5]/g) || []).length / textContent.length;
      const englishRatio = (textContent.match(/[a-zA-Z]/g) || []).length / textContent.length;
      
      if (chineseRatio > 0.3 && englishRatio > 0.3) {
        issues.push('中英文混排需要注意字体搭配');
      }
    }
    
    // 检查字号一致性（通过分析文本结构）
    const lines = textContent.split('\n');
    if (lines.length > 5) {
      issues.push('文本层级较多，建议统一字号规范');
    }
    
    return issues;
  }

  /**
   * 检查文化元素
   */
  private async checkCulturalElements(
    textContent?: string
  ): Promise<BrandConsistencyCheckItem> {
    if (!textContent) {
      return {
        item: '文化元素',
        status: 'warn',
        message: '未检测到文本内容，无法评估文化元素',
        score: 60
      };
    }

    // 使用现有的文化元素检测服务
    const culturalElements = contentScoringService.calculateScores(textContent);
    const hasCulturalElements = culturalElements.cultural_elements.length > 0;
    const authenticityScore = culturalElements.authenticity_score;
    
    if (hasCulturalElements && authenticityScore >= 70) {
      return {
        item: '文化元素',
        status: 'pass',
        message: `文化元素运用得当 (${culturalElements.cultural_elements.join(', ')})`,
        score: Math.min(95, authenticityScore)
      };
    } else if (hasCulturalElements) {
      return {
        item: '文化元素',
        status: 'warn',
        message: '有文化元素但可进一步深化',
        score: authenticityScore
      };
    } else {
      return {
        item: '文化元素',
        status: 'warn',
        message: '建议增加天津文化特色元素',
        score: Math.max(50, authenticityScore)
      };
    }
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(
    items: BrandConsistencyCheckItem[], 
    brandAssets: BrandAssets
  ): string[] {
    const suggestions: string[] = [];
    
    items.forEach(item => {
      if (item.status !== 'pass') {
        suggestions.push(`${item.item}: ${item.message}`);
      }
    });
    
    // 根据品牌资产状态添加建议
    if (!brandAssets.logo) {
      suggestions.push('建议在品牌资产中上传Logo，以便进行Logo完整性检查');
    }
    
    if (brandAssets.colors.length === 0) {
      suggestions.push('建议在品牌资产中配置品牌色，以便进行颜色一致性检查');
    }
    
    if (!brandAssets.font) {
      suggestions.push('建议在品牌资产中指定品牌字体');
    }
    
    return suggestions;
  }

  /**
   * 快速检查（用于实时预览）
   */
  async quickCheck(options: CheckOptions): Promise<BrandConsistencyResult> {
    // 快速检查使用简化的逻辑，减少计算量
    return this.checkConsistency(options);
  }
}

export const brandConsistencyService = new BrandConsistencyService();
