import { supabaseAdmin } from '@/lib/supabaseClient';
import { apiClient } from '@/lib/apiClient';
import eventBus from '@/lib/eventBus';
import { toast } from 'sonner';
import {
  CertificationApplication,
  CertificationStatus,
  CertificationAuditLog,
  CertificationStats,
} from '@/types/certification';

export interface AdminApplicationFilter {
  status?: CertificationStatus;
  level?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminReviewParams {
  applicationId: string;
  action: 'approve' | 'reject';
  reviewNote?: string;
  rejectReason?: string;
}

class CertificationAdminService {
  async getApplications(
    filter: AdminApplicationFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ applications: CertificationApplication[]; total: number }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filter.status && { status: filter.status }),
        ...(filter.level && { level: filter.level }),
        ...(filter.type && { type: filter.type }),
        ...(filter.search && { search: filter.search }),
        ...(filter.dateFrom && { dateFrom: filter.dateFrom }),
        ...(filter.dateTo && { dateTo: filter.dateTo }),
      });

      const response = await apiClient.get(`/api/admin/certification/applications?${params}`);

      if (response.ok && response.data?.code === 0) {
        return {
          applications: response.data.data.applications || [],
          total: response.data.data.total || 0,
        };
      }

      return { applications: [], total: 0 };
    } catch (error) {
      console.error('[CertificationAdminService] 获取申请列表失败:', error);
      return { applications: [], total: 0 };
    }
  }

  async getApplicationById(applicationId: string): Promise<CertificationApplication | null> {
    try {
      const response = await apiClient.get(`/api/admin/certification/applications/${applicationId}`);

      if (response.ok && response.data?.code === 0) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('[CertificationAdminService] 获取申请详情失败:', error);
      return null;
    }
  }

  async reviewApplication(params: AdminReviewParams): Promise<{
    success: boolean;
    application?: CertificationApplication;
    error?: string;
  }> {
    try {
      const response = await apiClient.post(
        `/api/admin/certification/applications/${params.applicationId}/review`,
        {
          action: params.action,
          reviewNote: params.reviewNote,
          rejectReason: params.rejectReason,
        }
      );

      if (response.ok && response.data?.code === 0) {
        const application = response.data.data as CertificationApplication;

        eventBus.emit('certification:reviewed', { application, action: params.action });

        toast.success(params.action === 'approve' ? '已通过认证申请' : '已拒绝认证申请');

        return { success: true, application };
      }

      const error = response.data?.message || '审核失败';
      toast.error(error);
      return { success: false, error };
    } catch (error: any) {
      console.error('[CertificationAdminService] 审核申请失败:', error);
      toast.error(error.message || '审核失败');
      return { success: false, error: error.message || '审核失败' };
    }
  }

  async batchReview(
    applicationIds: string[],
    action: 'approve' | 'reject',
    reviewNote?: string,
    rejectReason?: string
  ): Promise<{ success: number; failed: number }> {
    try {
      const response = await apiClient.post('/api/admin/certification/batch-review', {
        applicationIds,
        action,
        reviewNote,
        rejectReason,
      });

      if (response.ok && response.data?.code === 0) {
        const result = response.data.data;
        toast.success(`批量审核完成：成功${result.success}个，失败${result.failed}个`);
        return result;
      }

      return { success: 0, failed: applicationIds.length };
    } catch (error: any) {
      console.error('[CertificationAdminService] 批量审核失败:', error);
      toast.error('批量审核失败');
      return { success: 0, failed: applicationIds.length };
    }
  }

  async revokeCertification(
    userId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post(`/api/admin/certification/revoke`, {
        userId,
        reason,
      });

      if (response.ok && response.data?.code === 0) {
        toast.success('已撤销用户认证');
        eventBus.emit('certification:revoked', { userId, reason });
        return { success: true };
      }

      const error = response.data?.message || '撤销失败';
      toast.error(error);
      return { success: false, error };
    } catch (error: any) {
      console.error('[CertificationAdminService] 撤销认证失败:', error);
      toast.error(error.message || '撤销失败');
      return { success: false, error: error.message || '撤销失败' };
    }
  }

  async getAuditLogs(
    applicationId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ logs: CertificationAuditLog[]; total: number }> {
    try {
      const response = await apiClient.get(
        `/api/admin/certification/applications/${applicationId}/logs?page=${page}&limit=${limit}`
      );

      if (response.ok && response.data?.code === 0) {
        return {
          logs: response.data.data.logs || [],
          total: response.data.data.total || 0,
        };
      }

      return { logs: [], total: 0 };
    } catch (error) {
      console.error('[CertificationAdminService] 获取审核日志失败:', error);
      return { logs: [], total: 0 };
    }
  }

  async getStats(): Promise<CertificationStats> {
    try {
      const response = await apiClient.get('/api/admin/certification/stats');

      if (response.ok && response.data?.code === 0) {
        return response.data.data;
      }

      return this.getDefaultStats();
    } catch (error) {
      console.error('[CertificationAdminService] 获取统计失败:', error);
      return this.getDefaultStats();
    }
  }

  async exportApplications(filter: AdminApplicationFilter = {}): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        ...(filter.status && { status: filter.status }),
        ...(filter.level && { level: filter.level }),
        ...(filter.type && { type: filter.type }),
        ...(filter.dateFrom && { dateFrom: filter.dateFrom }),
        ...(filter.dateTo && { dateTo: filter.dateTo }),
      });

      const response = await apiClient.get(
        `/api/admin/certification/export?${params}`,
        { responseType: 'blob' }
      );

      if (response.ok) {
        const url = window.URL.createObjectURL(response.data as any);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certification-applications-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        return url;
      }

      return null;
    } catch (error) {
      console.error('[CertificationAdminService] 导出失败:', error);
      toast.error('导出失败');
      return null;
    }
  }

  async updateApplicationNote(
    applicationId: string,
    note: string
  ): Promise<boolean> {
    try {
      const response = await apiClient.put(
        `/api/admin/certification/applications/${applicationId}/note`,
        { note }
      );

      return response.ok && response.data?.code === 0;
    } catch (error) {
      console.error('[CertificationAdminService] 更新备注失败:', error);
      return false;
    }
  }

  async getPendingCount(): Promise<number> {
    try {
      const response = await apiClient.get('/api/admin/certification/pending-count');

      if (response.ok && response.data?.code === 0) {
        return response.data.data.count || 0;
      }

      return 0;
    } catch (error) {
      console.error('[CertificationAdminService] 获取待审核数量失败:', error);
      return 0;
    }
  }

  private getDefaultStats(): CertificationStats {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byLevel: { normal: 0, verified: 0, signed: 0 },
      byType: { individual: 0, organization: 0, media: 0, brand: 0 },
      recentApplications: 0,
      approvalRate: 0,
    };
  }
}

export const certificationAdminService = new CertificationAdminService();
export default certificationAdminService;
