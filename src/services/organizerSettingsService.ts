import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// ============== 类型定义 ==============

export interface OrganizerSettings {
  id: string;
  organizerId: string;
  brandInfo: BrandInfo;
  security: SecuritySettings;
  notifications: NotificationSettings;
  permissions: PermissionSettings;
  dataManagement: DataManagementSettings;
  createdAt: string;
  updatedAt: string;
}

export interface BrandInfo {
  name: string;
  logo: string;
  description: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
  address?: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotification: boolean;
  passwordLastChanged: string;
  allowedLoginMethods: ('password' | 'email' | 'phone')[];
  sessionTimeout: number; // 分钟
}

export interface NotificationSettings {
  email: EmailNotificationSettings;
  inApp: InAppNotificationSettings;
  sms: SmsNotificationSettings;
}

export interface EmailNotificationSettings {
  newSubmission: boolean;
  statusChange: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  marketingUpdates: boolean;
  securityAlerts: boolean;
}

export interface InAppNotificationSettings {
  newSubmission: boolean;
  comment: boolean;
  like: boolean;
  follow: boolean;
  system: boolean;
  message: boolean;
}

export interface SmsNotificationSettings {
  securityAlerts: boolean;
  importantUpdates: boolean;
  enabled: boolean;
}

export interface PermissionSettings {
  members: OrganizerMember[];
  defaultRole: OrganizerRole;
  allowMemberInvite: boolean;
  requireApprovalForEvents: boolean;
}

export interface OrganizerMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: OrganizerRole;
  joinedAt: string;
  lastActiveAt?: string;
  permissions: string[];
}

export type OrganizerRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface DataManagementSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetentionDays: number;
  lastBackupAt?: string;
  exportFormat: 'csv' | 'excel' | 'json';
}

export interface BackupRecord {
  id: string;
  organizerId: string;
  type: 'manual' | 'auto';
  size: number;
  createdAt: string;
  downloadUrl?: string;
  expiresAt: string;
}

// ============== 验证 Schema ==============

export const brandInfoSchema = z.object({
  name: z.string().min(2, '品牌名称至少需要2个字符').max(50, '品牌名称不能超过50个字符'),
  logo: z.string().url('请输入有效的Logo URL').optional().or(z.literal('')),
  description: z.string().max(500, '描述不能超过500个字符').optional(),
  contactName: z.string().min(2, '联系人姓名至少需要2个字符').max(20, '联系人姓名不能超过20个字符'),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的11位手机号码'),
  contactEmail: z.string().email('请输入有效的邮箱地址'),
  website: z.string().url('请输入有效的网站URL').optional().or(z.literal('')),
  address: z.string().max(200, '地址不能超过200个字符').optional(),
});

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  loginNotification: z.boolean(),
  allowedLoginMethods: z.array(z.enum(['password', 'email', 'phone'])).min(1, '至少选择一种登录方式'),
  sessionTimeout: z.number().min(5, '会话超时时间至少5分钟').max(1440, '会话超时时间不能超过24小时'),
});

export const notificationSettingsSchema = z.object({
  email: z.object({
    newSubmission: z.boolean(),
    statusChange: z.boolean(),
    dailyDigest: z.boolean(),
    weeklyReport: z.boolean(),
    marketingUpdates: z.boolean(),
    securityAlerts: z.boolean(),
  }),
  inApp: z.object({
    newSubmission: z.boolean(),
    comment: z.boolean(),
    like: z.boolean(),
    follow: z.boolean(),
    system: z.boolean(),
    message: z.boolean(),
  }),
  sms: z.object({
    enabled: z.boolean(),
    securityAlerts: z.boolean(),
    importantUpdates: z.boolean(),
  }),
});

export const memberSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  name: z.string().min(2, '姓名至少需要2个字符').max(20, '姓名不能超过20个字符'),
  role: z.enum(['admin', 'editor', 'viewer']),
  permissions: z.array(z.string()),
});

// ============== 服务类 ==============

class OrganizerSettingsService {
  private cacheKey = 'organizer_settings_cache';
  private cacheExpiry = 5 * 60 * 1000; // 5分钟

  // 获取设置（带缓存）
  async getSettings(organizerId: string): Promise<OrganizerSettings | null> {
    try {
      // 先检查缓存
      const cached = this.getCachedSettings(organizerId);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('organizer_settings')
        .select('*')
        .eq('organizer_id', organizerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 记录不存在，创建默认设置
          return this.createDefaultSettings(organizerId);
        }
        throw error;
      }

      const settings = this.transformFromDb(data);
      this.cacheSettings(organizerId, settings);
      return settings;
    } catch (error) {
      console.error('获取主办方设置失败:', error);
      // 返回本地默认设置作为回退
      return this.getDefaultSettings(organizerId);
    }
  }

  // 更新品牌信息
  async updateBrandInfo(organizerId: string, brandInfo: Partial<BrandInfo>): Promise<boolean> {
    try {
      const validation = brandInfoSchema.partial().safeParse(brandInfo);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error } = await supabase
        .from('organizer_settings')
        .update({
          brand_info: brandInfo,
          updated_at: new Date().toISOString(),
        })
        .eq('organizer_id', organizerId);

      if (error) throw error;

      // 更新缓存
      const current = await this.getSettings(organizerId);
      if (current) {
        this.cacheSettings(organizerId, {
          ...current,
          brandInfo: { ...current.brandInfo, ...brandInfo },
          updatedAt: new Date().toISOString(),
        });
      }

      return true;
    } catch (error) {
      console.error('更新品牌信息失败:', error);
      throw error;
    }
  }

  // 更新安全设置
  async updateSecuritySettings(
    organizerId: string,
    security: Partial<SecuritySettings>
  ): Promise<boolean> {
    try {
      const validation = securitySettingsSchema.partial().safeParse(security);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error } = await supabase
        .from('organizer_settings')
        .update({
          security_settings: security,
          updated_at: new Date().toISOString(),
        })
        .eq('organizer_id', organizerId);

      if (error) throw error;

      // 更新缓存
      const current = await this.getSettings(organizerId);
      if (current) {
        this.cacheSettings(organizerId, {
          ...current,
          security: { ...current.security, ...security },
          updatedAt: new Date().toISOString(),
        });
      }

      return true;
    } catch (error) {
      console.error('更新安全设置失败:', error);
      throw error;
    }
  }

  // 更新通知设置
  async updateNotificationSettings(
    organizerId: string,
    notifications: Partial<NotificationSettings>
  ): Promise<boolean> {
    try {
      const validation = notificationSettingsSchema.partial().safeParse(notifications);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error } = await supabase
        .from('organizer_settings')
        .update({
          notification_settings: notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('organizer_id', organizerId);

      if (error) throw error;

      // 更新缓存
      const current = await this.getSettings(organizerId);
      if (current) {
        this.cacheSettings(organizerId, {
          ...current,
          notifications: { ...current.notifications, ...notifications },
          updatedAt: new Date().toISOString(),
        });
      }

      return true;
    } catch (error) {
      console.error('更新通知设置失败:', error);
      throw error;
    }
  }

  // 添加团队成员
  async addMember(organizerId: string, memberData: z.infer<typeof memberSchema>): Promise<OrganizerMember> {
    try {
      const validation = memberSchema.safeParse(memberData);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      // 检查用户是否已存在
      const settings = await this.getSettings(organizerId);
      if (settings?.permissions.members.some(m => m.email === memberData.email)) {
        throw new Error('该用户已经是团队成员');
      }

      const newMember: OrganizerMember = {
        id: crypto.randomUUID(),
        userId: '', // 待用户首次登录后关联
        email: memberData.email,
        name: memberData.name,
        role: memberData.role,
        permissions: memberData.permissions,
        joinedAt: new Date().toISOString(),
      };

      const updatedMembers = [...(settings?.permissions.members || []), newMember];

      const { error } = await supabase
        .from('organizer_settings')
        .update({
          permission_settings: {
            ...settings?.permissions,
            members: updatedMembers,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('organizer_id', organizerId);

      if (error) throw error;

      // 发送邀请邮件
      await this.sendMemberInvite(organizerId, newMember);

      // 更新缓存
      if (settings) {
        this.cacheSettings(organizerId, {
          ...settings,
          permissions: {
            ...settings.permissions,
            members: updatedMembers,
          },
          updatedAt: new Date().toISOString(),
        });
      }

      return newMember;
    } catch (error) {
      console.error('添加团队成员失败:', error);
      throw error;
    }
  }

  // 移除团队成员
  async removeMember(organizerId: string, memberId: string): Promise<boolean> {
    try {
      const settings = await this.getSettings(organizerId);
      if (!settings) throw new Error('设置不存在');

      const updatedMembers = settings.permissions.members.filter(m => m.id !== memberId);

      const { error } = await supabase
        .from('organizer_settings')
        .update({
          permission_settings: {
            ...settings.permissions,
            members: updatedMembers,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('organizer_id', organizerId);

      if (error) throw error;

      // 更新缓存
      this.cacheSettings(organizerId, {
        ...settings,
        permissions: {
          ...settings.permissions,
          members: updatedMembers,
        },
        updatedAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('移除团队成员失败:', error);
      throw error;
    }
  }

  // 更新成员角色
  async updateMemberRole(
    organizerId: string,
    memberId: string,
    role: OrganizerRole
  ): Promise<boolean> {
    try {
      const settings = await this.getSettings(organizerId);
      if (!settings) throw new Error('设置不存在');

      const updatedMembers = settings.permissions.members.map(m =>
        m.id === memberId ? { ...m, role } : m
      );

      const { error } = await supabase
        .from('organizer_settings')
        .update({
          permission_settings: {
            ...settings.permissions,
            members: updatedMembers,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('organizer_id', organizerId);

      if (error) throw error;

      // 更新缓存
      this.cacheSettings(organizerId, {
        ...settings,
        permissions: {
          ...settings.permissions,
          members: updatedMembers,
        },
        updatedAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('更新成员角色失败:', error);
      throw error;
    }
  }

  // 创建数据备份
  async createBackup(organizerId: string): Promise<BackupRecord> {
    try {
      // 调用RPC函数创建备份
      const { data, error } = await supabase.rpc('create_organizer_backup', {
        p_organizer_id: organizerId,
      });

      if (error) throw error;

      return {
        id: data.id,
        organizerId,
        type: 'manual',
        size: data.size,
        createdAt: data.created_at,
        downloadUrl: data.download_url,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      console.error('创建备份失败:', error);
      throw error;
    }
  }

  // 获取备份历史
  async getBackupHistory(organizerId: string): Promise<BackupRecord[]> {
    try {
      const { data, error } = await supabase
        .from('organizer_backups')
        .select('*')
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        organizerId: item.organizer_id,
        type: item.type,
        size: item.size,
        createdAt: item.created_at,
        downloadUrl: item.download_url,
        expiresAt: item.expires_at,
      }));
    } catch (error) {
      console.error('获取备份历史失败:', error);
      return [];
    }
  }

  // 导出数据
  async exportData(
    organizerId: string,
    type: 'events' | 'works' | 'participants',
    format: 'csv' | 'excel' | 'json'
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('export_organizer_data', {
        p_organizer_id: organizerId,
        p_type: type,
        p_format: format,
      });

      if (error) throw error;

      return data.download_url;
    } catch (error) {
      console.error('导出数据失败:', error);
      throw error;
    }
  }

  // 清除缓存
  clearCache(organizerId?: string): void {
    if (organizerId) {
      localStorage.removeItem(`${this.cacheKey}_${organizerId}`);
    } else {
      // 清除所有缓存
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.cacheKey))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  // ============== 私有方法 ==============

  private getCachedSettings(organizerId: string): OrganizerSettings | null {
    try {
      const cached = localStorage.getItem(`${this.cacheKey}_${organizerId}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.cacheExpiry) {
        localStorage.removeItem(`${this.cacheKey}_${organizerId}`);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private cacheSettings(organizerId: string, settings: OrganizerSettings): void {
    try {
      localStorage.setItem(
        `${this.cacheKey}_${organizerId}`,
        JSON.stringify({
          data: settings,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn('缓存设置失败:', error);
    }
  }

  private async createDefaultSettings(organizerId: string): Promise<OrganizerSettings> {
    const defaultSettings = this.getDefaultSettings(organizerId);

    try {
      const { error } = await supabase.from('organizer_settings').insert({
        organizer_id: organizerId,
        brand_info: defaultSettings.brandInfo,
        security_settings: defaultSettings.security,
        notification_settings: defaultSettings.notifications,
        permission_settings: defaultSettings.permissions,
        data_management_settings: defaultSettings.dataManagement,
        created_at: defaultSettings.createdAt,
        updated_at: defaultSettings.updatedAt,
      });

      if (error) throw error;

      this.cacheSettings(organizerId, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('创建默认设置失败:', error);
      return defaultSettings;
    }
  }

  private getDefaultSettings(organizerId: string): OrganizerSettings {
    return {
      id: crypto.randomUUID(),
      organizerId,
      brandInfo: {
        name: '',
        logo: '',
        description: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
      },
      security: {
        twoFactorEnabled: false,
        loginNotification: true,
        passwordLastChanged: new Date().toISOString(),
        allowedLoginMethods: ['password', 'email'],
        sessionTimeout: 30,
      },
      notifications: {
        email: {
          newSubmission: true,
          statusChange: true,
          dailyDigest: false,
          weeklyReport: true,
          marketingUpdates: false,
          securityAlerts: true,
        },
        inApp: {
          newSubmission: true,
          comment: true,
          like: false,
          follow: false,
          system: true,
          message: true,
        },
        sms: {
          enabled: false,
          securityAlerts: true,
          importantUpdates: false,
        },
      },
      permissions: {
        members: [],
        defaultRole: 'editor',
        allowMemberInvite: true,
        requireApprovalForEvents: true,
      },
      dataManagement: {
        autoBackup: true,
        backupFrequency: 'weekly',
        backupRetentionDays: 30,
        exportFormat: 'excel',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private transformFromDb(data: any): OrganizerSettings {
    return {
      id: data.id,
      organizerId: data.organizer_id,
      brandInfo: data.brand_info || {},
      security: data.security_settings || {},
      notifications: data.notification_settings || {},
      permissions: data.permission_settings || {},
      dataManagement: data.data_management_settings || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private async sendMemberInvite(organizerId: string, member: OrganizerMember): Promise<void> {
    // 实际项目中这里会调用邮件服务
    console.log(`发送邀请邮件给: ${member.email}`);
  }
}

export const organizerSettingsService = new OrganizerSettingsService();
