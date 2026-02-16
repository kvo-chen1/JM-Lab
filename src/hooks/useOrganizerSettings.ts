import { useState, useEffect, useCallback, useContext } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { brandPartnershipService } from '@/services/brandPartnershipService';
import {
  organizerSettingsService,
  OrganizerSettings,
  BrandInfo,
  SecuritySettings,
  NotificationSettings,
  PermissionSettings,
  DataManagementSettings,
  OrganizerMember,
  OrganizerRole,
} from '@/services/organizerSettingsService';

interface UseOrganizerSettingsReturn {
  settings: OrganizerSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  error: string | null;
  verifiedBrand: { id: string; brand_name: string } | null;
  
  // 操作方法
  updateBrandInfo: (brandInfo: Partial<BrandInfo>) => Promise<boolean>;
  updateSecuritySettings: (security: Partial<SecuritySettings>) => Promise<boolean>;
  updateNotificationSettings: (notifications: Partial<NotificationSettings>) => Promise<boolean>;
  addMember: (member: { email: string; name: string; role: Exclude<OrganizerRole, 'owner'> }) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: OrganizerRole) => Promise<boolean>;
  updateDataManagementSettings: (dataManagement: Partial<DataManagementSettings>) => Promise<boolean>;
  createBackup: () => Promise<boolean>;
  exportData: (type: 'events' | 'works' | 'participants', format: 'csv' | 'excel' | 'json') => Promise<string | null>;
  
  // 工具方法
  refreshSettings: () => Promise<void>;
  clearCache: () => void;
}

export function useOrganizerSettings(): UseOrganizerSettingsReturn {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState<OrganizerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedBrand, setVerifiedBrand] = useState<{ id: string; brand_name: string } | null>(null);

  // 加载设置数据
  const loadSettings = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 获取品牌信息
      const partnerships = await brandPartnershipService.getMyPartnerships({
        id: user.id,
        email: user.email,
      });
      
      const approvedBrand = partnerships.find(p => p.status === 'approved');
      
      if (!approvedBrand) {
        setError('未找到已认证的品牌');
        setIsLoading(false);
        return;
      }

      setVerifiedBrand({
        id: approvedBrand.id,
        brand_name: approvedBrand.brand_name,
      });

      // 获取设置
      const organizerSettings = await organizerSettingsService.getSettings(approvedBrand.id);
      setSettings(organizerSettings);
    } catch (err) {
      console.error('加载设置失败:', err);
      setError('加载设置失败，请稍后重试');
      toast.error('加载设置失败');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 初始加载
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 更新品牌信息
  const updateBrandInfo = useCallback(async (brandInfo: Partial<BrandInfo>): Promise<boolean> => {
    if (!verifiedBrand) return false;

    setIsSaving(true);
    try {
      await organizerSettingsService.updateBrandInfo(verifiedBrand.id, brandInfo);
      
      // 更新本地状态
      setSettings(prev => prev ? {
        ...prev,
        brandInfo: { ...prev.brandInfo, ...brandInfo },
        updatedAt: new Date().toISOString(),
      } : null);
      
      setHasChanges(true);
      toast.success('品牌信息已更新');
      return true;
    } catch (err) {
      console.error('更新品牌信息失败:', err);
      toast.error('更新失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [verifiedBrand]);

  // 更新安全设置
  const updateSecuritySettings = useCallback(async (security: Partial<SecuritySettings>): Promise<boolean> => {
    if (!verifiedBrand) return false;

    setIsSaving(true);
    try {
      await organizerSettingsService.updateSecuritySettings(verifiedBrand.id, security);
      
      setSettings(prev => prev ? {
        ...prev,
        security: { ...prev.security, ...security },
        updatedAt: new Date().toISOString(),
      } : null);
      
      setHasChanges(true);
      toast.success('安全设置已更新');
      return true;
    } catch (err) {
      console.error('更新安全设置失败:', err);
      toast.error('更新失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [verifiedBrand]);

  // 更新通知设置
  const updateNotificationSettings = useCallback(async (notifications: Partial<NotificationSettings>): Promise<boolean> => {
    if (!verifiedBrand) return false;

    setIsSaving(true);
    try {
      await organizerSettingsService.updateNotificationSettings(verifiedBrand.id, notifications);
      
      setSettings(prev => prev ? {
        ...prev,
        notifications: { ...prev.notifications, ...notifications },
        updatedAt: new Date().toISOString(),
      } : null);
      
      setHasChanges(true);
      toast.success('通知设置已更新');
      return true;
    } catch (err) {
      console.error('更新通知设置失败:', err);
      toast.error('更新失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [verifiedBrand]);

  // 添加成员
  const addMember = useCallback(async (member: { email: string; name: string; role: Exclude<OrganizerRole, 'owner'> }): Promise<boolean> => {
    if (!verifiedBrand) return false;

    setIsSaving(true);
    try {
      await organizerSettingsService.addMember(verifiedBrand.id, {
        ...member,
        permissions: [],
      });
      
      // 重新加载设置以获取最新成员列表
      await loadSettings();
      
      toast.success('邀请已发送');
      return true;
    } catch (err) {
      console.error('添加成员失败:', err);
      toast.error(err instanceof Error ? err.message : '添加失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [verifiedBrand, loadSettings]);

  // 移除成员
  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    if (!verifiedBrand) return false;

    setIsSaving(true);
    try {
      await organizerSettingsService.removeMember(verifiedBrand.id, memberId);
      
      // 重新加载设置
      await loadSettings();
      
      toast.success('成员已移除');
      return true;
    } catch (err) {
      console.error('移除成员失败:', err);
      toast.error('移除失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [verifiedBrand, loadSettings]);

  // 更新成员角色
  const updateMemberRole = useCallback(async (memberId: string, role: OrganizerRole): Promise<boolean> => {
    if (!verifiedBrand) return false;

    setIsSaving(true);
    try {
      await organizerSettingsService.updateMemberRole(verifiedBrand.id, memberId, role);
      
      // 重新加载设置
      await loadSettings();
      
      toast.success('角色已更新');
      return true;
    } catch (err) {
      console.error('更新角色失败:', err);
      toast.error('更新失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [verifiedBrand, loadSettings]);

  // 更新数据管理设置
  const updateDataManagementSettings = useCallback(async (dataManagement: Partial<DataManagementSettings>): Promise<boolean> => {
    if (!verifiedBrand || !settings) return false;

    setIsSaving(true);
    try {
      // 更新本地状态（数据管理设置通过其他API更新）
      setSettings(prev => prev ? {
        ...prev,
        dataManagement: { ...prev.dataManagement, ...dataManagement },
        updatedAt: new Date().toISOString(),
      } : null);
      
      setHasChanges(true);
      toast.success('数据管理设置已更新');
      return true;
    } catch (err) {
      console.error('更新数据管理设置失败:', err);
      toast.error('更新失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [verifiedBrand, settings]);

  // 创建备份
  const createBackup = useCallback(async (): Promise<boolean> => {
    if (!verifiedBrand) return false;

    setIsSaving(true);
    try {
      await organizerSettingsService.createBackup(verifiedBrand.id);
      toast.success('备份创建成功');
      return true;
    } catch (err) {
      console.error('创建备份失败:', err);
      toast.error('备份失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [verifiedBrand]);

  // 导出数据
  const exportData = useCallback(async (
    type: 'events' | 'works' | 'participants',
    format: 'csv' | 'excel' | 'json'
  ): Promise<string | null> => {
    if (!verifiedBrand) return null;

    setIsSaving(true);
    try {
      const downloadUrl = await organizerSettingsService.exportData(verifiedBrand.id, type, format);
      toast.success('数据导出成功');
      return downloadUrl;
    } catch (err) {
      console.error('导出数据失败:', err);
      toast.error('导出失败');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [verifiedBrand]);

  // 刷新设置
  const refreshSettings = useCallback(async (): Promise<void> => {
    await loadSettings();
    setHasChanges(false);
  }, [loadSettings]);

  // 清除缓存
  const clearCache = useCallback((): void => {
    if (verifiedBrand) {
      organizerSettingsService.clearCache(verifiedBrand.id);
    }
  }, [verifiedBrand]);

  return {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    error,
    verifiedBrand,
    updateBrandInfo,
    updateSecuritySettings,
    updateNotificationSettings,
    addMember,
    removeMember,
    updateMemberRole,
    updateDataManagementSettings,
    createBackup,
    exportData,
    refreshSettings,
    clearCache,
  };
}
