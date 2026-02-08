/**
 * Supabase 积分系统类型定义
 * 对应数据库表结构
 */

// 用户积分余额
export interface UserPointsBalance {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  version: number;
  last_updated_at: string;
  created_at: string;
  updated_at: string;
}

// 积分记录
export interface PointsRecord {
  id: string;
  user_id: string;
  points: number;
  type: 'earned' | 'spent' | 'adjustment';
  source: string;
  source_type: 'achievement' | 'task' | 'daily' | 'consumption' | 'exchange' | 'system' | 'invite' | 'checkin';
  description: string;
  balance_after: number;
  related_id?: string;
  related_type?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  expires_at?: string;
}

// 积分规则
export interface PointsRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'earn' | 'spend' | 'limit';
  source_type: string;
  points: number;
  min_points?: number;
  max_points?: number;
  ratio?: number;
  daily_limit?: number;
  weekly_limit?: number;
  monthly_limit?: number;
  yearly_limit?: number;
  is_active: boolean;
  priority: number;
  conditions: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 签到记录
export interface CheckinRecord {
  id: string;
  user_id: string;
  checkin_date: string;
  consecutive_days: number;
  points_earned: number;
  is_bonus: boolean;
  bonus_points: number;
  is_retroactive: boolean;
  retroactive_cost: number;
  ip_address?: string;
  created_at: string;
}

// 任务记录
export interface TaskRecord {
  id: string;
  user_id: string;
  task_id: string;
  task_type: 'daily' | 'weekly' | 'monthly' | 'event' | 'achievement';
  task_title: string;
  progress: number;
  target: number;
  status: 'active' | 'completed' | 'expired';
  points_reward: number;
  completed_at?: string;
  expires_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 邀请记录
export interface InviteRecord {
  id: string;
  inviter_id: string;
  invitee_id?: string;
  invite_code: string;
  status: 'pending' | 'registered' | 'completed';
  inviter_points: number;
  invitee_points: number;
  bonus_points: number;
  registered_at?: string;
  completed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// 消费返积分记录
export interface ConsumptionRecord {
  id: string;
  user_id: string;
  order_id: string;
  order_amount: number;
  category: string;
  points: number;
  base_points: number;
  bonus_points: number;
  bonus_rate: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  confirmed_at?: string;
  cancelled_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// 积分兑换记录
export interface ExchangeRecord {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  points_cost: number;
  quantity: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  shipping_address?: Record<string, any>;
  tracking_number?: string;
  delivered_at?: string;
  refunded_at?: string;
  refund_points: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 积分抵扣记录
export interface DeductionRecord {
  id: string;
  user_id: string;
  order_id: string;
  original_amount: number;
  points_used: number;
  deduction_amount: number;
  final_amount: number;
  status: 'pending' | 'applied' | 'cancelled' | 'refunded';
  applied_at?: string;
  cancelled_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// 积分限制记录
export interface PointsLimit {
  id: string;
  user_id: string;
  source_type: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  limit_amount: number;
  used_amount: number;
  created_at: string;
  updated_at: string;
}

// 对账记录
export interface ReconciliationRecord {
  id: string;
  user_id: string;
  reconcile_date: string;
  expected_balance: number;
  actual_balance: number;
  difference: number;
  status: 'pending' | 'matched' | 'mismatch' | 'resolved';
  details: Record<string, any>;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    record_id?: string;
    expected_value?: number;
    actual_value?: number;
  }>;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
}

// 积分统计
export interface PointsStats {
  current_balance: number;
  total_earned: number;
  total_spent: number;
  today_earned: number;
  week_earned: number;
  month_earned: number;
  source_stats: Record<string, number>;
}

// 用户积分概览（视图）
export interface UserPointsOverview {
  user_id: string;
  current_balance: number;
  total_earned: number;
  total_spent: number;
  today_earned: number;
  today_spent: number;
  total_checkins: number;
  completed_tasks: number;
  completed_exchanges: number;
}

// 积分排行榜（视图）
export interface PointsLeaderboard {
  user_id: string;
  username: string;
  avatar_url: string;
  balance: number;
  total_earned: number;
  rank: number;
}

// RPC 函数返回类型
export interface UpdatePointsBalanceResult {
  success: boolean;
  new_balance?: number;
  record_id?: string;
  error_message?: string;
}

export interface CheckPointsLimitResult {
  can_add: boolean;
  remaining: number;
  limit_amount: number;
  used_amount: number;
}
