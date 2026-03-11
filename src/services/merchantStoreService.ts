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
   * 创建店铺
   */
  async createStore(data: StoreFormData): Promise<MerchantStore> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    // 检查是否已有店铺
    const existingStore = await this.getMyStore();
    if (existingStore) {
      throw new Error('您已创建过店铺，请勿重复创建');
    }

    const storeData = {
      user_id: user.id,
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

    const { data: result, error } = await supabase
      .from('merchant_stores')
      .insert(storeData)
      .select()
      .single();

    if (error) {
      console.error('创建店铺失败:', error);
      throw new Error('创建店铺失败: ' + error.message);
    }

    return result;
  }

  /**
   * 获取当前用户的店铺
   */
  async getMyStore(): Promise<MerchantStore | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('merchant_stores')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // 没有记录
      console.error('获取店铺信息失败:', error);
      throw new Error('获取店铺信息失败');
    }

    return data;
  }

  /**
   * 更新店铺信息
   */
  async updateStore(storeId: string, data: Partial<StoreFormData>): Promise<MerchantStore> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const { data: result, error } = await supabase
      .from('merchant_stores')
      .update(data)
      .eq('id', storeId)
      .eq('user_id', user.id)
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
