/**
 * 商家店铺服务
 * 处理店铺创建、查询、更新等操作
 */

import { supabase } from '@/lib/supabase';

// ==================== 类型定义 ====================

export interface MerchantStore {
  id: string;
  user_id: string;
  
  // 基本信息
  store_name: string;
  store_logo?: string;
  store_description?: string;
  categories?: string[];
  
  // 联系信息
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  store_address?: string;
  
  // 资质信息
  business_license?: string;
  id_card_front?: string;
  id_card_back?: string;
  other_documents?: string[];
  
  // 状态
  status: 'active' | 'inactive';
  
  // 时间戳
  created_at: string;
  updated_at: string;
}

export interface StoreFormData {
  // 基本信息
  store_name: string;
  store_logo?: string;
  store_description?: string;
  categories?: string[];
  
  // 联系信息
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  store_address?: string;
  
  // 资质信息
  business_license?: string;
  id_card_front?: string;
  id_card_back?: string;
  other_documents?: string[];
}

// ==================== 商家店铺服务类 ====================

class MerchantStoreService {
  
  /**
   * 获取当前用户ID
   */
  private getCurrentUserId(): string | null {
    // 尝试从 supabase 获取
    const { data: { user } } = supabase.auth.getUserSync?.() || { data: { user: null } };
    if (user?.id) {
      console.log('[MerchantStoreService] 从 supabase 获取用户ID:', user.id);
      return user.id;
    }
    
    // 从 localStorage 获取
    try {
      const userStr = localStorage.getItem('user');
      console.log('[MerchantStoreService] localStorage user:', userStr);
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('[MerchantStoreService] 从 localStorage 获取用户ID:', userData?.id);
        return userData?.id || null;
      }
    } catch (e) {
      console.error('[MerchantStoreService] 解析用户信息失败:', e);
    }
    
    console.log('[MerchantStoreService] 无法获取用户ID');
    return null;
  }

  /**
   * 创建店铺
   */
  async createStore(data: StoreFormData): Promise<MerchantStore> {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用户未登录');

    // 检查是否已有店铺
    const existingStore = await this.getMyStore();
    if (existingStore) {
      throw new Error('您已创建过店铺，请勿重复创建');
    }

    const storeData = {
      user_id: userId,
      store_name: data.store_name,
      store_logo: data.store_logo || '',
      store_description: data.store_description || '',
      categories: data.categories || [],
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email || '',
      store_address: data.store_address || '',
      business_license: data.business_license || '',
      id_card_front: data.id_card_front || '',
      id_card_back: data.id_card_back || '',
      other_documents: data.other_documents || [],
      status: 'active',
    };

    // 创建店铺记录
    const { data: result, error } = await supabase
      .from('merchant_stores')
      .insert(storeData)
      .select()
      .single();

    if (error) {
      console.error('创建店铺失败:', error);
      throw new Error('创建店铺失败: ' + error.message);
    }

    // 同时创建 merchants 表记录（用于商家工作台）
    try {
      const { data: existingMerchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingMerchant) {
        const merchantData = {
          user_id: userId,
          store_name: data.store_name,
          store_logo: data.store_logo || '',
          store_description: data.store_description || '',
          contact_name: data.contact_name,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email || '',
          status: 'approved',
          rating: 5.0,
          total_sales: 0,
          total_orders: 0,
        };

        const { error: merchantError } = await supabase
          .from('merchants')
          .insert(merchantData);

        if (merchantError) {
          console.error('创建商家记录失败:', merchantError);
        } else {
          console.log('商家记录创建成功');
        }
      }
    } catch (e) {
      console.error('创建商家记录时出错:', e);
    }

    return result;
  }

  /**
   * 获取当前用户的店铺
   */
  async getMyStore(): Promise<MerchantStore | null> {
    const userId = this.getCurrentUserId();
    console.log('[MerchantStoreService] getMyStore - 用户ID:', userId);
    if (!userId) return null;

    const { data, error } = await supabase
      .from('merchant_stores')
      .select('*')
      .eq('user_id', userId);

    console.log('[MerchantStoreService] getMyStore - 查询结果:', { data, error });

    if (error) {
      console.error('[MerchantStoreService] 获取店铺信息失败:', error);
      throw new Error('获取店铺信息失败');
    }

    // 如果没有记录，返回 null
    if (!data || data.length === 0) {
      return null;
    }

    // 返回第一条记录
    return data[0];
  }

  /**
   * 更新店铺信息
   */
  async updateStore(storeId: string, data: Partial<StoreFormData>): Promise<MerchantStore> {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用户未登录');

    const { data: result, error } = await supabase
      .from('merchant_stores')
      .update(data)
      .eq('id', storeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('更新店铺信息失败:', error);
      throw new Error('更新店铺信息失败');
    }

    return result;
  }

  /**
   * 检查用户是否有店铺
   */
  async hasStore(): Promise<boolean> {
    const store = await this.getMyStore();
    return !!store;
  }

  /**
   * 检查用户是否可以创建店铺
   */
  async canCreateStore(): Promise<{ canCreate: boolean; reason?: string }> {
    const store = await this.getMyStore();
    
    if (store) {
      return { canCreate: false, reason: '您已创建过店铺' };
    }

    return { canCreate: true };
  }
}

export const merchantStoreService = new MerchantStoreService();
