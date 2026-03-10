/**
 * 实体提取器
 * 增强的NER（命名实体识别）功能，专门用于设计领域
 */

import { callQwenChat } from '@/services/llm/chatProviders';

// 实体类型定义
export enum EntityType {
  DESIGN_TYPE = 'DESIGN_TYPE',      // 设计类型
  STYLE = 'STYLE',                  // 风格
  COLOR = 'COLOR',                  // 颜色
  AUDIENCE = 'AUDIENCE',            // 目标受众
  USAGE_SCENARIO = 'USAGE_SCENARIO', // 使用场景
  ELEMENT = 'ELEMENT',              // 设计元素
  BRAND = 'BRAND',                  // 品牌相关
  SIZE = 'SIZE',                    // 尺寸规格
  TIME = 'TIME',                    // 时间要求
  BUDGET = 'BUDGET',                // 预算
  REFERENCE = 'REFERENCE',          // 参考/案例
  EMOTION = 'EMOTION',              // 情感/氛围
  MATERIAL = 'MATERIAL',            // 材质
  TECHNIQUE = 'TECHNIQUE',          // 技法
  THEME = 'THEME'                   // 主题
}

// 实体定义
export interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
  normalizedValue?: string;  // 标准化后的值
  synonyms?: string[];       // 同义词
}

// 实体提取结果
export interface EntityExtractionResult {
  entities: Entity[];
  entityRelations: EntityRelation[];
  missingEntities: EntityType[];
  confidence: number;
}

// 实体关系
export interface EntityRelation {
  from: Entity;
  to: Entity;
  relation: string;
  confidence: number;
}

// 设计领域实体词典
const DESIGN_ENTITY_DICTIONARY: Record<EntityType, { keywords: string[]; patterns: RegExp[] }> = {
  [EntityType.DESIGN_TYPE]: {
    keywords: [
      'Logo', '标志', '商标', '海报', '宣传', '包装', '礼盒', 'IP', '形象', '角色', ' mascot',
      '品牌', 'VI', '视觉', '插画', '插图', '手绘', '动画', '视频', '动效', '表情包',
      '吉祥物', '卡通', '人物', '产品', '物料', '广告', '展板', '画册', '名片', '宣传单'
    ],
    patterns: [
      /(?:设计|做|画|创作).{0,5}(?:logo|标志|海报|包装|ip|形象|插画|动画)/i,
      /(?:logo|标志|海报|包装|ip|形象|插画|动画).{0,5}(?:设计|制作)/i
    ]
  },
  [EntityType.STYLE]: {
    keywords: [
      '可爱', '温馨', '治愈', '科技', '简约', '极简', '复古', '古风', '梦幻', '手绘',
      '现代', '传统', '国潮', '中国风', '日系', '欧美', '卡通风', '写实', '抽象',
      '扁平', '立体', '3D', '2.5D', '等距', '孟菲斯', '波普', '极简主义', '奢华',
      '高端', '亲民', '活泼', '严肃', '专业', '休闲', '商务', '文艺', '清新', '暗黑'
    ],
    patterns: [
      /(.{1,6})风(?:格|)/,
      /(.{1,6})样式/,
      /(.{1,6})感觉/,
      /(.{1,6})氛围/
    ]
  },
  [EntityType.COLOR]: {
    keywords: [
      '红色', '蓝色', '绿色', '黄色', '橙色', '紫色', '粉色', '黑色', '白色', '灰色',
      '金色', '银色', '棕色', '青色', '米色', '透明', '渐变', '单色', '彩色', '黑白',
      '暖色', '冷色', '亮色', '暗色', '鲜艳', '柔和', '马卡龙', '莫兰迪', '霓虹'
    ],
    patterns: [
      /(.{1,4})色/,
      /(.{1,6})配色/,
      /(.{1,6})色调/,
      /(.{1,6})色彩/
    ]
  },
  [EntityType.AUDIENCE]: {
    keywords: [
      '儿童', '孩子', '小朋友', '学生', '年轻人', '青年', '大学生', '职场', '白领',
      '商务', '企业', '公司', 'B2B', '女性', '女生', '女士', '女孩', '男性', '男生',
      '男士', '老人', '中老年', '家庭', '父母', '妈妈', '爸爸', '情侣', '单身',
      '高端', '大众', '大众市场', '小众', '发烧友', '爱好者', '专业人士'
    ],
    patterns: [
      /面向(.{1,10})/,
      /针对(.{1,10})/,
      /(.{1,10})群体/,
      /(.{1,10})用户/,
      /(.{1,10})人群/
    ]
  },
  [EntityType.USAGE_SCENARIO]: {
    keywords: [
      '线上', '线下', '印刷', '喷绘', '雕刻', '刺绣', '烫金', 'UV', '丝印', '数码',
      '网页', 'APP', '小程序', '公众号', '小红书', '抖音', '快手', 'B站', '微博',
      '朋友圈', '社交媒体', '电商', '淘宝', '天猫', '京东', '拼多多', '亚马逊',
      '展会', '活动', '门店', '商场', '超市', '专卖店', '户外广告', '室内', '宣传'
    ],
    patterns: [
      /用于(.{1,10})/,
      /用在(.{1,10})/,
      /(.{1,10})使用/,
      /(.{1,10})场景/
    ]
  },
  [EntityType.ELEMENT]: {
    keywords: [
      '花朵', '动物', '植物', '山水', '云纹', '龙凤', '麒麟', '狮子', '鱼', '鸟',
      '蝴蝶', '熊猫', '猫', '狗', '兔子', '鹿', '马', '牛', '几何', '线条',
      '圆形', '方形', '三角形', '波浪', '星星', '月亮', '太阳', '云朵', '雨滴',
      '传统纹样', '吉祥图案', '福字', '寿字', '喜字', '灯笼', '扇子', '旗袍',
      '建筑', '桥梁', '塔', '宫殿', '园林', '书法', '印章', '剪纸', '年画'
    ],
    patterns: [
      /加上(.{1,6})/,
      /包含(.{1,6})/,
      /有(.{1,6})/,
      /(.{1,6})元素/
    ]
  },
  [EntityType.BRAND]: {
    keywords: [
      '品牌', '商标', 'Logo', 'VI', '视觉识别', '品牌色', '品牌字', 'Slogan',
      '标语', '口号', '品牌价值', '品牌故事', '品牌调性', '品牌形象', '品牌升级'
    ],
    patterns: [
      /品牌(.{1,8})/,
      /(.{1,8})品牌/
    ]
  },
  [EntityType.SIZE]: {
    keywords: [
      '尺寸', '大小', '规格', 'A4', 'A3', 'A5', '16开', '8开', '4开', '对开',
      '厘米', '毫米', '米', 'px', '像素', '分辨率', 'DPI', '300DPI', '72DPI',
      '正方形', '长方形', '竖版', '横版', '方形', '圆形', '16:9', '9:16', '1:1'
    ],
    patterns: [
      /(\d+).{0,3}(?:cm|mm|m|px|像素|厘米|毫米)/,
      /(\d+):(\d+)/,
      /尺寸(.{1,10})/,
      /大小(.{1,10})/
    ]
  },
  [EntityType.TIME]: {
    keywords: [
      '紧急', '加急', ' ASAP', '尽快', '马上', '立即', '今天', '明天', '后天',
      '本周', '下周', '本月', '下月', '三天', '一周', '两周', '一个月', '两个月',
      '季度', '年底', '年初', ' deadline', '截止日期', '交付时间'
    ],
    patterns: [
      /(\d+).{0,3}(?:天|周|月|年)/,
      /(\d+)号/,
      /(\d{4}).{0,1}(\d{1,2}).{0,1}(\d{1,2})/
    ]
  },
  [EntityType.BUDGET]: {
    keywords: [
      '预算', '价格', '费用', '成本', '投入', '元', '块', '万', '千', '百',
      '便宜', '实惠', '经济', '高端', '豪华', '免费', '低价', '高价', '中等价位'
    ],
    patterns: [
      /(\d+).{0,3}(?:元|块|万|k|K)/,
      /预算(.{1,10})/,
      /价格(.{1,10})/,
      /(.{1,6})价位/
    ]
  },
  [EntityType.REFERENCE]: {
    keywords: [
      '参考', '案例', '例子', '示例', '样例', '类似', '像', '参照', '借鉴',
      '竞品', '对手', '同行', '行业标杆', '优秀案例', '成功案例', '经典案例'
    ],
    patterns: [
      /参考(.{1,10})/,
      /像(.{1,10})/,
      /类似(.{1,10})/,
      /(.{1,10})风格/
    ]
  },
  [EntityType.EMOTION]: {
    keywords: [
      '温暖', '亲切', '专业', '严肃', '活泼', '轻松', '愉快', '悲伤', '忧郁',
      '激情', '冷静', '理性', '感性', '浪漫', '现实', '梦幻', '神秘', '开放',
      '保守', '创新', '传统', '时尚', '过时', '前卫', '经典', '永恒'
    ],
    patterns: [
      /(.{1,6})感/,
      /(.{1,6})氛围/,
      /(.{1,6})调性/,
      /传达(.{1,6})/
    ]
  },
  [EntityType.MATERIAL]: {
    keywords: [
      '纸质', '卡纸', '铜版纸', '特种纸', '牛皮纸', '瓦楞纸', '塑料', '金属',
      '木质', '玻璃', '陶瓷', '布料', '皮革', '亚克力', 'PVC', 'PET', '铝箔',
      '烫金', 'UV', '覆膜', '压纹', '凹凸', '镂空'
    ],
    patterns: [
      /(.{1,6})材质/,
      /(.{1,6})材料/,
      /(.{1,6})工艺/
    ]
  },
  [EntityType.TECHNIQUE]: {
    keywords: [
      '手绘', '板绘', '数码', '3D建模', 'C4D', 'Blender', 'PS', 'AI', '矢量',
      '位图', '摄影', '合成', '拼贴', '剪纸', '刺绣', '雕刻', '版画', '水墨',
      '油画', '水彩', '素描', '线稿', '涂鸦', '像素', '低多边形'
    ],
    patterns: [
      /(.{1,8})技法/,
      /(.{1,8})技术/,
      /(.{1,8})手法/,
      /用(.{1,8})做/
    ]
  },
  [EntityType.THEME]: {
    keywords: [
      '春节', '中秋', '端午', '圣诞', '元旦', '国庆', '情人节', '母亲节', '父亲节',
      '儿童节', '环保', '科技', '未来', '复古', '怀旧', '自然', '城市', '海洋',
      '星空', '宇宙', '森林', '动物', '植物', '美食', '旅行', '运动', '音乐',
      '艺术', '文化', '历史', '传统', '现代', '时尚'
    ],
    patterns: [
      /(.{1,6})主题/,
      /(.{1,6})题材/,
      /关于(.{1,6})/
    ]
  }
};

/**
 * 实体提取器类
 */
export class EntityExtractor {
  /**
   * 基于规则提取实体
   */
  extractByRules(input: string): Entity[] {
    const entities: Entity[] = [];
    const normalizedInput = input.toLowerCase();

    for (const [entityType, dictionary] of Object.entries(DESIGN_ENTITY_DICTIONARY)) {
      // 关键词匹配
      for (const keyword of dictionary.keywords) {
        const index = normalizedInput.indexOf(keyword.toLowerCase());
        if (index !== -1) {
          // 检查是否已存在（避免重复）
          const exists = entities.some(e => 
            e.type === entityType && 
            e.value === keyword &&
            Math.abs((e.startIndex || 0) - index) < 5
          );
          
          if (!exists) {
            entities.push({
              type: entityType as EntityType,
              value: keyword,
              confidence: 0.7,
              startIndex: index,
              endIndex: index + keyword.length,
              normalizedValue: this.normalizeEntity(entityType as EntityType, keyword)
            });
          }
        }
      }

      // 正则模式匹配
      for (const pattern of dictionary.patterns) {
        const matches = input.matchAll(new RegExp(pattern, 'gi'));
        for (const match of matches) {
          if (match[1]) {
            const value = match[1].trim();
            if (value.length > 0 && value.length < 20) {
              entities.push({
                type: entityType as EntityType,
                value: value,
                confidence: 0.6,
                startIndex: match.index,
                endIndex: (match.index || 0) + match[0].length,
                normalizedValue: this.normalizeEntity(entityType as EntityType, value)
              });
            }
          }
        }
      }
    }

    // 去重和排序
    return this.deduplicateEntities(entities);
  }

  /**
   * 使用LLM提取实体
   */
  async extractByLLM(input: string): Promise<Entity[]> {
    try {
      const prompt = `从以下用户输入中提取所有设计相关的实体信息。

用户输入："${input}"

请提取以下类型的实体（如果有）：
- DESIGN_TYPE: 设计类型（Logo、海报、包装、IP形象等）
- STYLE: 风格（可爱、简约、复古、国潮等）
- COLOR: 颜色（红色、蓝色、暖色、渐变等）
- AUDIENCE: 目标受众（儿童、年轻人、商务人士等）
- USAGE_SCENARIO: 使用场景（线上、印刷、社交媒体等）
- ELEMENT: 设计元素（花朵、动物、几何图形等）
- BRAND: 品牌相关
- SIZE: 尺寸规格
- TIME: 时间要求
- BUDGET: 预算
- REFERENCE: 参考/案例
- EMOTION: 情感/氛围
- MATERIAL: 材质
- TECHNIQUE: 技法
- THEME: 主题

返回JSON格式：
{
  "entities": [
    {
      "type": "实体类型",
      "value": "原始值",
      "confidence": 0-1之间的置信度,
      "normalizedValue": "标准化后的值"
    }
  ]
}

注意：
1. 只提取明确提到的实体
2. 置信度根据明确程度给出
3. 标准化值应该是通用的、规范的表达`;

      const response = await callQwenChat({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: '你是一个专业的实体提取助手，擅长从设计需求中提取关键信息。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      // 解析JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.entities || [];
      }
    } catch (error) {
      console.error('[EntityExtractor] LLM extraction failed:', error);
    }

    return [];
  }

  /**
   * 综合提取（规则 + LLM）
   */
  async extract(input: string): Promise<EntityExtractionResult> {
    // 并行执行规则和LLM提取
    const [ruleEntities, llmEntities] = await Promise.all([
      Promise.resolve(this.extractByRules(input)),
      this.extractByLLM(input)
    ]);

    // 合并结果
    const mergedEntities = this.mergeEntities(ruleEntities, llmEntities);

    // 提取实体关系
    const relations = this.extractRelations(mergedEntities, input);

    // 识别缺失的实体类型
    const missingEntities = this.identifyMissingEntities(mergedEntities);

    // 计算整体置信度
    const confidence = mergedEntities.length > 0
      ? mergedEntities.reduce((sum, e) => sum + e.confidence, 0) / mergedEntities.length
      : 0;

    return {
      entities: mergedEntities,
      entityRelations: relations,
      missingEntities,
      confidence
    };
  }

  /**
   * 标准化实体值
   */
  private normalizeEntity(type: EntityType, value: string): string {
    const normalizationMap: Record<string, Record<string, string>> = {
      [EntityType.DESIGN_TYPE]: {
        'logo': 'Logo',
        '标志': 'Logo',
        '商标': 'Logo',
        'ip': 'IP形象',
        '形象': 'IP形象',
        '角色': 'IP形象',
        'mascot': 'IP形象',
        '吉祥物': 'IP形象'
      },
      [EntityType.STYLE]: {
        '可爱': '可爱风',
        '简约': '简约风',
        '极简': '极简风',
        '复古': '复古风',
        '国潮': '国潮风',
        '中国风': '中国风',
        '日系': '日系风',
        '欧美': '欧美风'
      },
      [EntityType.COLOR]: {
        '红': '红色',
        '蓝': '蓝色',
        '绿': '绿色',
        '黄': '黄色',
        '暖色': '暖色调',
        '冷色': '冷色调'
      }
    };

    const map = normalizationMap[type];
    if (map) {
      return map[value.toLowerCase()] || value;
    }

    return value;
  }

  /**
   * 去重实体
   */
  private deduplicateEntities(entities: Entity[]): Entity[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const key = `${entity.type}:${entity.value}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    }).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 合并实体（规则和LLM结果）
   */
  private mergeEntities(ruleEntities: Entity[], llmEntities: Entity[]): Entity[] {
    const merged = new Map<string, Entity>();

    // 添加规则提取的实体
    for (const entity of ruleEntities) {
      const key = `${entity.type}:${entity.value}`;
      merged.set(key, entity);
    }

    // 合并LLM提取的实体
    for (const entity of llmEntities) {
      const key = `${entity.type}:${entity.value}`;
      const existing = merged.get(key);
      
      if (existing) {
        // 如果都存在，取更高置信度
        if (entity.confidence > existing.confidence) {
          merged.set(key, { ...entity, confidence: Math.max(entity.confidence, 0.8) });
        }
      } else {
        merged.set(key, entity);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * 提取实体关系
   */
  private extractRelations(entities: Entity[], input: string): EntityRelation[] {
    const relations: EntityRelation[] = [];

    // 简单的共现关系
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];

        // 检查是否在文本中靠近
        const indexA = entityA.startIndex || 0;
        const indexB = entityB.startIndex || 0;
        const distance = Math.abs(indexA - indexB);

        if (distance < 20) {
          relations.push({
            from: entityA,
            to: entityB,
            relation: 'associated',
            confidence: 1 - distance / 20
          });
        }
      }
    }

    return relations;
  }

  /**
   * 识别缺失的实体类型
   */
  private identifyMissingEntities(entities: Entity[]): EntityType[] {
    const presentTypes = new Set(entities.map(e => e.type));
    const importantTypes = [
      EntityType.DESIGN_TYPE,
      EntityType.STYLE,
      EntityType.AUDIENCE,
      EntityType.USAGE_SCENARIO
    ];

    return importantTypes.filter(type => !presentTypes.has(type));
  }

  /**
   * 批量提取
   */
  async extractBatch(inputs: string[]): Promise<EntityExtractionResult[]> {
    return Promise.all(inputs.map(input => this.extract(input)));
  }

  /**
   * 获取实体建议
   * 根据已提取的实体，建议可能需要的其他实体
   */
  getEntitySuggestions(extractedEntities: Entity[]): Array<{
    type: EntityType;
    reason: string;
    examples: string[];
  }> {
    const presentTypes = new Set(extractedEntities.map(e => e.type));
    const suggestions: Array<{
      type: EntityType;
      reason: string;
      examples: string[];
    }> = [];

    // 设计类型相关建议
    if (presentTypes.has(EntityType.DESIGN_TYPE)) {
      if (!presentTypes.has(EntityType.STYLE)) {
        suggestions.push({
          type: EntityType.STYLE,
          reason: '确定设计风格有助于把握整体方向',
          examples: ['可爱', '简约', '复古', '国潮', '科技']
        });
      }
      if (!presentTypes.has(EntityType.AUDIENCE)) {
        suggestions.push({
          type: EntityType.AUDIENCE,
          reason: '了解目标受众可以做出更精准的设计',
          examples: ['儿童', '年轻人', '商务人士', '女性']
        });
      }
    }

    // 风格相关建议
    if (presentTypes.has(EntityType.STYLE) && !presentTypes.has(EntityType.COLOR)) {
      suggestions.push({
        type: EntityType.COLOR,
        reason: '配色方案是风格的重要组成部分',
        examples: ['暖色调', '冷色调', '单色', '渐变色']
      });
    }

    return suggestions;
  }
}

// 导出单例
let extractorInstance: EntityExtractor | null = null;

export function getEntityExtractor(): EntityExtractor {
  if (!extractorInstance) {
    extractorInstance = new EntityExtractor();
  }
  return extractorInstance;
}

export function resetEntityExtractor(): void {
  extractorInstance = null;
}
