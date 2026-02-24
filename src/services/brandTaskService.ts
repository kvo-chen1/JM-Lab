import { supabase } from '@/lib/supabase';

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('请先登录');
      }

      const { data: task, error } = await supabase
        .from('brand_tasks')
        .insert({
          ...data,
          publisher_id: session.user.id,
          remaining_budget: data.total_budget,
          status: 'draft',
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { tasks: [], total: 0 };
      }

      const { status, page = 1, limit = 20 } = options || {};
      
      let query = supabase
        .from('brand_tasks')
        .select('*', { count: 'exact' })
        .eq('publisher_id', session.user.id);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('请先登录');
      }

      const { error } = await supabase
        .from('brand_task_participants')
        .insert({
          task_id: taskId,
          creator_id: session.user.id,
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

  async submitWork(data: SubmitWorkRequest): Promise<BrandTaskSubmission | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('请先登录');
      }

      // 获取参与记录
      const { data: participant } = await supabase
        .from('brand_task_participants')
        .select('id')
        .eq('task_id', data.task_id)
        .eq('creator_id', session.user.id)
        .single();

      if (!participant) {
        throw new Error('请先申请参与该任务');
      }

      const { data: submission, error } = await supabase
        .from('brand_task_submissions')
        .insert({
          ...data,
          participant_id: participant.id,
          creator_id: session.user.id,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }

      const { data, error } = await supabase
        .from('brand_task_participants')
        .select(`
          *,
          task:brand_tasks(*)
        `)
        .eq('creator_id', session.user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取我的参与记录失败:', error);
      return [];
    }
  }

  async getMySubmissions(taskId?: string): Promise<BrandTaskSubmission[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }

      let query = supabase
        .from('brand_task_submissions')
        .select(`
          *,
          task:brand_tasks(title, brand_name),
          work:works(id, title, thumbnail, view_count)
        `)
        .eq('creator_id', session.user.id);

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
      const { error } = await supabase
        .from('brand_task_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .eq('id', submissionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('审核作品失败:', error);
      return false;
    }
  }

  async rejectSubmission(submissionId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
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
        .select(`
          *,
          creator:users(id, username, avatar_url)
        `)
        .eq('task_id', taskId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取任务参与者失败:', error);
      return [];
    }
  }

  async getTaskSubmissions(taskId: string, status?: string): Promise<BrandTaskSubmission[]> {
    try {
      let query = supabase
        .from('brand_task_submissions')
        .select(`
          *,
          creator:users(id, username, avatar_url),
          work:works(id, title, thumbnail, view_count)
        `)
        .eq('task_id', taskId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
      const { data: submission } = await supabase
        .from('brand_task_submissions')
        .select('task_id')
        .eq('id', submissionId)
        .single();

      if (!submission) return null;

      const { data: task } = await supabase
        .from('brand_tasks')
        .select('incentive_model')
        .eq('id', submission.task_id)
        .single();

      if (!task) return null;

      // 调用RPC函数计算奖励
      const { data: reward, error } = await supabase
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
      const { error } = await supabase
        .from('brand_task_submissions')
        .update({
          final_reward: reward,
          reward_calculated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新奖励失败:', error);
      return false;
    }
  }

  // ========================================================================
  // 资金管理
  // ========================================================================

  async getBrandAccount(): Promise<BrandAccount | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('brand_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('获取品牌账户失败:', error);
      return null;
    }
  }

  async createBrandAccount(brandId?: string): Promise<BrandAccount | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('brand_accounts')
        .insert({
          user_id: session.user.id,
          brand_id,
          total_balance: 0,
          available_balance: 0,
          frozen_balance: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('创建品牌账户失败:', error);
      return null;
    }
  }

  async deposit(amount: number, paymentMethod: string, reference: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      // 获取账户
      let { data: account } = await supabase
        .from('brand_accounts')
        .select('*')
        .eq('user_id', session.user.id)
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
          user_id: session.user.id,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { transactions: [], total: 0 };
      }

      const { type, page = 1, limit = 20 } = options || {};
      
      let query = supabase
        .from('brand_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id);

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        transactions: data || [],
        total: count || 0,
      };
    } catch (error) {
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { earnings: [], total: 0 };
      }

      const { status, page = 1, limit = 20 } = options || {};
      
      let query = supabase
        .from('creator_earnings')
        .select(`
          *,
          task:brand_tasks(title, brand_name)
        `, { count: 'exact' })
        .eq('creator_id', session.user.id);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return {
          total_earnings: 0,
          pending_earnings: 0,
          paid_earnings: 0,
          this_month: 0,
        };
      }

      const { data, error } = await supabase
        .from('creator_earnings')
        .select('amount, status, created_at')
        .eq('creator_id', session.user.id);

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
