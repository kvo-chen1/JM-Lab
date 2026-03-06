import { supabase, supabaseAdmin } from '@/lib/supabase';

// ==========================================================================
// 辅助函数：获取当前用户信息
// ==========================================================================

export interface UserInfo {
  id: string;
  email?: string;
}

/**
 * 获取当前登录用户信息
 * 优先从 Supabase session 获取，如果不存在则从 localStorage 获取
 */
async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    // 首先尝试从 Supabase 获取 session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log('[getCurrentUser] 从 Supabase session 获取用户:', session.user.id);
      return {
        id: session.user.id,
        email: session.user.email,
      };
    }

    // 如果 Supabase session 不存在，尝试从 localStorage 获取用户信息
    // 注意：后端返回的 token 不能用于恢复 Supabase session
    // 需要通过 Supabase 直接登录或使用后端返回的 supabaseSession
    const userStr = localStorage.getItem('user');
    
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) {
        console.log('[getCurrentUser] 从 localStorage 获取用户:', user.id);
        console.warn('[getCurrentUser] 警告: Supabase session 不存在，RLS 查询可能会失败');
        return {
          id: user.id,
          email: user.email,
        };
      }
    }

    console.warn('[getCurrentUser] 用户未登录');
    return null;
  } catch (error) {
    console.error('获取当前用户失败:', error);
    return null;
  }
}

// ==========================================================================
// 类型定义
// ==========================================================================

export interface IncentiveModel {
  type: 'performance_based' | 'fixed' | 'hybrid';
  metrics: {
    views?: { weight: number; rate_per_1000: number };
    likes?: { weight: number; rate_per: number };
    favorites?: { weight: number; rate_per: number };
    shares?: { weight: number; rate_per: number };
    comments?: { weight: number; rate_per: number };
  };
  max_reward_per_work: number;
  min_reward_per_work: number;
}

export interface BrandTask {
  id: string;
  title: string;
  description: string;
  content?: string;
  cover_image?: string;
  cover_video?: string;
  brand_id?: string;
  brand_name: string;
  brand_logo?: string;
  publisher_id: string;
  required_tags: string[];
  required_location: string;
  content_requirements: string[];
  participation_conditions: string[];
  start_date: string;
  end_date: string;
  total_budget: number;
  remaining_budget?: number;
  min_reward?: number;
  max_reward?: number;
  incentive_model: IncentiveModel;
  max_participants: number;
  current_participants: number;
  max_works_per_user: number;
  require_approval: boolean;
  auto_approval_threshold?: number;
  status: 'draft' | 'pending' | 'published' | 'paused' | 'completed' | 'cancelled';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  total_works: number;
  approved_works: number;
  total_views: number;
  total_likes: number;
  total_favorites: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface BrandTaskParticipant {
  id: string;
  task_id: string;
  creator_id: string;
  status: 'applied' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  submitted_works: number;
  approved_works: number;
  total_earnings: number;
  pending_earnings: number;
  withdrawn_earnings: number;
  application_message?: string;
  portfolio_links: string[];
  applied_at: string;
  approved_at?: string;
  completed_at?: string;
  creator?: {
    id: string;
    username: string;
    avatar_url?: string;
    followers_count?: number;
  };
}

export interface BrandTaskSubmission {
  id: string;
  task_id: string;
  participant_id: string;
  creator_id: string;
  work_id?: string;
  work_title: string;
  work_url?: string;
  work_thumbnail?: string;
  content?: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  views_at_submit: number;
  likes_at_submit: number;
  favorites_at_submit: number;
  shares_at_submit: number;
  current_views: number;
  current_likes: number;
  current_favorites: number;
  current_shares: number;
  estimated_reward?: number;
  final_reward?: number;
  reward_calculated_at?: string;
  submitted_at: string;
  approved_at?: string;
  updated_at: string;
  creator?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  work?: {
    id: string;
    title: string;
    thumbnail?: string;
    view_count: number;
    likes_count: number;
  };
}

export interface BrandAccount {
  id: string;
  brand_id?: string;
  user_id: string;
  total_balance: number;
  available_balance: number;
  frozen_balance: number;
  total_deposited: number;
  total_spent: number;
  total_withdrawn: number;
  status: 'active' | 'frozen' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface BrandTransaction {
  id: string;
  account_id: string;
  brand_id?: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'task_budget' | 'task_reward' | 'refund' | 'fee' | 'adjustment';
  amount: number;
  balance_after: number;
  task_id?: string;
  submission_id?: string;
  description?: string;
  payment_method?: string;
  payment_reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  completed_at?: string;
}

export interface BrandTaskAnalytics {
  id: string;
  task_id: string;
  date: string;
  new_participants: number;
  new_submissions: number;
  approved_submissions: number;
  views: number;
  likes: number;
  favorites: number;
  shares: number;
  comments: number;
  rewards_paid: number;
}

export interface CreatorEarning {
  id: string;
  creator_id: string;
  task_id: string;
  submission_id?: string;
  amount: number;
  source_type: 'task_reward' | 'bonus' | 'adjustment';
  calculation_basis: {
    views?: number;
    likes?: number;
    favorites?: number;
    shares?: number;
    rates?: Record<string, number>;
  };
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paid_at?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  task?: {
    title: string;
    brand_name: string;
  };
}

export interface TaskStats {
  total_participants: number;
  total_submissions: number;
  approved_submissions: number;
  pending_submissions: number;
  total_views: number;
  total_likes: number;
  total_favorites: number;
  total_rewards: number;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  content?: string;
  brand_id?: string;
  brand_name: string;
  brand_logo?: string;
  required_tags: string[];
  required_location?: string;
  content_requirements?: string[];
  participation_conditions?: string[];
  start_date: string;
  end_date: string;
  total_budget: number;
  min_reward?: number;
  max_reward?: number;
  incentive_model: IncentiveModel;
  max_participants?: number;
  max_works_per_user?: number;
  require_approval?: boolean;
  auto_approval_threshold?: number;
}

export interface SubmitWorkRequest {
  task_id: string;
  work_title: string;
  work_url?: string;
  work_thumbnail?: string;
  content?: string;
  tags?: string[];
  work_id?: string;
}

// ==========================================================================
// 品牌任务服务
// ==========================================================================

class BrandTaskService {
  // ========================================================================
  // 任务管理 - 品牌方
  // ========================================================================

  async createTask(data: CreateTaskRequest): Promise<BrandTask | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('请先登录');
      }

      const { data: task, error } = await supabase
        .from('brand_tasks')
        .insert({
          ...data,
          publisher_id: user.id,
          remaining_budget: data.total_budget,
          status: 'pending',
          published_at: null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase插入错误:', error);
        if (error.code === '42P01') {
          throw new Error('数据库表不存在，请联系管理员');
        }
        if (error.code === '23502') {
          throw new Error('缺少必填字段: ' + error.message);
        }
        if (error.code === '23503') {
          throw new Error('外键约束错误: ' + error.message);
        }
        throw new Error(error.message || '创建任务失败');
      }
      return task;
    } catch (error: any) {
      console.error('创建品牌任务失败:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, data: Partial<CreateTaskRequest>): Promise<BrandTask | null> {
    try {
      const { data: task, error } = await supabase
        .from('brand_tasks')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return task;
    } catch (error) {
      console.error('更新品牌任务失败:', error);
      throw error;
    }
  }

  async publishTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_tasks')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('发布品牌任务失败:', error);
      return false;
    }
  }

  async approveTask(taskId: string, notes?: string): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      const { error } = await supabase
        .from('brand_tasks')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('审核通过任务失败:', error);
      return false;
    }
  }

  async rejectTask(taskId: string, reason: string): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      const { error } = await supabase
        .from('brand_tasks')
        .update({
          status: 'cancelled',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('拒绝任务失败:', error);
      return false;
    }
  }

  async pauseTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_tasks')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('暂停品牌任务失败:', error);
      return false;
    }
  }

  async completeTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_tasks')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('完成任务失败:', error);
      return false;
    }
  }

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除任务失败:', error);
      return false;
    }
  }

  // ========================================================================
  // 任务查询
  // ========================================================================

  async getTaskById(taskId: string): Promise<BrandTask | null> {
    try {
      const { data, error } = await supabase
        .from('brand_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取任务详情失败:', error);
      return null;
    }
  }

  async getPublishedTasks(options?: {
    brandId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tasks: BrandTask[]; total: number }> {
    try {
      const { brandId, page = 1, limit = 20 } = options || {};
      
      let query = supabase
        .from('brand_tasks')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .gte('end_date', new Date().toISOString());

      if (brandId) {
        query = query.eq('brand_id', brandId);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        tasks: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('获取已发布任务失败:', error);
      return { tasks: [], total: 0 };
    }
  }

  async getMyTasks(options?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tasks: BrandTask[]; total: number }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { tasks: [], total: 0 };
      }

      const { status, page = 1, limit = 20 } = options || {};
      
      let query = supabase
        .from('brand_tasks')
        .select('*', { count: 'exact' })
        .eq('publisher_id', user.id);

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
        tasks: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('获取我的任务失败:', error);
      return { tasks: [], total: 0 };
    }
  }

  // ========================================================================
  // 任务参与 - 创作者
  // ========================================================================

  async applyForTask(taskId: string, message?: string, portfolioLinks?: string[]): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('请先登录');
      }

      const { error } = await supabase
        .from('brand_task_participants')
        .insert({
          task_id: taskId,
          creator_id: user.id,
          status: 'applied',
          application_message: message,
          portfolio_links: portfolioLinks || [],
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('申请参与任务失败:', error);
      return false;
    }
  }

  async submitWork(data: SubmitWorkRequest, currentUser?: UserInfo | null): Promise<BrandTaskSubmission | null> {
    try {
      const user = currentUser || await getCurrentUser();
      if (!user) {
        throw new Error('请先登录');
      }

      // 获取参与记录（状态为 approved 或 active）
      const { data: participant } = await supabaseAdmin
        .from('brand_task_participants')
        .select('id')
        .eq('task_id', data.task_id)
        .eq('creator_id', user.id)
        .in('status', ['approved', 'active'])
        .single();

      if (!participant) {
        throw new Error('请先申请参与该任务并等待审核通过');
      }

      // 使用 supabaseAdmin 绕过 RLS 插入数据
      const { data: submission, error } = await supabaseAdmin
        .from('brand_task_submissions')
        .insert({
          ...data,
          participant_id: participant.id,
          creator_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return submission;
    } catch (error) {
      console.error('提交作品失败:', error);
      throw error;
    }
  }

  async getMyParticipations(): Promise<BrandTaskParticipant[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabaseAdmin
        .from('brand_task_participants')
        .select('*')
        .eq('creator_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      
      const participants = data || [];
      
      // 获取任务信息
      const taskIds = [...new Set(participants.map(p => p.task_id).filter(Boolean))];
      if (taskIds.length > 0) {
        const { data: tasksData } = await supabaseAdmin
          .from('brand_tasks')
          .select('*')
          .in('id', taskIds);
        
        const tasksMap = new Map(tasksData?.map(t => [t.id, t]) || []);
        
        return participants.map(p => ({
          ...p,
          task: tasksMap.get(p.task_id) || undefined
        }));
      }
      
      return participants;
    } catch (error) {
      console.error('获取我的参与记录失败:', error);
      return [];
    }
  }

  async getMySubmissions(taskId?: string): Promise<BrandTaskSubmission[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return [];
      }

      let query = supabaseAdmin
        .from('brand_task_submissions')
        .select('*')
        .eq('creator_id', user.id);

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      const submissions = data || [];
      
      // 获取任务信息
      const taskIds = [...new Set(submissions.map(s => s.task_id).filter(Boolean))];
      let tasksMap = new Map();
      if (taskIds.length > 0) {
        const { data: tasksData } = await supabaseAdmin
          .from('brand_tasks')
          .select('id, title, brand_name')
          .in('id', taskIds);
        tasksMap = new Map(tasksData?.map(t => [t.id, t]) || []);
      }
      
      // 获取作品信息
      const workIds = [...new Set(submissions.map(s => s.work_id).filter(Boolean))];
      let worksMap = new Map();
      if (workIds.length > 0) {
        const { data: worksData } = await supabaseAdmin
          .from('works')
          .select('id, title, thumbnail, view_count')
          .in('id', workIds);
        worksMap = new Map(worksData?.map(w => [w.id, w]) || []);
      }
      
      return submissions.map(s => ({
        ...s,
        task: tasksMap.get(s.task_id) || undefined,
        work: worksMap.get(s.work_id) || undefined
      }));
    } catch (error) {
      console.error('获取我的提交记录失败:', error);
      return [];
    }
  }

  // ========================================================================
  // 任务审核 - 品牌方
  // ========================================================================

  async approveParticipant(participantId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_task_participants')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', participantId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('审核参与者失败:', error);
      return false;
    }
  }

  async rejectParticipant(participantId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_task_participants')
        .update({
          status: 'rejected',
        })
        .eq('id', participantId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('拒绝参与者失败:', error);
      return false;
    }
  }

  async approveSubmission(submissionId: string, notes?: string): Promise<boolean> {
    try {
      // 1. 更新提交记录状态为 approved
      const { error } = await supabaseAdmin
        .from('brand_task_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .eq('id', submissionId);

      if (error) throw error;

      // 2. 自动计算并发放奖励
      console.log('[approveSubmission] 开始自动计算奖励:', submissionId);
      
      // 获取提交记录的当前数据（包括作品浏览量）
      const { data: submission } = await supabaseAdmin
        .from('brand_task_submissions')
        .select('id, work_id, current_views, current_likes, current_favorites, current_shares')
        .eq('id', submissionId)
        .single();

      if (submission) {
        // 计算奖励
        const reward = await this.calculateReward(
          submissionId,
          submission.current_views || 0,
          submission.current_likes || 0,
          submission.current_favorites || 0,
          submission.current_shares || 0
        );

        if (reward !== null && reward > 0) {
          console.log('[approveSubmission] 计算到奖励:', reward);
          // 更新奖励
          await this.updateSubmissionReward(submissionId, reward);
        } else {
          console.log('[approveSubmission] 奖励为0或计算失败，跳过奖励发放');
        }
      }

      return true;
    } catch (error) {
      console.error('审核作品失败:', error);
      return false;
    }
  }

  async rejectSubmission(submissionId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('brand_task_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', submissionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('拒绝作品失败:', error);
      return false;
    }
  }

  async requestRevision(submissionId: string, notes: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_task_submissions')
        .update({
          status: 'needs_revision',
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .eq('id', submissionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('请求修改失败:', error);
      return false;
    }
  }

  // ========================================================================
  // 任务统计与数据
  // ========================================================================

  async getTaskParticipants(taskId: string): Promise<BrandTaskParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('brand_task_participants')
        .select('*')
        .eq('task_id', taskId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      
      // 获取参与者用户信息
      const participants = data || [];
      const creatorIds = [...new Set(participants.map(p => p.creator_id).filter(Boolean))];
      
      if (creatorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', creatorIds);
        
        const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);
        
        return participants.map(p => ({
          ...p,
          creator: usersMap.get(p.creator_id) || undefined
        }));
      }
      
      return participants;
    } catch (error) {
      console.error('获取任务参与者失败:', error);
      return [];
    }
  }

  async getTaskSubmissions(taskId: string, status?: string): Promise<BrandTaskSubmission[]> {
    try {
      // 使用 supabaseAdmin 绕过 RLS 获取所有提交
      let query = supabaseAdmin
        .from('brand_task_submissions')
        .select('*')
        .eq('task_id', taskId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const submissions = data || [];

      // 获取创作者信息
      const creatorIds = [...new Set(submissions.map(s => s.creator_id).filter(Boolean))];
      if (creatorIds.length > 0) {
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, username, avatar_url')
          .in('id', creatorIds);

        const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

        // 获取作品信息
        const workIds = [...new Set(submissions.map(s => s.work_id).filter(Boolean))];
        let worksMap = new Map();
        if (workIds.length > 0) {
          const { data: worksData } = await supabaseAdmin
            .from('works')
            .select('id, title, thumbnail, view_count')
            .in('id', workIds);
          worksMap = new Map(worksData?.map(w => [w.id, w]) || []);
        }
        
        return submissions.map(s => ({
          ...s,
          creator: usersMap.get(s.creator_id) || undefined,
          work: worksMap.get(s.work_id) || undefined
        }));
      }
      
      return submissions;
    } catch (error) {
      console.error('获取任务提交失败:', error);
      return [];
    }
  }

  async getTaskStats(taskId: string): Promise<TaskStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_brand_task_stats', { p_task_id: taskId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取任务统计失败:', error);
      return null;
    }
  }

  async getTaskAnalytics(taskId: string, days: number = 30): Promise<BrandTaskAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('brand_task_analytics')
        .select('*')
        .eq('task_id', taskId)
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取任务分析数据失败:', error);
      return [];
    }
  }

  // ========================================================================
  // 激励计算
  // ========================================================================

  async calculateReward(
    submissionId: string,
    views: number,
    likes: number,
    favorites: number,
    shares: number
  ): Promise<number | null> {
    try {
      // 获取提交记录和任务配置
      const { data: submission } = await supabaseAdmin
        .from('brand_task_submissions')
        .select('task_id')
        .eq('id', submissionId)
        .single();

      if (!submission) return null;

      const { data: task } = await supabaseAdmin
        .from('brand_tasks')
        .select('incentive_model')
        .eq('id', submission.task_id)
        .single();

      if (!task) return null;

      // 调用RPC函数计算奖励
      const { data: reward, error } = await supabaseAdmin
        .rpc('calculate_work_reward', {
          p_views: views,
          p_likes: likes,
          p_favorites: favorites,
          p_shares: shares,
          p_incentive_model: task.incentive_model,
        });

      if (error) throw error;
      return reward;
    } catch (error) {
      console.error('计算奖励失败:', error);
      return null;
    }
  }

  async updateSubmissionReward(submissionId: string, reward: number): Promise<boolean> {
    try {
      console.log('[updateSubmissionReward] 开始更新奖励:', { submissionId, reward });
      
      // 获取提交记录信息
      const { data: submission, error: submissionError } = await supabaseAdmin
        .from('brand_task_submissions')
        .select('task_id, creator_id, participant_id')
        .eq('id', submissionId)
        .single();

      if (submissionError) {
        console.error('[updateSubmissionReward] 获取提交记录失败:', submissionError);
        return false;
      }

      if (!submission) {
        console.error('[updateSubmissionReward] 提交记录不存在');
        return false;
      }
      
      console.log('[updateSubmissionReward] 获取到提交记录:', submission);

      // 更新提交记录的奖励
      const { error: updateError } = await supabaseAdmin
        .from('brand_task_submissions')
        .update({
          final_reward: reward,
          reward_calculated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('[updateSubmissionReward] 更新提交记录奖励失败:', updateError);
        throw updateError;
      }
      
      console.log('[updateSubmissionReward] 提交记录奖励已更新');

      // 创建创作者收益记录
      const earningsData = {
        creator_id: submission.creator_id,
        task_id: submission.task_id,
        submission_id: submissionId,
        amount: reward,
        status: 'approved', // 审核通过后直接设为 approved，表示可提现
        source_type: 'task_reward',
        created_at: new Date().toISOString(),
      };
      console.log('[updateSubmissionReward] 准备创建收益记录:', earningsData);
      
      const { error: earningsError } = await supabaseAdmin
        .from('creator_earnings')
        .insert(earningsData);

      if (earningsError) {
        console.error('[updateSubmissionReward] 创建收益记录失败:', earningsError);
        // 不影响主流程，继续返回成功
      } else {
        console.log('[updateSubmissionReward] 收益记录创建成功');
      }

      // 更新参与者的收益统计
      if (submission.participant_id) {
        console.log('[updateSubmissionReward] 更新参与者收益统计, participant_id:', submission.participant_id);
        
        const { data: participant, error: participantQueryError } = await supabaseAdmin
          .from('brand_task_participants')
          .select('total_earnings, pending_earnings, approved_works')
          .eq('id', submission.participant_id)
          .single();

        if (participantQueryError) {
          console.error('[updateSubmissionReward] 获取参与者信息失败:', participantQueryError);
        } else if (participant) {
          console.log('[updateSubmissionReward] 获取到参与者信息:', participant);
          
          const newTotalEarnings = (participant.total_earnings || 0) + reward;
          const newPendingEarnings = (participant.pending_earnings || 0) + reward;
          const newApprovedWorks = (participant.approved_works || 0) + 1;
          
          console.log('[updateSubmissionReward] 更新后的数据:', {
            total_earnings: newTotalEarnings,
            pending_earnings: newPendingEarnings,
            approved_works: newApprovedWorks,
          });
          
          const { error: participantError } = await supabaseAdmin
            .from('brand_task_participants')
            .update({
              total_earnings: newTotalEarnings,
              pending_earnings: newPendingEarnings,
              approved_works: newApprovedWorks,
            })
            .eq('id', submission.participant_id);

          if (participantError) {
            console.error('[updateSubmissionReward] 更新参与者收益统计失败:', participantError);
          } else {
            console.log('[updateSubmissionReward] 参与者收益统计更新成功');
          }
        } else {
          console.warn('[updateSubmissionReward] 未找到参与者信息');
        }
      } else {
        console.warn('[updateSubmissionReward] 提交记录没有 participant_id');
      }

      // 同步到变现中心的收入表（creator_revenue 和 revenue_records）
      await this.syncRewardToCreatorRevenue(submission.creator_id, reward, submission.task_id);

      console.log('[updateSubmissionReward] 奖励更新完成');
      return true;
    } catch (error) {
      console.error('[updateSubmissionReward] 更新奖励失败:', error);
      return false;
    }
  }

  // 同步奖励到变现中心的收入表
  private async syncRewardToCreatorRevenue(
    creatorId: string,
    reward: number,
    taskId: string
  ): Promise<void> {
    try {
      console.log('[syncRewardToCreatorRevenue] 开始同步到变现中心:', { creatorId, reward, taskId });

      // 1. 创建收入明细记录（revenue_records）
      const { error: recordError } = await supabaseAdmin
        .from('revenue_records')
        .insert({
          user_id: creatorId,
          amount: reward,
          type: 'task',
          description: '品牌任务奖励',
          status: 'completed',
          created_at: new Date().toISOString(),
        });

      if (recordError) {
        console.error('[syncRewardToCreatorRevenue] 创建收入明细失败:', recordError);
      } else {
        console.log('[syncRewardToCreatorRevenue] 收入明细创建成功');
      }

      // 2. 更新创作者收入汇总（creator_revenue）
      // 先检查是否已有记录
      const { data: existingRevenue } = await supabaseAdmin
        .from('creator_revenue')
        .select('*')
        .eq('user_id', creatorId)
        .single();

      if (existingRevenue) {
        // 更新现有记录
        const { error: updateError } = await supabaseAdmin
          .from('creator_revenue')
          .update({
            total_revenue: (existingRevenue.total_revenue || 0) + reward,
            monthly_revenue: (existingRevenue.monthly_revenue || 0) + reward,
            pending_revenue: (existingRevenue.pending_revenue || 0) + reward,
            withdrawable_revenue: (existingRevenue.withdrawable_revenue || 0) + reward,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', creatorId);

        if (updateError) {
          console.error('[syncRewardToCreatorRevenue] 更新收入汇总失败:', updateError);
        } else {
          console.log('[syncRewardToCreatorRevenue] 收入汇总更新成功');
        }
      } else {
        // 创建新记录
        const { error: insertError } = await supabaseAdmin
          .from('creator_revenue')
          .insert({
            user_id: creatorId,
            total_revenue: reward,
            monthly_revenue: reward,
            pending_revenue: reward,
            withdrawable_revenue: reward,
            total_withdrawn: 0,
            last_month_revenue: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('[syncRewardToCreatorRevenue] 创建收入汇总失败:', insertError);
        } else {
          console.log('[syncRewardToCreatorRevenue] 收入汇总创建成功');
        }
      }
    } catch (error) {
      console.error('[syncRewardToCreatorRevenue] 同步失败:', error);
      // 不影响主流程
    }
  }

  // ========================================================================
  // 资金管理
  // ========================================================================

  async getBrandAccount(): Promise<BrandAccount | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.warn('[getBrandAccount] 用户未登录');
        return null;
      }

      // 检查 Supabase session 是否有效
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 使用 Supabase 直接查询
        console.log('[getBrandAccount] 使用 Supabase session 查询');
        const { data, error } = await supabase
          .from('brand_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('[getBrandAccount] 账户不存在，需要创建');
            return null;
          }
          console.error('[getBrandAccount] 查询账户失败:', error);
          throw error;
        }
        return data;
      } else {
        // 使用后端 API 查询（绕过 RLS）
        console.log('[getBrandAccount] Supabase session 不存在，使用后端 API 查询');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[getBrandAccount] 未找到 token，无法调用后端 API');
          return null;
        }
        
        const response = await fetch('/api/brand/account', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('[getBrandAccount] 后端 API 调用失败:', response.status);
          return null;
        }
        
        const result = await response.json();
        if (result.code !== 0) {
          console.error('[getBrandAccount] 后端 API 返回错误:', result.message);
          return null;
        }
        
        console.log('[getBrandAccount] 后端 API 返回:', result.data ? '有数据' : '无数据');
        return result.data;
      }
    } catch (error: any) {
      console.error('[getBrandAccount] 获取品牌账户失败:', error);
      return null;
    }
  }

  async createBrandAccount(brandId?: string): Promise<BrandAccount | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.warn('[createBrandAccount] 用户未登录');
        return null;
      }

      // 检查 Supabase session 是否有效
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 使用 Supabase 直接创建
        console.log('[createBrandAccount] 使用 Supabase session 创建账户');
        const insertData: Record<string, unknown> = {
          user_id: user.id,
          total_balance: 0,
          available_balance: 0,
          frozen_balance: 0,
          total_deposited: 0,
          total_spent: 0,
          total_withdrawn: 0,
          status: 'active',
        };
        if (brandId) {
          insertData.brand_id = brandId;
        }

        const { data, error } = await supabase
          .from('brand_accounts')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            console.log('[createBrandAccount] 账户已存在，尝试获取现有账户');
            return await this.getBrandAccount();
          }
          console.error('[createBrandAccount] 创建账户失败:', error);
          throw error;
        }
        console.log('[createBrandAccount] 账户创建成功:', data);
        return data;
      } else {
        // 使用后端 API 创建（绕过 RLS）
        console.log('[createBrandAccount] Supabase session 不存在，使用后端 API 创建');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[createBrandAccount] 未找到 token，无法调用后端 API');
          return null;
        }
        
        const response = await fetch('/api/brand/account', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ brand_id: brandId })
        });
        
        if (!response.ok) {
          console.error('[createBrandAccount] 后端 API 调用失败:', response.status);
          return null;
        }
        
        const result = await response.json();
        if (result.code !== 0) {
          console.error('[createBrandAccount] 后端 API 返回错误:', result.message);
          return null;
        }
        
        console.log('[createBrandAccount] 后端 API 创建账户成功:', result.data);
        return result.data;
      }
    } catch (error: any) {
      console.error('[createBrandAccount] 创建品牌账户失败:', error);
      return null;
    }
  }

  async deposit(amount: number, paymentMethod: string, reference: string): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) return false;

      // 检查 Supabase session 是否有效
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 使用 Supabase 直接操作
        console.log('[deposit] 使用 Supabase session 进行充值');
        
        // 获取账户
        let { data: account } = await supabase
          .from('brand_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // 如果没有账户，创建一个
        if (!account) {
          account = await this.createBrandAccount();
        }

        if (!account) return false;

        const newBalance = account.total_balance + amount;

        // 创建交易记录
        const { error: transactionError } = await supabase
          .from('brand_transactions')
          .insert({
            account_id: account.id,
            user_id: user.id,
            type: 'deposit',
            amount,
            balance_after: newBalance,
            payment_method: paymentMethod,
            payment_reference: reference,
            description: `充值 ${amount} 元`,
          });

        if (transactionError) throw transactionError;

        // 更新账户余额
        const { error: accountError } = await supabase
          .from('brand_accounts')
          .update({
            total_balance: newBalance,
            available_balance: account.available_balance + amount,
            total_deposited: account.total_deposited + amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id);

        if (accountError) throw accountError;

        return true;
      } else {
        // 使用后端 API 进行充值（绕过 RLS）
        console.log('[deposit] Supabase session 不存在，使用后端 API 进行充值');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[deposit] 未找到 token，无法调用后端 API');
          return false;
        }
        
        const response = await fetch('/api/brand/deposit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount,
            payment_method: paymentMethod,
            reference
          })
        });
        
        if (!response.ok) {
          console.error('[deposit] 后端 API 调用失败:', response.status);
          return false;
        }
        
        const result = await response.json();
        if (result.code !== 0) {
          console.error('[deposit] 后端 API 返回错误:', result.message);
          return false;
        }
        
        console.log('[deposit] 后端 API 充值成功');
        return true;
      }
    } catch (error) {
      console.error('充值失败:', error);
      return false;
    }
  }

  async getTransactions(options?: {
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: BrandTransaction[]; total: number }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.warn('[getTransactions] 用户未登录');
        return { transactions: [], total: 0 };
      }

      // 检查 Supabase session 是否有效
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 使用 Supabase 直接查询
        console.log('[getTransactions] 使用 Supabase session 查询');
        const { type, page = 1, limit = 20 } = options || {};

        let query = supabase
          .from('brand_transactions')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);

        if (type && type !== 'all') {
          query = query.eq('type', type);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) {
          console.error('[getTransactions] 查询交易记录失败:', error);
          throw error;
        }

        return {
          transactions: data || [],
          total: count || 0,
        };
      } else {
        // 使用后端 API 查询（绕过 RLS）
        console.log('[getTransactions] Supabase session 不存在，使用后端 API 查询');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[getTransactions] 未找到 token，无法调用后端 API');
          return { transactions: [], total: 0 };
        }
        
        const { type, page = 1, limit = 20 } = options || {};
        const params = new URLSearchParams();
        if (type && type !== 'all') params.append('type', type);
        params.append('page', String(page));
        params.append('limit', String(limit));
        
        const response = await fetch(`/api/brand/transactions?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('[getTransactions] 后端 API 调用失败:', response.status);
          return { transactions: [], total: 0 };
        }
        
        const result = await response.json();
        if (result.code !== 0) {
          console.error('[getTransactions] 后端 API 返回错误:', result.message);
          return { transactions: [], total: 0 };
        }
        
        console.log('[getTransactions] 后端 API 返回交易记录:', result.data?.transactions?.length || 0);
        return {
          transactions: result.data?.transactions || [],
          total: result.data?.total || 0,
        };
      }
    } catch (error: any) {
      console.error('获取交易记录失败:', error);
      return { transactions: [], total: 0 };
    }
  }

  // ========================================================================
  // 创作者收益
  // ========================================================================

  async getMyEarnings(options?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ earnings: CreatorEarning[]; total: number }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { earnings: [], total: 0 };
      }

      const { status, page = 1, limit = 20 } = options || {};

      let query = supabaseAdmin
        .from('creator_earnings')
        .select('*', { count: 'exact' })
        .eq('creator_id', user.id);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      const earnings = data || [];
      
      // 获取任务信息
      const taskIds = [...new Set(earnings.map(e => e.task_id).filter(Boolean))];
      if (taskIds.length > 0) {
        const { data: tasksData } = await supabaseAdmin
          .from('brand_tasks')
          .select('id, title, brand_name')
          .in('id', taskIds);
        
        const tasksMap = new Map(tasksData?.map(t => [t.id, t]) || []);
        
        return {
          earnings: earnings.map(e => ({
            ...e,
            task: tasksMap.get(e.task_id) || undefined
          })),
          total: count || 0
        };
      }

      return {
        earnings: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('获取收益记录失败:', error);
      return { earnings: [], total: 0 };
    }
  }

  async getEarningsSummary(): Promise<{
    total_earnings: number;
    pending_earnings: number;
    paid_earnings: number;
    this_month: number;
  }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return {
          total_earnings: 0,
          pending_earnings: 0,
          paid_earnings: 0,
          this_month: 0,
        };
      }

      const { data, error } = await supabaseAdmin
        .from('creator_earnings')
        .select('amount, status, created_at')
        .eq('creator_id', user.id);

      if (error) throw error;

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      let total = 0;
      let pending = 0;
      let paid = 0;
      let thisMonthTotal = 0;

      data?.forEach(earning => {
        total += earning.amount;
        
        if (earning.status === 'pending' || earning.status === 'approved') {
          pending += earning.amount;
        } else if (earning.status === 'paid') {
          paid += earning.amount;
        }

        const createdAt = new Date(earning.created_at);
        if (createdAt.getMonth() === thisMonth && createdAt.getFullYear() === thisYear) {
          thisMonthTotal += earning.amount;
        }
      });

      return {
        total_earnings: total,
        pending_earnings: pending,
        paid_earnings: paid,
        this_month: thisMonthTotal,
      };
    } catch (error) {
      console.error('获取收益汇总失败:', error);
      return {
        total_earnings: 0,
        pending_earnings: 0,
        paid_earnings: 0,
        this_month: 0,
      };
    }
  }
}

export const brandTaskService = new BrandTaskService();
export default brandTaskService;
