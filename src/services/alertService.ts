import { supabase } from '../lib/supabase';

// 预警规则类型
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric_type: MetricType;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  time_window: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  notify_channels: string[];
  notify_targets?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// 预警记录类型
export interface AlertRecord {
  id: string;
  rule_id: string;
  metric_type: MetricType;
  threshold: number;
  actual_value: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'ignored';
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolved_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  alert_rules?: {
    name: string;
    description?: string;
  };
}

// 预警统计类型
export interface AlertStats {
  total_alerts: number;
  active_alerts: number;
  acknowledged_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  active_count: number;
  avg_resolution_time?: string;
}

// 指标类型
export type MetricType =
  | 'users'
  | 'works'
  | 'views'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'active_users'
  | 'conversion_rate'
  | 'revenue'
  | 'server_cpu'
  | 'server_memory'
  | 'error_rate'
  | 'response_time';

// 指标名称映射
export const metricNames: Record<MetricType, string> = {
  users: '用户数',
  works: '作品数',
  views: '浏览量',
  likes: '点赞数',
  comments: '评论数',
  shares: '分享数',
  active_users: '活跃用户',
  conversion_rate: '转化率',
  revenue: '收入',
  server_cpu: '服务器CPU',
  server_memory: '服务器内存',
  error_rate: '错误率',
  response_time: '响应时间',
};

// 操作符名称映射
export const operatorNames: Record<string, string> = {
  gt: '大于',
  lt: '小于',
  eq: '等于',
  gte: '大于等于',
  lte: '小于等于',
};

// 严重程度名称映射
export const severityNames: Record<string, string> = {
  info: '信息',
  warning: '警告',
  error: '错误',
  critical: '严重',
};

// 严重程度颜色映射
export const severityColors: Record<string, string> = {
  info: 'blue',
  warning: 'yellow',
  error: 'orange',
  critical: 'red',
};

// 通知渠道名称映射
export const channelNames: Record<string, string> = {
  dashboard: '仪表盘',
  email: '邮件',
  sms: '短信',
  webhook: 'Webhook',
  push: '推送通知',
};

const API_BASE = '/api/admin/alerts';

/**
 * 获取预警规则列表
 */
export async function getAlertRules(): Promise<AlertRule[]> {
  const response = await fetch(`${API_BASE}/rules`, {
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('获取预警规则失败');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * 创建预警规则
 */
export async function createAlertRule(rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<AlertRule> {
  const response = await fetch(`${API_BASE}/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    throw new Error('创建预警规则失败');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 更新预警规则
 */
export async function updateAlertRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
  const response = await fetch(`${API_BASE}/rules/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    throw new Error('更新预警规则失败');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 删除预警规则
 */
export async function deleteAlertRule(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/rules/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('删除预警规则失败');
  }
}

/**
 * 获取预警记录列表
 */
export async function getAlertRecords(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<AlertRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const response = await fetch(`${API_BASE}/records?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('获取预警记录失败');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * 确认预警
 */
export async function acknowledgeAlert(recordId: string): Promise<AlertRecord> {
  const response = await fetch(`${API_BASE}/records/${recordId}/acknowledge`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('确认预警失败');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 解决预警
 */
export async function resolveAlert(recordId: string, reason?: string): Promise<AlertRecord> {
  const response = await fetch(`${API_BASE}/records/${recordId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error('解决预警失败');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 获取预警统计
 */
export async function getAlertStats(days: number = 7): Promise<AlertStats> {
  const response = await fetch(`${API_BASE}/stats?days=${days}`, {
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('获取预警统计失败');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 检查并触发预警
 */
export async function checkAlert(
  metricType: MetricType,
  actualValue: number,
  metadata?: Record<string, any>
): Promise<{ triggered: boolean; alerts: AlertRecord[] }> {
  const response = await fetch(`${API_BASE}/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      metric_type: metricType,
      actual_value: actualValue,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error('检查预警失败');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 订阅实时预警（使用 Supabase Realtime）
 */
export function subscribeToAlerts(callback: (alert: AlertRecord) => void) {
  // Realtime 功能已禁用 - 本地开发环境不支持 WebSocket
  // Realtime disabled - WebSocket not supported in local dev environment
  console.log('[AlertService] Realtime subscription skipped (not supported in local environment)');

  // 返回空函数作为取消订阅的占位符
  return () => {};
}

/**
 * 格式化时间差
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  return `${diffDays}天前`;
}
