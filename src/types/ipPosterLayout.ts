/**
 * IP 海报排版布局类型定义
 */

export interface IPPosterLayout {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  imagePath: string;
  category: string[];
  tags: string[];
  width?: number;
  height?: number;
  aspectRatio?: string;
  usage?: string;
}

export type IPPosterCategory = 'all' | 'guochao' | 'game' | 'museum' | 'classic';

export interface IPPosterFilters {
  category?: IPPosterCategory;
  searchQuery?: string;
  favoritesOnly?: boolean;
}
