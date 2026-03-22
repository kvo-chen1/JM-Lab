/**
 * IP 海报排版服务
 * 管理 IP 海报排版的获取、搜索、收藏等功能
 */

import type { IPPosterLayout, IPPosterFilters } from '@/types/ipPosterLayout';
import { IP_POSTER_LAYOUTS, getLayoutById, getLayoutsByCategory, searchLayouts } from '@/data/ipPosterLayouts';

class IPPosterService {
  private readonly STORAGE_KEY = 'ipPosterFavorites';

  /**
   * 获取所有排版布局
   */
  getAllLayouts(): IPPosterLayout[] {
    return IP_POSTER_LAYOUTS;
  }

  /**
   * 根据 ID 获取排版布局
   */
  getLayoutById(id: string): IPPosterLayout | undefined {
    return getLayoutById(id);
  }

  /**
   * 根据分类获取排版布局
   */
  getLayoutsByCategory(category: string): IPPosterLayout[] {
    return getLayoutsByCategory(category);
  }

  /**
   * 搜索排版布局
   */
  searchLayouts(query: string): IPPosterLayout[] {
    return searchLayouts(query);
  }

  /**
   * 根据过滤条件获取排版布局
   */
  getFilteredLayouts(filters: IPPosterFilters): IPPosterLayout[] {
    let layouts = IP_POSTER_LAYOUTS;

    // 按分类过滤
    if (filters.category && filters.category !== 'all') {
      layouts = layouts.filter(layout => layout.category.includes(filters.category!));
    }

    // 按搜索查询过滤
    if (filters.searchQuery) {
      layouts = this.searchLayouts(filters.searchQuery);
    }

    // 只显示收藏
    if (filters.favoritesOnly) {
      const favorites = this.getFavorites();
      layouts = layouts.filter(layout => favorites.has(layout.id));
    }

    return layouts;
  }

  /**
   * 获取收藏的排版 ID 集合
   */
  getFavorites(): Set<string> {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.error('[IPPosterService] 获取收藏失败:', error);
    }
    return new Set();
  }

  /**
   * 切换收藏状态
   */
  toggleFavorite(layoutId: string): boolean {
    try {
      const favorites = this.getFavorites();
      if (favorites.has(layoutId)) {
        favorites.delete(layoutId);
      } else {
        favorites.add(layoutId);
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(favorites)));
      return favorites.has(layoutId);
    } catch (error) {
      console.error('[IPPosterService] 切换收藏失败:', error);
      return false;
    }
  }

  /**
   * 检查是否已收藏
   */
  isFavorite(layoutId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.has(layoutId);
  }

  /**
   * 获取收藏的排版布局
   */
  getFavoriteLayouts(): IPPosterLayout[] {
    const favorites = this.getFavorites();
    return IP_POSTER_LAYOUTS.filter(layout => favorites.has(layout.id));
  }

  /**
   * 获取所有分类
   */
  getAllCategories(): string[] {
    const categories = new Set<string>();
    IP_POSTER_LAYOUTS.forEach(layout => {
      layout.category.forEach(cat => categories.add(cat));
    });
    return Array.from(categories);
  }

  /**
   * 获取所有标签
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    IP_POSTER_LAYOUTS.forEach(layout => {
      layout.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }

  /**
   * 获取推荐排版（前 3 个）
   */
  getRecommendedLayouts(): IPPosterLayout[] {
    return IP_POSTER_LAYOUTS.slice(0, 3);
  }

  /**
   * 根据标签过滤排版
   */
  getLayoutsByTag(tag: string): IPPosterLayout[] {
    return IP_POSTER_LAYOUTS.filter(layout => 
      layout.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }
}

export const ipPosterService = new IPPosterService();
export default ipPosterService;
