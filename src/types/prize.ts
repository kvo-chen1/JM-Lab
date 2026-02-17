/**
 * 奖品/奖励系统类型定义
 * 支持活动奖品配置和展示
 */

import { BaseEntity } from './index';

// 奖品类型枚举
export enum PrizeType {
  PHYSICAL = 'physical',      // 实物奖品
  VIRTUAL = 'virtual',        // 虚拟奖品
  COUPON = 'coupon',          // 优惠券
  POINTS = 'points',          // 积分
  CASH = 'cash',              // 现金
  CERTIFICATE = 'certificate', // 证书
  BADGE = 'badge',            // 徽章
  OTHER = 'other',            // 其他
}

// 奖品组合类型
export enum PrizeCombinationType {
  SINGLE = 'single',          // 单一奖品
  COMPOUND = 'compound',      // 复合奖品 (奖品+奖品)
}

// 奖品等级
export enum PrizeLevel {
  FIRST = 1,      // 一等奖
  SECOND = 2,     // 二等奖
  THIRD = 3,      // 三等奖
  FOURTH = 4,     // 四等奖
  FIFTH = 5,      // 五等奖
  SPECIAL = 0,    // 特别奖
  CONSOLATION = 99, // 安慰奖/参与奖
}

// 基础奖品信息
export interface PrizeBase {
  id: string;
  name: string;              // 奖品名称
  description?: string;      // 奖品描述
  type: PrizeType;           // 奖品类型
  value?: number;            // 奖品价值（元）
  quantity: number;          // 奖品数量
  imageUrl?: string;         // 奖品图片
  icon?: string;             // 奖品图标（用于无图片时展示）
}

// 复合奖品中的子奖品
export interface SubPrize {
  prize: PrizeBase;
  quantity: number;
}

// 完整奖品定义（用于活动配置）
export interface Prize extends BaseEntity {
  eventId: string;           // 关联活动ID
  level: PrizeLevel;         // 奖品等级
  rankName: string;          // 名次名称（如"一等奖"、"金奖"等）
  combinationType: PrizeCombinationType; // 组合类型
  // 单一奖品
  singlePrize?: PrizeBase;
  // 复合奖品
  subPrizes?: SubPrize[];
  // 展示配置
  displayOrder: number;      // 展示顺序
  isHighlight?: boolean;     // 是否高亮展示
  highlightColor?: string;   // 高亮颜色
  // 状态
  status: 'active' | 'inactive';
}

// 奖品创建请求
export interface PrizeCreateRequest {
  level: PrizeLevel;
  rankName: string;
  combinationType: PrizeCombinationType;
  singlePrize?: Omit<PrizeBase, 'id'>;
  subPrizes?: Array<{
    prize: Omit<PrizeBase, 'id'>;
    quantity: number;
  }>;
  displayOrder?: number;
  isHighlight?: boolean;
  highlightColor?: string;
}

// 奖品更新请求
export interface PrizeUpdateRequest {
  level?: PrizeLevel;
  rankName?: string;
  combinationType?: PrizeCombinationType;
  singlePrize?: Partial<PrizeBase>;
  subPrizes?: Array<{
    prize: Partial<PrizeBase>;
    quantity: number;
  }>;
  displayOrder?: number;
  isHighlight?: boolean;
  highlightColor?: string;
  status?: 'active' | 'inactive';
}

// 奖品展示配置
export interface PrizeDisplayConfig {
  layout: 'grid' | 'list' | 'podium';  // 展示布局
  showValue: boolean;                   // 是否显示价值
  showQuantity: boolean;                // 是否显示数量
  animationEnabled: boolean;            // 是否启用动画
  highlightTopThree: boolean;           // 是否高亮前三名
  cardStyle: 'modern' | 'classic' | 'minimal'; // 卡片样式
}

// 奖品预览数据
export interface PrizePreview {
  prizes: Prize[];
  config: PrizeDisplayConfig;
}

// 奖品统计信息
export interface PrizeStatistics {
  totalPrizes: number;           // 奖品总数
  totalValue: number;            // 总价值
  prizeTypeDistribution: Record<PrizeType, number>; // 各类型数量
  levelDistribution: Record<number, number>; // 各等级数量
}

// 获奖者信息
export interface PrizeWinner {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  prizeId: string;
  prizeName: string;
  prizeLevel: PrizeLevel;
  wonAt: Date;
  claimed: boolean;
  claimedAt?: Date;
  shippingInfo?: {
    name: string;
    phone: string;
    address: string;
  };
}

// 奖品模板（用于快速创建）
export interface PrizeTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  prizes: PrizeCreateRequest[];
  isDefault: boolean;
}

// 默认奖品等级名称映射
export const PRIZE_LEVEL_NAMES: Record<PrizeLevel, string> = {
  [PrizeLevel.FIRST]: '一等奖',
  [PrizeLevel.SECOND]: '二等奖',
  [PrizeLevel.THIRD]: '三等奖',
  [PrizeLevel.FOURTH]: '四等奖',
  [PrizeLevel.FIFTH]: '五等奖',
  [PrizeLevel.SPECIAL]: '特别奖',
  [PrizeLevel.CONSOLATION]: '参与奖',
};

// 奖品类型名称映射
export const PRIZE_TYPE_NAMES: Record<PrizeType, string> = {
  [PrizeType.PHYSICAL]: '实物奖品',
  [PrizeType.VIRTUAL]: '虚拟奖品',
  [PrizeType.COUPON]: '优惠券',
  [PrizeType.POINTS]: '积分',
  [PrizeType.CASH]: '现金',
  [PrizeType.CERTIFICATE]: '证书',
  [PrizeType.BADGE]: '徽章',
  [PrizeType.OTHER]: '其他',
};

// 奖品类型图标映射
export const PRIZE_TYPE_ICONS: Record<PrizeType, string> = {
  [PrizeType.PHYSICAL]: 'Gift',
  [PrizeType.VIRTUAL]: 'Monitor',
  [PrizeType.COUPON]: 'Ticket',
  [PrizeType.POINTS]: 'Coins',
  [PrizeType.CASH]: 'Banknote',
  [PrizeType.CERTIFICATE]: 'Award',
  [PrizeType.BADGE]: 'Medal',
  [PrizeType.OTHER]: 'Package',
};

// 默认奖品颜色配置
export const PRIZE_LEVEL_COLORS: Record<PrizeLevel, string> = {
  [PrizeLevel.FIRST]: '#FFD700',    // 金色
  [PrizeLevel.SECOND]: '#C0C0C0',   // 银色
  [PrizeLevel.THIRD]: '#CD7F32',    // 铜色
  [PrizeLevel.FOURTH]: '#4A90E2',   // 蓝色
  [PrizeLevel.FIFTH]: '#7ED321',    // 绿色
  [PrizeLevel.SPECIAL]: '#FF6B6B',  // 红色
  [PrizeLevel.CONSOLATION]: '#9B9B9B', // 灰色
};

// 预设奖品模板
export const DEFAULT_PRIZE_TEMPLATES: PrizeTemplate[] = [
  {
    id: 'standard-3',
    name: '标准三奖项',
    description: '包含一、二、三等奖的标准配置',
    category: 'standard',
    isDefault: true,
    prizes: [
      {
        level: PrizeLevel.FIRST,
        rankName: '一等奖',
        combinationType: PrizeCombinationType.SINGLE,
        singlePrize: {
          name: '一等奖奖品',
          description: '价值丰厚的大奖',
          type: PrizeType.PHYSICAL,
          quantity: 1,
        },
        displayOrder: 1,
        isHighlight: true,
        highlightColor: PRIZE_LEVEL_COLORS[PrizeLevel.FIRST],
      },
      {
        level: PrizeLevel.SECOND,
        rankName: '二等奖',
        combinationType: PrizeCombinationType.SINGLE,
        singlePrize: {
          name: '二等奖奖品',
          description: '精美奖品',
          type: PrizeType.PHYSICAL,
          quantity: 3,
        },
        displayOrder: 2,
        isHighlight: true,
        highlightColor: PRIZE_LEVEL_COLORS[PrizeLevel.SECOND],
      },
      {
        level: PrizeLevel.THIRD,
        rankName: '三等奖',
        combinationType: PrizeCombinationType.SINGLE,
        singlePrize: {
          name: '三等奖奖品',
          description: '实用奖品',
          type: PrizeType.PHYSICAL,
          quantity: 5,
        },
        displayOrder: 3,
        isHighlight: true,
        highlightColor: PRIZE_LEVEL_COLORS[PrizeLevel.THIRD],
      },
    ],
  },
  {
    id: 'with-consolation',
    name: '含参与奖',
    description: '前三名加参与奖的配置',
    category: 'standard',
    isDefault: false,
    prizes: [
      {
        level: PrizeLevel.FIRST,
        rankName: '一等奖',
        combinationType: PrizeCombinationType.SINGLE,
        singlePrize: {
          name: '一等奖奖品',
          type: PrizeType.PHYSICAL,
          quantity: 1,
        },
        displayOrder: 1,
        isHighlight: true,
      },
      {
        level: PrizeLevel.SECOND,
        rankName: '二等奖',
        combinationType: PrizeCombinationType.SINGLE,
        singlePrize: {
          name: '二等奖奖品',
          type: PrizeType.PHYSICAL,
          quantity: 2,
        },
        displayOrder: 2,
        isHighlight: true,
      },
      {
        level: PrizeLevel.THIRD,
        rankName: '三等奖',
        combinationType: PrizeCombinationType.SINGLE,
        singlePrize: {
          name: '三等奖奖品',
          type: PrizeType.PHYSICAL,
          quantity: 3,
        },
        displayOrder: 3,
        isHighlight: true,
      },
      {
        level: PrizeLevel.CONSOLATION,
        rankName: '参与奖',
        combinationType: PrizeCombinationType.SINGLE,
        singlePrize: {
          name: '参与奖',
          description: '感谢参与',
          type: PrizeType.POINTS,
          quantity: 100,
        },
        displayOrder: 4,
        isHighlight: false,
      },
    ],
  },
  {
    id: 'compound-prizes',
    name: '复合奖励',
    description: '每个奖项包含多个奖品',
    category: 'advanced',
    isDefault: false,
    prizes: [
      {
        level: PrizeLevel.FIRST,
        rankName: '一等奖',
        combinationType: PrizeCombinationType.COMPOUND,
        subPrizes: [
          {
            prize: {
              name: '实物大奖',
              type: PrizeType.PHYSICAL,
              quantity: 1,
            },
            quantity: 1,
          },
          {
            prize: {
              name: '积分奖励',
              type: PrizeType.POINTS,
              quantity: 1000,
            },
            quantity: 1,
          },
          {
            prize: {
              name: '荣誉证书',
              type: PrizeType.CERTIFICATE,
              quantity: 1,
            },
            quantity: 1,
          },
        ],
        displayOrder: 1,
        isHighlight: true,
      },
      {
        level: PrizeLevel.SECOND,
        rankName: '二等奖',
        combinationType: PrizeCombinationType.COMPOUND,
        subPrizes: [
          {
            prize: {
              name: '实物奖品',
              type: PrizeType.PHYSICAL,
              quantity: 1,
            },
            quantity: 1,
          },
          {
            prize: {
              name: '积分奖励',
              type: PrizeType.POINTS,
              quantity: 500,
            },
            quantity: 1,
          },
        ],
        displayOrder: 2,
        isHighlight: true,
      },
    ],
  },
];
