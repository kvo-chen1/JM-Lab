import { supabaseAdmin } from '@/lib/supabase';

export interface SecurityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SecurityConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxFilesPerSubmission: number;
  dailySubmissionLimit: number;
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
}

const DEFAULT_CONFIG: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
  maxFilesPerSubmission: 10,
  dailySubmissionLimit: 10,
  rateLimitWindow: 60 * 1000, // 1分钟
  rateLimitMaxRequests: 10
};

class SecurityService {
  private config: SecurityConfig = DEFAULT_CONFIG;

  /**
   * 初始化安全配置
   */
  init(config: Partial<SecurityConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 验证文件
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // 检查文件大小
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `文件大小超过限制（最大 ${this.config.maxFileSize / 1024 / 1024}MB）`
      };
    }

    // 检查文件类型
    if (!this.config.allowedFileTypes.includes(file.type)) {
      return {
        valid: false,
        error: `不支持的文件类型：${file.type}`
      };
    }

    return { valid: true };
  }

  /**
   * 验证文件列表
   */
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查文件数量
    if (files.length > this.config.maxFilesPerSubmission) {
      errors.push(`文件数量超过限制（最多 ${this.config.maxFilesPerSubmission} 个）`);
    }

    // 验证每个文件
    for (const file of files) {
      const result = this.validateFile(file);
      if (!result.valid && result.error) {
        errors.push(result.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 计算文件哈希
   */
  async calculateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 记录安全日志
   */
  async logSecurityEvent(params: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await supabaseAdmin
        .from('security_logs')
        .insert({
          user_id: params.userId || 'anonymous',
          action: params.action,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
          details: params.details || {},
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
          created_at: Date.now()
        });
    } catch (error) {
      console.error('记录安全日志失败:', error);
    }
  }

  /**
   * 检查速率限制
   */
  async checkRateLimit(userId: string, action: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    try {
      const windowStart = Date.now() - this.config.rateLimitWindow;

      // 查询最近的操作
      const { data, error } = await supabaseAdmin
        .from('security_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('action', action)
        .gte('created_at', windowStart);

      if (error) throw error;

      const requestCount = (data || []).length;
      const remaining = Math.max(0, this.config.rateLimitMaxRequests - requestCount);
      const resetAt = new Date(Date.now() + this.config.rateLimitWindow);

      return {
        allowed: requestCount < this.config.rateLimitMaxRequests,
        remaining,
        resetAt
      };
    } catch (error) {
      console.error('检查速率限制失败:', error);
      // 出错时允许操作
      return {
        allowed: true,
        remaining: this.config.rateLimitMaxRequests,
        resetAt: new Date(Date.now() + this.config.rateLimitWindow)
      };
    }
  }

  /**
   * 检测可疑IP
   */
  async checkSuspiciousIP(ipAddress: string): Promise<boolean> {
    try {
      // 查询IP是否在黑名单中
      const { data } = await supabaseAdmin
        .from('ip_blacklist')
        .select('id')
        .eq('ip_address', ipAddress)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('检查IP信誉失败:', error);
      return false;
    }
  }

  /**
   * 获取操作历史
   */
  async getSecurityLogs(params: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<SecurityLog[]> {
    try {
      let query = supabaseAdmin
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (params.userId) {
        query = query.eq('user_id', params.userId);
      }
      if (params.action) {
        query = query.eq('action', params.action);
      }
      if (params.resourceType) {
        query = query.eq('resource_type', params.resourceType);
      }
      if (params.startDate) {
        query = query.gte('created_at', params.startDate.getTime());
      }
      if (params.endDate) {
        query = query.lte('created_at', params.endDate.getTime());
      }
      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.formatLog);
    } catch (error) {
      console.error('获取安全日志失败:', error);
      return [];
    }
  }

  /**
   * 格式化日志
   */
  private formatLog(data: any): SecurityLog {
    return {
      id: data.id,
      user_id: data.user_id,
      action: data.action,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      details: data.details,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      created_at: data.created_at
    };
  }
}

export const securityService = new SecurityService();
