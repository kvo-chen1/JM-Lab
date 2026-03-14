import { supabase } from '@/lib/supabase';

// 品牌合作申请类型定义
export interface BrandPartnership {
  id: string;
  brand_name: string;
  brand_logo: string;
  brand_id?: string;
  description: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  reward: string;
  status: 'pending' | 'negotiating' | 'approved' | 'rejected';
  applicant_id?: string;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// 品牌活动类型定义
export interface BrandEvent {
  id: string;
  title: string;
  description: string;
  content: string;
  start_time: string;
  end_time: string;
  location?: string;
  brand_id: string;
  brand_name: string;
  organizer_id: string;
  participants: number;
  max_participants?: number;
  is_public: boolean;
  type: 'online' | 'offline';
  tags: string[];
  thumbnail_url?: string;
  media: any[];
  status: 'draft' | 'pending' | 'published' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// 品牌合作服务类
class BrandPartnershipService {
  // 创建品牌合作申请
  async createPartnership(data: {
    brand_name: string;
    brand_logo: string;
    brand_id?: string;
    description: string;
    contact_name: string;
    contact_phone: string;
    contact_email?: string;
    reward?: string;
    applicant_id?: string;
  }): Promise<BrandPartnership | null> {
    try {
      // 优先使用传入的 applicant_id，如果没有则尝试从 session 获取
      let userId = data.applicant_id;
      
      if (!userId) {
        // 获取当前登录用户 - 使用 getSession
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.error('创建品牌合作申请失败: 用户未登录');
          throw new Error('请先登录后再提交品牌申请');
        }
        
        userId = session.user.id;
      }

      const { data: partnership, error } = await supabase
        .from('brand_partnerships')
        .insert([{
          ...data,
          applicant_id: userId,
          reward: data.reward || '待协商',
          status: 'pending',
        }])
        .select()
        .single();

      if (error) {
        console.error('创建品牌合作申请失败:', error);
        // 如果表不存在，使用 localStorage 作为临时存储
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return this.createPartnershipLocal(data, userId);
        }
        throw error;
      }
      return partnership;
    } catch (error) {
      console.error('创建品牌合作申请失败:', error);
      // 使用 localStorage 作为回退
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return this.createPartnershipLocal(data, session.user.id);
      }
      throw error;
    }
  }

  // 使用 localStorage 创建品牌合作申请（回退方案）
  private createPartnershipLocal(
    data: {
      brand_name: string;
      brand_logo: string;
      brand_id?: string;
      description: string;
      contact_name: string;
      contact_phone: string;
      contact_email?: string;
      reward?: string;
    },
    applicantId: string
  ): BrandPartnership {
    const partnerships = this.getPartnershipsLocal();
    const newPartnership: BrandPartnership = {
      id: `local-${Date.now()}`,
      ...data,
      applicant_id: applicantId,
      reward: data.reward || '待协商',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    partnerships.push(newPartnership);
    localStorage.setItem('jmzf_brand_partnerships', JSON.stringify(partnerships));
    return newPartnership;
  }

  // 从 localStorage 获取品牌合作申请
  private getPartnershipsLocal(): BrandPartnership[] {
    try {
      const data = localStorage.getItem('jmzf_brand_partnerships');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 保存品牌合作申请到 localStorage
  private savePartnershipsLocal(partnerships: BrandPartnership[]): void {
    try {
      localStorage.setItem('jmzf_brand_partnerships', JSON.stringify(partnerships));
    } catch (error) {
      console.error('保存到 LocalStorage 失败:', error);
    }
  }

  // 获取所有品牌合作申请（管理员用）
  async getAllPartnerships(options?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ partnerships: BrandPartnership[]; total: number }> {
    try {
      const { status, page = 1, limit = 20 } = options || {};
      
      let query = supabase
        .from('brand_partnerships')
        .select('*', { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        partnerships: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('获取品牌合作申请失败:', error);
      return { partnerships: [], total: 0 };
    }
  }

  // 获取当前用户的品牌合作申请
  async getMyPartnerships(userInfo?: { id: string; email?: string }): Promise<BrandPartnership[]> {
    try {
      // 优先使用传入的用户信息，如果没有则尝试从 session 获取
      let userId = userInfo?.id;
      let userEmail = userInfo?.email;
      
      if (!userId) {
        // 获取当前登录用户 - 使用 getSession 更可靠
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.warn('用户未登录，无法获取品牌合作申请');
          return [];
        }
        
        userId = session.user.id;
        userEmail = session.user.email;
      }
      
      console.log('获取品牌申请 - 用户ID:', userId);
      console.log('获取品牌申请 - 用户邮箱:', userEmail);

      // 先尝试通过 applicant_id 查询
      const { data: dataById, error: errorById } = await supabase
        .from('brand_partnerships')
        .select('*')
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false });
        
      console.log('通过ID查询结果:', dataById, '错误:', errorById);

      // 如果通过ID没有查到，再尝试通过邮箱查询（兼容旧数据）
      let dataByEmail: BrandPartnership[] = [];
      if ((!dataById || dataById.length === 0) && userEmail) {
        const { data, error } = await supabase
          .from('brand_partnerships')
          .select('*')
          .eq('contact_email', userEmail)
          .order('created_at', { ascending: false });
          
        console.log('通过邮箱查询结果:', data, '错误:', error);
        
        if (!error && data) {
          dataByEmail = data;
          // 更新这些记录的 applicant_id
          for (const record of data) {
            if (!record.applicant_id) {
              await supabase
                .from('brand_partnerships')
                .update({ applicant_id: userId })
                .eq('id', record.id);
              console.log('已更新记录 applicant_id:', record.id);
            }
          }
        }
      }

      // 合并结果
      const allData = [...(dataById || []), ...dataByEmail];

      // 去重
      const uniqueData = allData.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );

      // 同步到 LocalStorage
      if (uniqueData.length > 0) {
        const existingData = this.getPartnershipsLocal();
        const existingIds = new Set(existingData.map(p => p.id));
        const newData = [...existingData];

        uniqueData.forEach(item => {
          const index = newData.findIndex(p => p.id === item.id);
          if (index >= 0) {
            newData[index] = item;
          } else {
            newData.push(item);
          }
        });

        this.savePartnershipsLocal(newData);
        console.log('品牌数据已同步到 LocalStorage');
      }

      console.log('最终返回的品牌申请:', uniqueData);
      return uniqueData;
    } catch (error) {
      console.error('获取我的品牌合作申请失败:', error);
      // 使用 localStorage 作为回退
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const localPartnerships = this.getPartnershipsLocal();
        const userId = session.user.id;
        const userEmail = session.user.email;
        return localPartnerships.filter(p => 
          p.applicant_id === userId || 
          (userEmail && p.contact_email === userEmail)
        );
      }
      return [];
    }
  }

  // 更新品牌合作申请状态（管理员用）
  async updatePartnershipStatus(
    id: string,
    status: 'pending' | 'negotiating' | 'approved' | 'rejected',
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_partnerships')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新品牌合作申请状态失败:', error);
      return false;
    }
  }

  // 获取已审核通过的品牌列表
  async getApprovedBrands(): Promise<BrandPartnership[]> {
    try {
      const { data, error } = await supabase
        .from('brand_partnerships')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取已审核品牌失败:', error);
      return [];
    }
  }

  // ==================== 品牌活动管理 ====================

  // 创建品牌活动
  async createBrandEvent(data: {
    title: string;
    description: string;
    content: string;
    start_time: string;
    end_time: string;
    location?: string;
    brand_id: string;
    brand_name: string;
    max_participants?: number;
    type: 'online' | 'offline';
    tags?: string[];
    thumbnail_url?: string;
    media?: any[];
  }): Promise<BrandEvent | null> {
    try {
      const { data: event, error } = await supabase
        .from('brand_events')
        .insert([{
          ...data,
          status: 'pending', // 创建后需要审核
          participants: 0,
          is_public: true,
        }])
        .select()
        .single();

      if (error) throw error;
      return event;
    } catch (error) {
      console.error('创建品牌活动失败:', error);
      return null;
    }
  }

  // 获取所有品牌活动（管理员用）
  async getAllBrandEvents(options?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: BrandEvent[]; total: number }> {
    try {
      const { status, page = 1, limit = 20 } = options || {};
      
      let query = supabase
        .from('brand_events')
        .select('*', { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        events: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('获取品牌活动失败:', error);
      return { events: [], total: 0 };
    }
  }

  // 获取已发布的品牌活动（公开用）
  async getPublishedBrandEvents(): Promise<BrandEvent[]> {
    try {
      const { data, error } = await supabase
        .from('brand_events')
        .select('*')
        .eq('status', 'published')
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取已发布品牌活动失败:', error);
      return [];
    }
  }

  // 获取品牌方的活动
  async getBrandEventsByBrandId(brandId: string): Promise<BrandEvent[]> {
    try {
      const { data, error } = await supabase
        .from('brand_events')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取品牌活动失败:', error);
      return [];
    }
  }

  // 更新品牌活动状态（管理员用）
  async updateBrandEventStatus(
    id: string,
    status: 'draft' | 'pending' | 'published' | 'rejected',
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_events')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新品牌活动状态失败:', error);
      return false;
    }
  }

  // 获取统计数据
  async getStats(): Promise<{
    totalPartnerships: number;
    pendingPartnerships: number;
    approvedPartnerships: number;
    totalEvents: number;
    publishedEvents: number;
  }> {
    try {
      const { count: totalPartnerships, error: totalError } = await supabase
        .from('brand_partnerships')
        .select('*', { count: 'exact', head: true });

      // 如果表不存在，使用 localStorage 数据
      if (totalError && (totalError.code === '42P01' || totalError.message?.includes('does not exist'))) {
        const localPartnerships = this.getPartnershipsLocal();
        return {
          totalPartnerships: localPartnerships.length,
          pendingPartnerships: localPartnerships.filter(p => p.status === 'pending').length,
          approvedPartnerships: localPartnerships.filter(p => p.status === 'approved').length,
          totalEvents: 0,
          publishedEvents: 0,
        };
      }

      const { count: pendingPartnerships } = await supabase
        .from('brand_partnerships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approvedPartnerships } = await supabase
        .from('brand_partnerships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: totalEvents } = await supabase
        .from('brand_events')
        .select('*', { count: 'exact', head: true });

      const { count: publishedEvents } = await supabase
        .from('brand_events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      return {
        totalPartnerships: totalPartnerships || 0,
        pendingPartnerships: pendingPartnerships || 0,
        approvedPartnerships: approvedPartnerships || 0,
        totalEvents: totalEvents || 0,
        publishedEvents: publishedEvents || 0,
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 使用 localStorage 作为回退
      const localPartnerships = this.getPartnershipsLocal();
      return {
        totalPartnerships: localPartnerships.length,
        pendingPartnerships: localPartnerships.filter(p => p.status === 'pending').length,
        approvedPartnerships: localPartnerships.filter(p => p.status === 'approved').length,
        totalEvents: 0,
        publishedEvents: 0,
      };
    }
  }
}

export const brandPartnershipService = new BrandPartnershipService();
