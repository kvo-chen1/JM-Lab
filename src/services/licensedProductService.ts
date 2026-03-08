/**
 * 授权IP产品服务
 * 用于文创商城展示授权IP产品
 */

import apiClient from '@/lib/apiClient';

// 获取当前用户ID的辅助函数
const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || user.userId || null;
    }
  } catch (e) {
    console.error('获取用户ID失败:', e);
  }
  return null;
};

export interface LicensedProduct {
  id: string;
  applicationId: string;
  brandId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  brandName: string;
  brandLogo?: string;
  productName: string;
  productDescription?: string;
  productImages: string[];
  productCategory: string;
  price: number;
  stock: number;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'on_sale' | 'sold_out' | 'discontinued';
  salesCount: number;
  revenue: number;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LicensedProductFilters {
  category?: string;
  brandId?: string;
  creatorId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'sales' | 'rating';
  searchQuery?: string;
}

class LicensedProductService {
  /**
   * 获取授权IP产品列表
   */
  async getLicensedProducts(filters?: LicensedProductFilters): Promise<LicensedProduct[]> {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brandId) params.append('brandId', filters.brandId);
    if (filters?.creatorId) params.append('creatorId', filters.creatorId);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery);

    const response = await apiClient.get(`/api/copyright/products?${params.toString()}`);
    return response.data;
  }

  /**
   * 获取授权IP产品详情
   */
  async getLicensedProductById(id: string): Promise<LicensedProduct> {
    const response = await apiClient.get(`/api/copyright/products/${id}`);
    return response.data;
  }

  /**
   * 获取热销授权IP产品
   */
  async getHotLicensedProducts(limit: number = 8): Promise<LicensedProduct[]> {
    try {
      // 使用基础接口获取已上架产品，按销量排序
      const response = await apiClient.get(`/api/copyright/products?status=on_sale&sortBy=sales&limit=${limit}`);
      let data = response.data;
      // 确保返回数组
      if (!Array.isArray(data)) {
        data = data.products || data.data || [];
      }
      return data.slice(0, limit);
    } catch (error) {
      console.warn('获取热销产品失败，返回空数组:', error);
      return [];
    }
  }

  /**
   * 获取新品授权IP产品
   */
  async getNewLicensedProducts(limit: number = 8): Promise<LicensedProduct[]> {
    try {
      // 使用基础接口获取已上架产品，按时间排序
      const response = await apiClient.get(`/api/copyright/products?status=on_sale&sortBy=newest&limit=${limit}`);
      let data = response.data;
      // 确保返回数组
      if (!Array.isArray(data)) {
        data = data.products || data.data || [];
      }
      return data.slice(0, limit);
    } catch (error) {
      console.warn('获取新品失败，返回空数组:', error);
      return [];
    }
  }

  /**
   * 获取推荐授权IP产品
   */
  async getRecommendedLicensedProducts(limit: number = 6): Promise<LicensedProduct[]> {
    try {
      // 使用基础接口获取已上架产品
      const response = await apiClient.get(`/api/copyright/products?status=on_sale&limit=${limit}`);
      let data = response.data;
      // 确保返回数组
      if (!Array.isArray(data)) {
        data = data.products || data.data || [];
      }
      // 随机排序作为推荐
      return data.sort(() => Math.random() - 0.5).slice(0, limit);
    } catch (error) {
      console.warn('获取推荐产品失败，返回空数组:', error);
      return [];
    }
  }

  /**
   * 搜索授权IP产品
   */
  async searchLicensedProducts(query: string): Promise<LicensedProduct[]> {
    try {
      const response = await apiClient.get(`/api/copyright/products?searchQuery=${encodeURIComponent(query)}`);
      let data = response.data;
      // 确保返回数组
      if (!Array.isArray(data)) {
        data = data.products || data.data || [];
      }
      return data;
    } catch (error) {
      console.warn('搜索产品失败，返回空数组:', error);
      return [];
    }
  }

  /**
   * 获取授权IP产品分类统计
   */
  async getLicensedProductCategories(): Promise<{ id: string; name: string; count: number }[]> {
    try {
      const response = await apiClient.get('/api/copyright/products/categories');
      let data = response.data;
      // 确保返回数组
      if (!Array.isArray(data)) {
        data = data.categories || data.data || [];
      }
      return data;
    } catch (error) {
      console.warn('获取分类失败，返回默认分类:', error);
      // 返回默认分类
      return [
        { id: 'clothing', name: '服装配饰', count: 0 },
        { id: 'home', name: '家居用品', count: 0 },
        { id: 'stationery', name: '文具办公', count: 0 },
        { id: 'digital', name: '数字产品', count: 0 },
        { id: 'toys', name: '玩具周边', count: 0 },
      ];
    }
  }
}

export const licensedProductService = new LicensedProductService();
export default licensedProductService;
