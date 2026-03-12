/**
 * 品牌服务 - 管理品牌方入驻和授权
 */
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { generateIdempotencyKey } from '@/lib/supabase';

// 品牌方类型定义
export interface Brand {
  id: string;
  user_id: string;
  name: string;
  logo?: string;
  description?: string;
  category?: string;
  established_year?: number;
  location?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  status: 'pending' | 'approved' | 'rejected';
  verification_docs?: any[];
  created_at: string;
  updated_at: string;
}

// 授权申请类型定义
export interface BrandAuthorization {
  id: string;
  ip_asset_id: string;
  brand_id: string;
  applicant_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  application_reason?: string;
  proposed_usage?: string;
  proposed_duration?: number;
  proposed_price?: number;
  brand_response?: string;
  contract_url?: string;
  certificate_url?: string;
  started_at?: string;
  expired_at?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  brand?: Brand;
  ip_asset?: {
    id: string;
    name: string;
    thumbnail?: string;
  };
  applicant?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

// 创建品牌方入驻申请
export async function createBrandApplication(
  brandData: Omit<Brand, 'id' | 'status' | 'created_at' | 'updated_at'>
): Promise<{ data?: Brand; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .insert({
        ...brandData,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('创建品牌方申请失败:', err);
    return { error: err.message || '创建品牌方申请失败' };
  }
}

// 获取品牌方列表
export async function getBrands(
  options: {
    status?: 'approved' | 'pending' | 'rejected';
    category?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Brand[]; count?: number; error?: string }> {
  try {
    // 构建查询参数
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.category) params.append('category', options.category);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    // 使用本地 API 而不是 Supabase
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`/api/brand/brands?${params}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return { data: result.data || [], count: result.data?.length || 0 };
  } catch (err: any) {
    console.error('获取品牌方列表失败:', err);
    return { error: err.message || '获取品牌方列表失败' };
  }
}

// 获取品牌方详情
export async function getBrandById(id: string): Promise<{ data?: Brand; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('获取品牌方详情失败:', err);
    return { error: err.message || '获取品牌方详情失败' };
  }
}

// 更新品牌方信息
export async function updateBrand(
  id: string,
  updates: Partial<Brand>
): Promise<{ data?: Brand; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('更新品牌方信息失败:', err);
    return { error: err.message || '更新品牌方信息失败' };
  }
}

// 提交品牌授权申请
export async function createAuthorizationApplication(
  applicationData: Omit<BrandAuthorization, 'id' | 'status' | 'created_at' | 'updated_at'>
): Promise<{ data?: BrandAuthorization; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('brand_authorizations')
      .insert({
        ...applicationData,
        status: 'pending',
      })
      .select(`
        *,
        brand:brands(*),
        ip_asset:ip_assets(id, name, thumbnail),
        applicant:applicant_id(id, username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('提交授权申请失败:', err);
    return { error: err.message || '提交授权申请失败' };
  }
}

// 获取授权申请列表
export async function getAuthorizations(
  options: {
    applicant_id?: string;
    brand_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: BrandAuthorization[]; count?: number; error?: string }> {
  try {
    // 构建查询参数
    const params = new URLSearchParams();
    if (options.applicant_id) params.append('applicant_id', options.applicant_id);
    if (options.brand_id) params.append('brand_id', options.brand_id);
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    // 使用本地 API 而不是 Supabase
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`/api/brand/authorizations?${params}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return { data: result.data || [], count: result.data?.length || 0 };
  } catch (err: any) {
    console.error('获取授权申请列表失败:', err);
    return { error: err.message || '获取授权申请列表失败' };
  }
}

// 获取授权申请详情
export async function getAuthorizationById(
  id: string
): Promise<{ data?: BrandAuthorization; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('brand_authorizations')
      .select(
        `
        *,
        brand:brands(*),
        ip_asset:ip_assets(id, name, thumbnail),
        applicant:applicant_id(id, username, avatar_url)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('获取授权申请详情失败:', err);
    return { error: err.message || '获取授权申请详情失败' };
  }
}

// 更新授权申请状态（品牌方操作）
export async function updateAuthorizationStatus(
  id: string,
  status: 'approved' | 'rejected' | 'completed' | 'cancelled',
  brandResponse?: string
): Promise<{ data?: BrandAuthorization; error?: string }> {
  try {
    const updates: any = { status };
    if (brandResponse) {
      updates.brand_response = brandResponse;
    }
    if (status === 'approved') {
      updates.started_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('brand_authorizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('更新授权申请状态失败:', err);
    return { error: err.message || '更新授权申请状态失败' };
  }
}

// 检查用户是否有授权
export async function checkUserBrandAuthorization(
  userId: string,
  brandId: string
): Promise<{ hasAuthorization: boolean; authorization?: BrandAuthorization }> {
  try {
    const { data, error } = await supabase
      .from('brand_authorizations')
      .select('*')
      .eq('applicant_id', userId)
      .eq('brand_id', brandId)
      .eq('status', 'approved')
      .gte('expired_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    return {
      hasAuthorization: !!data,
      authorization: data || undefined,
    };
  } catch (err) {
    console.error('检查用户授权失败:', err);
    return { hasAuthorization: false };
  }
}

// 获取用户的品牌方信息
export async function getUserBrand(userId: string): Promise<{ data?: Brand; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return { data: data || undefined };
  } catch (err: any) {
    console.error('获取用户品牌方信息失败:', err);
    return { error: err.message || '获取用户品牌方信息失败' };
  }
}

// 管理员：审核品牌方入驻
export async function adminReviewBrand(
  brandId: string,
  status: 'approved' | 'rejected',
  adminNotes?: string
): Promise<{ data?: Brand; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', brandId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('审核品牌方失败:', err);
    return { error: err.message || '审核品牌方失败' };
  }
}

// 管理员：获取所有授权申请
export async function adminGetAllAuthorizations(
  options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: BrandAuthorization[]; count?: number; error?: string }> {
  try {
    let query = supabaseAdmin.from('brand_authorizations').select(
      `
        *,
        brand:brands(*),
        ip_asset:ip_assets(id, name, thumbnail),
        applicant:applicant_id(id, username, avatar_url)
      `,
      { count: 'exact' }
    );

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (err: any) {
    console.error('获取所有授权申请失败:', err);
    return { error: err.message || '获取所有授权申请失败' };
  }
}

const brandService = {
  createBrandApplication,
  getBrands,
  getBrandById,
  updateBrand,
  createAuthorizationApplication,
  getAuthorizations,
  getAuthorizationById,
  updateAuthorizationStatus,
  checkUserBrandAuthorization,
  getUserBrand,
  adminReviewBrand,
  adminGetAllAuthorizations,
};

export { brandService };
export default brandService;
