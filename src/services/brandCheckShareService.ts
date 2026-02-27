/**
 * 品牌检查结果分享服务
 * 用于生成分享到社群的卡片内容
 */

export interface BrandCheckShareData {
  brandName: string;
  culturalScore: number;
  consistencyScore: number;
  consistencyDetails: {
    item: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
  }[];
  culturalElements: string[];
  suggestions: string[];
  imageUrl?: string;
}

export interface ShareContent {
  title: string;
  content: string;
  htmlContent: string;
  tags: string[];
}

class BrandCheckShareService {
  /**
   * 生成分享文本内容
   */
  generateShareText(data: BrandCheckShareData): ShareContent {
    const { brandName, culturalScore, consistencyScore, consistencyDetails, culturalElements, suggestions } = data;
    
    // 计算总体评价
    const avgScore = Math.round((culturalScore + consistencyScore) / 2);
    let evaluation = '';
    if (avgScore >= 85) {
      evaluation = '优秀';
    } else if (avgScore >= 70) {
      evaluation = '良好';
    } else if (avgScore >= 60) {
      evaluation = '及格';
    } else {
      evaluation = '待改进';
    }
    
    // 生成标题
    const title = `【品牌设计评估】${brandName || '我的设计'}获得了${avgScore}分！`;
    
    // 生成内容
    const lines: string[] = [];
    lines.push(`🏛️ 文化纯正度：${culturalScore}分`);
    lines.push(`🛡️ 品牌一致性：${consistencyScore}分`);
    lines.push(`📊 综合评级：${evaluation}`);
    lines.push('');
    
    // 添加检查详情
    if (consistencyDetails.length > 0) {
      lines.push('📋 检查详情：');
      consistencyDetails.forEach(detail => {
        const icon = detail.status === 'pass' ? '✅' : detail.status === 'warn' ? '⚠️' : '❌';
        lines.push(`${icon} ${detail.item}：${detail.message}`);
      });
      lines.push('');
    }
    
    // 添加文化元素
    if (culturalElements.length > 0) {
      lines.push(`🎨 检测到的文化元素：${culturalElements.join('、')}`);
      lines.push('');
    }
    
    // 添加建议
    if (suggestions.length > 0) {
      lines.push('💡 改进建议：');
      suggestions.slice(0, 3).forEach((suggestion, index) => {
        lines.push(`${index + 1}. ${suggestion}`);
      });
      lines.push('');
    }
    
    lines.push('—— 来自津脉智坊品牌设计评估工具');
    
    const content = lines.join('\n');
    
    // 生成HTML内容（用于富文本展示）
    const htmlContent = this.generateHtmlContent(data, evaluation);
    
    // 生成标签
    const tags = ['品牌设计', '文化评估', '设计分享', ...culturalElements].slice(0, 5);
    
    return {
      title,
      content,
      htmlContent,
      tags
    };
  }
  
  /**
   * 生成HTML格式的分享内容
   */
  private generateHtmlContent(data: BrandCheckShareData, evaluation: string): string {
    const { culturalScore, consistencyScore, consistencyDetails, culturalElements, suggestions } = data;
    
    const culturalColor = culturalScore >= 80 ? '#22c55e' : culturalScore >= 60 ? '#eab308' : '#ef4444';
    const consistencyColor = consistencyScore >= 80 ? '#22c55e' : consistencyScore >= 60 ? '#eab308' : '#ef4444';
    
    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #fbbf24;">🏛️ 品牌设计评估报告</h2>
          <p style="margin: 0; color: #94a3b8; font-size: 14px;">基于天津文化知识库智能评估</p>
        </div>
        
        <div style="display: flex; justify-content: space-around; margin-bottom: 24px;">
          <div style="text-align: center; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; flex: 1; margin: 0 8px;">
            <div style="font-size: 32px; font-weight: bold; color: ${culturalColor};">${culturalScore}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">文化纯正度</div>
          </div>
          <div style="text-align: center; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; flex: 1; margin: 0 8px;">
            <div style="font-size: 32px; font-weight: bold; color: ${consistencyColor};">${consistencyScore}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">品牌一致性</div>
          </div>
          <div style="text-align: center; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; flex: 1; margin: 0 8px;">
            <div style="font-size: 32px; font-weight: bold; color: #fbbf24;">${evaluation}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">综合评级</div>
          </div>
        </div>
        
        ${consistencyDetails.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin: 0 0 12px 0; color: #fbbf24;">📋 检查详情</h3>
          ${consistencyDetails.map(detail => {
            const color = detail.status === 'pass' ? '#22c55e' : detail.status === 'warn' ? '#eab308' : '#ef4444';
            const icon = detail.status === 'pass' ? '✓' : detail.status === 'warn' ? '!' : '✕';
            return `
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;">
                <span style="width: 24px; height: 24px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">${icon}</span>
                <div>
                  <div style="font-weight: 500; font-size: 14px;">${detail.item}</div>
                  <div style="font-size: 12px; color: #94a3b8;">${detail.message}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        ` : ''}
        
        ${culturalElements.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin: 0 0 12px 0; color: #fbbf24;">🎨 文化元素</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${culturalElements.map(el => `
              <span style="padding: 6px 12px; background: rgba(251, 191, 36, 0.2); color: #fbbf24; border-radius: 20px; font-size: 12px;">${el}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        ${suggestions.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin: 0 0 12px 0; color: #fbbf24;">💡 改进建议</h3>
          ${suggestions.slice(0, 3).map((suggestion, i) => `
            <div style="padding: 10px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; border-radius: 0 8px 8px 0; margin-bottom: 8px; font-size: 13px; color: #cbd5e1;">
              ${i + 1}. ${suggestion}
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <div style="text-align: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="margin: 0; font-size: 12px; color: #64748b;">—— 来自津脉智坊品牌设计评估工具 ——</p>
        </div>
      </div>
    `;
  }
  
  /**
   * 生成分享图片（使用Canvas）
   */
  async generateShareImage(data: BrandCheckShareData): Promise<string | null> {
    // 在实际项目中，这里可以使用 html2canvas 或其他库生成图片
    // 这里返回一个模拟的图片URL
    return data.imageUrl || null;
  }
  
  /**
   * 生成社群帖子数据
   */
  generateCommunityPost(data: BrandCheckShareData): {
    title: string;
    content: string;
    tags: string[];
    type: 'design_evaluation';
    metadata: {
      culturalScore: number;
      consistencyScore: number;
      brandName: string;
    };
  } {
    const shareContent = this.generateShareText(data);
    
    return {
      title: shareContent.title,
      content: shareContent.content,
      tags: shareContent.tags,
      type: 'design_evaluation',
      metadata: {
        culturalScore: data.culturalScore,
        consistencyScore: data.consistencyScore,
        brandName: data.brandName
      }
    };
  }
  
  /**
   * 生成聊天消息内容
   */
  generateChatMessage(data: BrandCheckShareData): {
    text: string;
    richText: string;
    preview: string;
  } {
    const shareContent = this.generateShareText(data);
    
    return {
      text: shareContent.content,
      richText: shareContent.htmlContent,
      preview: `品牌设计评估：文化${data.culturalScore}分 | 品牌${data.consistencyScore}分`
    };
  }
  
  /**
   * 复制到剪贴板
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    }
  }
}

export const brandCheckShareService = new BrandCheckShareService();
