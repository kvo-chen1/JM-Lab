/**
 * IP 海报布局模板配置
 * 定义各种海报布局模板 - 专业设计升级版
 */

import type { CSSProperties } from 'react';

export interface LayoutArea {
  id: string;
  type: 'main' | 'threeViews' | 'emojis' | 'actions' | 'colors' | 'merchandise' | 'text' | 'title' | 'subtitle' | 'decoration' | 'infoCard' | 'grid' | 'strip';
  x: number;
  y: number;
  width: number;
  height: number;
  style?: CSSProperties;
  label?: string;
  zIndex?: number;
  borderRadius?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  glass?: boolean;
  rotate?: number;
  /** 卡片标题 */
  cardTitle?: string;
  /** 卡片图标 */
  cardIcon?: string;
  /** 网格列数 */
  gridColumns?: number;
  /** 装饰条文字 */
  stripText?: string;
  /** 渐变文字 */
  gradientText?: boolean;
  /** 文字描边 */
  textStroke?: boolean;
  /** 发光效果 */
  glow?: boolean;
}

export interface PosterLayout {
  id: string;
  name: string;
  description: string;
  preview: string;
  width: number;
  height: number;
  areas: LayoutArea[];
  background?: string;
  decorations?: {
    type: 'circle' | 'line' | 'dot' | 'wave' | 'grid' | 'star' | 'border';
    x: number;
    y: number;
    size: number;
    color: string;
    opacity?: number;
  }[];
  fontTheme?: 'modern' | 'elegant' | 'playful' | 'bold' | 'traditional';
  colorTheme?: 'blue' | 'purple' | 'sunset' | 'ocean' | 'forest' | 'dark' | 'guochao' | 'game' | 'museum';
  /** 主题配色 */
  themeColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

// ==================== 视觉系统常量 ====================

export const shadowSystem = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
};

export const borderRadiusSystem = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
};

/** 高级渐变背景 */
export const premiumBackgrounds = {
  softPurple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  forest: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  peach: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  darkNight: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  elegantGray: 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
  warmOrange: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  mintFresh: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  deepSpace: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
  paperTexture: 'linear-gradient(to bottom, #fafafa 0%, #f0f0f0 100%)',
  gridPattern: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
  // 国潮风背景
  guochaoWarm: 'linear-gradient(180deg, #FFF8F0 0%, #FFECD2 50%, #FCB69F 100%)',
  guochaoRed: 'linear-gradient(135deg, #D4A574 0%, #C17F4E 50%, #8B4513 100%)',
  // 游戏风背景
  gameDark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  gameNeon: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  // 博物馆风背景
  museumElegant: 'linear-gradient(135deg, #2C2416 0%, #3D3221 50%, #1A1612 100%)',
  museumDark: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)',
};

/** 主题配色方案 */
export const themeColorSchemes = {
  guochao: {
    primary: '#D4A574',
    secondary: '#C17F4E',
    accent: '#8B4513',
    background: '#FFF8F0',
    text: '#5C4033',
  },
  game: {
    primary: '#00D9FF',
    secondary: '#FF00FF',
    accent: '#00FF88',
    background: '#0a0a1a',
    text: '#ffffff',
  },
  museum: {
    primary: '#D4AF37',
    secondary: '#8B7355',
    accent: '#CD853F',
    background: '#1a1a1a',
    text: '#F5F5DC',
  },
};

/** 字体主题 */
export const fontThemes = {
  modern: { fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
  elegant: { fontFamily: 'Georgia, serif', fontWeight: 600, letterSpacing: '0.02em' },
  playful: { fontFamily: 'Comic Sans MS, cursive', fontWeight: 700, letterSpacing: '0.01em' },
  bold: { fontFamily: 'Impact, sans-serif', fontWeight: 900, letterSpacing: '-0.03em' },
  traditional: { fontFamily: '"Noto Serif SC", "SimSun", serif', fontWeight: 700, letterSpacing: '0.05em' },
};

// ==================== 原有布局（优化版）====================

export const classicLayout: PosterLayout = {
  id: 'classic',
  name: '经典展示',
  description: '主视觉大图 + 三视图 + 表情包网格',
  preview: 'classic-preview',
  width: 1200,
  height: 1600,
  background: premiumBackgrounds.elegantGray,
  fontTheme: 'modern',
  areas: [
    {
      id: 'title',
      type: 'title',
      x: 5, y: 2, width: 90, height: 10,
      label: '角色名称',
      zIndex: 10,
      style: { fontSize: '56px', fontWeight: '800', textAlign: 'center', color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: '1.1' },
    },
    {
      id: 'subtitle',
      type: 'subtitle',
      x: 10, y: 12, width: 80, height: 5,
      label: '副标题/描述',
      zIndex: 10,
      style: { fontSize: '22px', textAlign: 'center', color: '#4a4a6a', letterSpacing: '0.02em' },
    },
    {
      id: 'mainVisual',
      type: 'main',
      x: 8, y: 19, width: 84, height: 38,
      label: '主视觉海报',
      borderRadius: '24px', shadow: 'xl', zIndex: 5,
    },
    {
      id: 'threeViews',
      type: 'threeViews',
      x: 5, y: 60, width: 44, height: 18,
      label: '三视图', borderRadius: '16px', shadow: 'lg',
    },
    {
      id: 'emojis',
      type: 'emojis',
      x: 51, y: 60, width: 44, height: 18,
      label: '表情包', borderRadius: '16px', shadow: 'lg',
    },
    {
      id: 'colors',
      type: 'colors',
      x: 5, y: 81, width: 28, height: 14,
      label: '配色方案', borderRadius: '12px', shadow: 'md',
    },
    {
      id: 'actions',
      type: 'actions',
      x: 36, y: 81, width: 28, height: 14,
      label: '动作延展', borderRadius: '12px', shadow: 'md',
    },
    {
      id: 'merchandise',
      type: 'merchandise',
      x: 67, y: 81, width: 28, height: 14,
      label: '周边设计', borderRadius: '12px', shadow: 'md',
    },
  ],
  decorations: [
    { type: 'circle', x: 5, y: 5, size: 100, color: 'rgba(102, 126, 234, 0.1)', opacity: 0.5 },
    { type: 'circle', x: 90, y: 15, size: 80, color: 'rgba(118, 75, 162, 0.1)', opacity: 0.3 },
  ],
};

// ==================== 专业级布局 ====================

/** 国潮风布局 - 参考雪豹小吉、虎笺儿 */
export const guochaoLayout: PosterLayout = {
  id: 'guochao',
  name: '国潮风',
  description: '传统文化元素，暖色调，艺术字标题',
  preview: 'guochao-preview',
  width: 1200,
  height: 2000,
  background: premiumBackgrounds.guochaoWarm,
  fontTheme: 'traditional',
  colorTheme: 'guochao',
  themeColors: themeColorSchemes.guochao,
  areas: [
    // Hero 区域 - 大幅主视觉
    {
      id: 'hero-bg',
      type: 'decoration',
      x: 0, y: 0, width: 100, height: 35,
      style: {
        background: 'linear-gradient(180deg, rgba(212, 165, 116, 0.3) 0%, rgba(255, 248, 240, 0) 100%)',
      },
      zIndex: 1,
    },
    // 艺术字标题 - 渐变描边效果
    {
      id: 'mainTitle',
      type: 'title',
      x: 5, y: 3, width: 90, height: 12,
      label: '主标题',
      zIndex: 10,
      gradientText: true,
      textStroke: true,
      style: {
        fontSize: '72px',
        fontWeight: '900',
        textAlign: 'center',
        fontFamily: '"Noto Serif SC", serif',
        letterSpacing: '0.1em',
        background: 'linear-gradient(135deg, #D4A574 0%, #8B4513 50%, #D4A574 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
      },
    },
    // 副标题
    {
      id: 'subTitle',
      type: 'subtitle',
      x: 10, y: 14, width: 80, height: 5,
      label: '副标题/标语',
      zIndex: 10,
      style: {
        fontSize: '24px',
        textAlign: 'center',
        color: '#8B4513',
        letterSpacing: '0.2em',
        fontFamily: '"Noto Serif SC", serif',
      },
    },
    // 装饰文字条
    {
      id: 'textStrip',
      type: 'strip',
      x: 0, y: 19, width: 100, height: 3,
      stripText: 'XUEBAO XIAOJI · XUEBAO XIAOJI · XUEBAO XIAOJI',
      style: {
        background: 'linear-gradient(90deg, transparent, rgba(139, 69, 19, 0.1), transparent)',
        fontSize: '14px',
        color: '#8B4513',
        letterSpacing: '0.3em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      zIndex: 5,
    },
    // 主视觉
    {
      id: 'mainVisual',
      type: 'main',
      x: 25, y: 8, width: 50, height: 30,
      label: '主视觉', borderRadius: '32px', shadow: '2xl', zIndex: 8,
    },
    // 第一行 - 3列卡片
    {
      id: 'characterCard',
      type: 'infoCard',
      x: 3, y: 38, width: 30, height: 20,
      cardTitle: '人物介绍',
      cardIcon: 'user',
      borderRadius: '20px', shadow: 'lg',
      style: { background: 'rgba(255, 255, 255, 0.9)' },
    },
    {
      id: 'designCard',
      type: 'infoCard',
      x: 35, y: 38, width: 30, height: 20,
      cardTitle: '设计说明',
      cardIcon: 'palette',
      borderRadius: '20px', shadow: 'lg',
      style: { background: 'rgba(255, 255, 255, 0.9)' },
    },
    {
      id: 'threeViewsCard',
      type: 'threeViews',
      x: 67, y: 38, width: 30, height: 20,
      label: '三视图展示', borderRadius: '20px', shadow: 'lg',
    },
    // 第二行
    {
      id: 'inspirationCard',
      type: 'infoCard',
      x: 3, y: 60, width: 30, height: 18,
      cardTitle: '灵感来源',
      cardIcon: 'sparkles',
      borderRadius: '20px', shadow: 'lg',
      style: { background: 'rgba(255, 255, 255, 0.9)' },
    },
    {
      id: 'actionsCard',
      type: 'actions',
      x: 35, y: 60, width: 30, height: 18,
      label: '动作延展', borderRadius: '20px', shadow: 'lg',
    },
    {
      id: 'emojisCard',
      type: 'emojis',
      x: 67, y: 60, width: 30, height: 18,
      label: '表情包延展', borderRadius: '20px', shadow: 'lg',
    },
    // 插画展示
    {
      id: 'illustrationTitle',
      type: 'subtitle',
      x: 5, y: 80, width: 90, height: 4,
      label: '插画展示',
      style: {
        fontSize: '28px',
        fontWeight: '700',
        textAlign: 'center',
        color: '#8B4513',
        fontFamily: '"Noto Serif SC", serif',
      },
    },
    {
      id: 'illustrationGrid',
      type: 'grid',
      x: 3, y: 85, width: 94, height: 12,
      gridColumns: 4,
      label: '插画网格',
    },
    // 文创周边
    {
      id: 'merchandiseTitle',
      type: 'subtitle',
      x: 5, y: 98, width: 90, height: 4,
      label: '文创周边',
      style: {
        fontSize: '28px',
        fontWeight: '700',
        textAlign: 'center',
        color: '#8B4513',
        fontFamily: '"Noto Serif SC", serif',
      },
    },
    {
      id: 'merchandiseGrid',
      type: 'merchandise',
      x: 3, y: 103, width: 94, height: 20,
      label: '周边展示', borderRadius: '20px', shadow: 'lg',
    },
  ],
  decorations: [
    { type: 'star', x: 8, y: 6, size: 20, color: '#D4A574', opacity: 0.6 },
    { type: 'star', x: 92, y: 8, size: 16, color: '#C17F4E', opacity: 0.5 },
    { type: 'line', x: 20, y: 17, size: 60, color: 'linear-gradient(90deg, transparent, #D4A574, transparent)', opacity: 0.5 },
    { type: 'border', x: 2, y: 37, size: 96, color: '#D4A574', opacity: 0.3 },
  ],
};

/** 游戏风布局 - 参考瓦当神韵 */
export const gameLayout: PosterLayout = {
  id: 'game',
  name: '游戏风',
  description: '暗色背景，霓虹发光效果，多角色展示',
  preview: 'game-preview',
  width: 1200,
  height: 2200,
  background: premiumBackgrounds.gameDark,
  fontTheme: 'bold',
  colorTheme: 'game',
  themeColors: themeColorSchemes.game,
  areas: [
    // Hero 区域
    {
      id: 'heroGlow',
      type: 'decoration',
      x: 50, y: 15, width: 0, height: 0,
      style: {
        boxShadow: '0 0 200px 100px rgba(0, 217, 255, 0.3)',
      },
      zIndex: 1,
    },
    // 发光标题
    {
      id: 'mainTitle',
      type: 'title',
      x: 5, y: 5, width: 90, height: 10,
      label: '主标题',
      zIndex: 10, glow: true,
      style: {
        fontSize: '64px',
        fontWeight: '900',
        textAlign: 'center',
        color: '#00D9FF',
        letterSpacing: '0.05em',
        textShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.4)',
      },
    },
    // 副标题
    {
      id: 'subTitle',
      type: 'subtitle',
      x: 10, y: 15, width: 80, height: 4,
      label: '副标题',
      zIndex: 10,
      style: {
        fontSize: '18px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
      },
    },
    // 主视觉 - 角色群像
    {
      id: 'mainVisual',
      type: 'main',
      x: 5, y: 8, width: 90, height: 25,
      label: '角色群像', borderRadius: '24px', shadow: '2xl', zIndex: 5,
    },
    // 设计理念卡片
    {
      id: 'conceptCard',
      type: 'infoCard',
      x: 3, y: 35, width: 45, height: 20,
      cardTitle: '设计理念',
      cardIcon: 'zap',
      borderRadius: '16px', shadow: 'xl',
      style: {
        background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(255, 0, 255, 0.1))',
        border: '1px solid rgba(0, 217, 255, 0.3)',
      },
    },
    // 角色介绍 - 4列网格
    {
      id: 'charactersTitle',
      type: 'subtitle',
      x: 52, y: 35, width: 45, height: 4,
      label: '角色介绍',
      style: { fontSize: '20px', color: '#00D9FF', fontWeight: '700' },
    },
    {
      id: 'characterGrid',
      type: 'grid',
      x: 52, y: 40, width: 45, height: 15,
      gridColumns: 4,
      label: '角色网格',
    },
    // 主KV设计
    {
      id: 'kvTitle',
      type: 'subtitle',
      x: 3, y: 57, width: 45, height: 4,
      label: '主KV设计',
      style: { fontSize: '20px', color: '#00D9FF', fontWeight: '700' },
    },
    {
      id: 'kvImage',
      type: 'main',
      x: 3, y: 62, width: 45, height: 20,
      label: '主KV', borderRadius: '16px', shadow: 'xl',
    },
    // 场景设计
    {
      id: 'sceneTitle',
      type: 'subtitle',
      x: 52, y: 57, width: 45, height: 4,
      label: '场景设计',
      style: { fontSize: '20px', color: '#00D9FF', fontWeight: '700' },
    },
    {
      id: 'sceneGrid',
      type: 'grid',
      x: 52, y: 62, width: 45, height: 20,
      gridColumns: 3,
      label: '场景网格',
    },
    // 纹样设计 - 4列
    {
      id: 'patternTitle',
      type: 'subtitle',
      x: 5, y: 84, width: 90, height: 4,
      label: '纹样设计',
      style: {
        fontSize: '24px',
        color: '#00D9FF',
        fontWeight: '700',
        textAlign: 'center',
        textShadow: '0 0 10px rgba(0, 217, 255, 0.5)',
      },
    },
    {
      id: 'patternGrid',
      type: 'grid',
      x: 3, y: 89, width: 94, height: 15,
      gridColumns: 4,
      label: '纹样网格',
    },
    // 底部三列
    {
      id: 'colorCard',
      type: 'colors',
      x: 3, y: 106, width: 30, height: 15,
      label: '配色设计', borderRadius: '16px', shadow: 'lg',
    },
    {
      id: 'merchCard',
      type: 'merchandise',
      x: 35, y: 106, width: 30, height: 15,
      label: '文创设计', borderRadius: '16px', shadow: 'lg',
    },
    {
      id: 'comicCard',
      type: 'actions',
      x: 67, y: 106, width: 30, height: 15,
      label: '漫画设计', borderRadius: '16px', shadow: 'lg',
    },
  ],
  decorations: [
    { type: 'circle', x: 10, y: 10, size: 150, color: 'rgba(0, 217, 255, 0.1)', opacity: 0.5 },
    { type: 'circle', x: 90, y: 20, size: 200, color: 'rgba(255, 0, 255, 0.1)', opacity: 0.3 },
    { type: 'line', x: 5, y: 34, size: 90, color: 'linear-gradient(90deg, #00D9FF, #FF00FF)', opacity: 0.5 },
    { type: 'line', x: 5, y: 83, size: 90, color: 'linear-gradient(90deg, #FF00FF, #00D9FF)', opacity: 0.5 },
  ],
};

/** 博物馆风布局 - 参考釉趣横生 */
export const museumLayout: PosterLayout = {
  id: 'museum',
  name: '博物馆风',
  description: '深色优雅背景，展品式展示，信息标签系统',
  preview: 'museum-preview',
  width: 1200,
  height: 2400,
  background: premiumBackgrounds.museumDark,
  fontTheme: 'elegant',
  colorTheme: 'museum',
  themeColors: themeColorSchemes.museum,
  areas: [
    // 顶部标题区
    {
      id: 'titleDecoration',
      type: 'decoration',
      x: 0, y: 0, width: 100, height: 8,
      style: {
        background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
      },
      zIndex: 1,
    },
    {
      id: 'mainTitle',
      type: 'title',
      x: 5, y: 2, width: 90, height: 6,
      label: '主标题',
      zIndex: 10,
      style: {
        fontSize: '48px',
        fontWeight: '600',
        textAlign: 'center',
        color: '#D4AF37',
        letterSpacing: '0.15em',
        fontFamily: 'Georgia, serif',
      },
    },
    // 主视觉
    {
      id: 'mainVisual',
      type: 'main',
      x: 10, y: 10, width: 80, height: 25,
      label: '展品主视觉', borderRadius: '8px', shadow: '2xl', zIndex: 5,
    },
    // 第一行 - 设计理念等
    {
      id: 'philosophyCard',
      type: 'infoCard',
      x: 3, y: 37, width: 30, height: 18,
      cardTitle: '设计理念',
      cardIcon: 'book',
      borderRadius: '12px', shadow: 'lg',
      style: {
        background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.9), rgba(30, 30, 30, 0.9))',
        border: '1px solid rgba(212, 175, 55, 0.2)',
      },
    },
    {
      id: 'conceptCard',
      type: 'infoCard',
      x: 35, y: 37, width: 30, height: 18,
      cardTitle: '设计概念',
      cardIcon: 'lightbulb',
      borderRadius: '12px', shadow: 'lg',
      style: {
        background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.9), rgba(30, 30, 30, 0.9))',
        border: '1px solid rgba(212, 175, 55, 0.2)',
      },
    },
    {
      id: 'colorCard',
      type: 'colors',
      x: 67, y: 37, width: 30, height: 18,
      label: '配色设计', borderRadius: '12px', shadow: 'lg',
    },
    // 第二行 - 表情包和海报
    {
      id: 'expressionCard',
      type: 'emojis',
      x: 3, y: 57, width: 45, height: 15,
      label: '表情设计', borderRadius: '12px', shadow: 'lg',
    },
    {
      id: 'posterCard',
      type: 'actions',
      x: 52, y: 57, width: 45, height: 15,
      label: '海报设计', borderRadius: '12px', shadow: 'lg',
    },
    // 第三行 - 场景和装置
    {
      id: 'sceneTitle',
      type: 'subtitle',
      x: 3, y: 74, width: 45, height: 3,
      label: '场景设计',
      style: { fontSize: '18px', color: '#D4AF37', fontWeight: '600' },
    },
    {
      id: 'sceneImage',
      type: 'main',
      x: 3, y: 78, width: 45, height: 15,
      label: '场景展示', borderRadius: '12px', shadow: 'lg',
    },
    {
      id: 'deviceTitle',
      type: 'subtitle',
      x: 52, y: 74, width: 45, height: 3,
      label: '装置设计',
      style: { fontSize: '18px', color: '#D4AF37', fontWeight: '600' },
    },
    {
      id: 'deviceImage',
      type: 'threeViews',
      x: 52, y: 78, width: 45, height: 15,
      label: '装置展示', borderRadius: '12px', shadow: 'lg',
    },
    // 主KV
    {
      id: 'kvTitle',
      type: 'subtitle',
      x: 5, y: 95, width: 90, height: 3,
      label: '主KV设计',
      style: {
        fontSize: '22px',
        color: '#D4AF37',
        fontWeight: '600',
        textAlign: 'center',
      },
    },
    {
      id: 'kvImage',
      type: 'main',
      x: 10, y: 99, width: 80, height: 18,
      label: '主KV展示', borderRadius: '12px', shadow: 'xl',
    },
    // 文创展示
    {
      id: 'merchTitle',
      type: 'subtitle',
      x: 5, y: 119, width: 90, height: 3,
      label: '文创设计',
      style: {
        fontSize: '22px',
        color: '#D4AF37',
        fontWeight: '600',
        textAlign: 'center',
      },
    },
    {
      id: 'merchGrid',
      type: 'merchandise',
      x: 3, y: 123, width: 94, height: 18,
      label: '文创网格', borderRadius: '12px', shadow: 'lg',
    },
  ],
  decorations: [
    { type: 'line', x: 10, y: 8, size: 80, color: 'rgba(212, 175, 55, 0.3)', opacity: 1 },
    { type: 'line', x: 10, y: 36, size: 80, color: 'rgba(212, 175, 55, 0.2)', opacity: 1 },
    { type: 'line', x: 10, y: 94, size: 80, color: 'rgba(212, 175, 55, 0.2)', opacity: 1 },
    { type: 'line', x: 10, y: 118, size: 80, color: 'rgba(212, 175, 55, 0.2)', opacity: 1 },
    { type: 'circle', x: 5, y: 50, size: 100, color: 'rgba(212, 175, 55, 0.05)', opacity: 0.5 },
    { type: 'circle', x: 95, y: 100, size: 150, color: 'rgba(212, 175, 55, 0.05)', opacity: 0.3 },
  ],
};

// ==================== 所有布局 ====================

export const posterLayouts: PosterLayout[] = [
  classicLayout,
  guochaoLayout,
  gameLayout,
  museumLayout,
];

export function getLayoutById(id: string): PosterLayout | undefined {
  return posterLayouts.find((layout) => layout.id === id);
}

export const defaultLayout = classicLayout;
