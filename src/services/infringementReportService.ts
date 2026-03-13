/**
 * 侵权举报服务
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import type {
  InfringementReport,
  Evidence,
  CreateInfringementReportDTO,
  AddEvidenceDTO,
  UpdateReportStatusDTO,
  InfringementReportStats,
  ReportTimelineEntry
} from '@/types/infringement-report';

const getCurrentUserInfo = (): { id: string; name: string; email?: string } | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id || user.userId,
        name: user.username || user.name || '匿名用户',
        email: user.email
      };
    }
  } catch (e) {
    console.error('获取用户信息失败:', e);
  }
  return null;
};

class InfringementReportService {
  async createReport(dto: CreateInfringementReportDTO): Promise<InfringementReport> {
    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
      throw new Error('请先登录');
    }

    const now = new Date().toISOString();
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const report: InfringementReport = {
      id: reportId,
      reporterId: userInfo.id,
      reporterName: userInfo.name,
      reporterEmail: dto.reporterEmail || userInfo.email,
      reporterPhone: dto.reporterPhone,
      
      targetType: dto.targetType,
      targetId: dto.targetId,
      targetTitle: dto.targetTitle,
      targetUrl: dto.targetUrl,
      targetThumbnail: dto.targetThumbnail,
      targetCreatorId: dto.targetCreatorId,
      targetCreatorName: dto.targetCreatorName,
      
      infringementType: dto.infringementType,
      priority: dto.priority || 'normal',
      status: 'submitted',
      
      title: dto.title,
      description: dto.description,
      originalWorkUrl: dto.originalWorkUrl,
      originalWorkTitle: dto.originalWorkTitle,
      originalCreationDate: dto.originalCreationDate,
      
      evidence: [],
      
      submittedAt: now,
      updatedAt: now,
      
      timeline: [{
        id: `timeline-${Date.now()}`,
        reportId,
        action: 'report_submitted',
        description: '举报已提交',
        actorId: userInfo.id,
        actorName: userInfo.name,
        actorRole: 'reporter',
        createdAt: now
      }]
    };

    try {
      const { error } = await supabaseAdmin
        .from('infringement_reports')
        .insert(report);

      if (error) {
        console.warn('保存举报到数据库失败:', error);
      }
    } catch (e) {
      console.warn('数据库操作失败:', e);
    }

    const localReports = JSON.parse(localStorage.getItem('infringement_reports') || '[]');
    localReports.push(report);
    localStorage.setItem('infringement_reports', JSON.stringify(localReports));

    return report;
  }

  async addEvidence(dto: AddEvidenceDTO): Promise<Evidence> {
    const report = await this.getReportById(dto.reportId);
    if (!report) {
      throw new Error('举报不存在');
    }

    const userInfo = getCurrentUserInfo();
    if (userInfo?.id !== report.reporterId) {
      throw new Error('无权添加证据');
    }

    const now = new Date().toISOString();
    const evidence: Evidence = {
      id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportId: dto.reportId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      externalUrl: dto.externalUrl,
      uploadedAt: now,
      verified: false
    };

    report.evidence.push(evidence);
    report.timeline.push({
      id: `timeline-${Date.now()}`,
      reportId: dto.reportId,
      action: 'evidence_added',
      description: `添加了证据: ${dto.title}`,
      actorId: userInfo.id,
      actorName: userInfo.name,
      actorRole: 'reporter',
      createdAt: now
    });
    report.updatedAt = now;

    await this.updateReport(report);

    return evidence;
  }

  async updateStatus(
    reportId: string,
    dto: UpdateReportStatusDTO,
    adminInfo?: { id: string; name: string }
  ): Promise<InfringementReport> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('举报不存在');
    }

    const now = new Date().toISOString();
    
    report.status = dto.status;
    report.updatedAt = now;

    if (dto.adminResponse) {
      report.adminResponse = dto.adminResponse;
    }

    if (dto.resolution) {
      report.resolution = dto.resolution;
      report.resolutionType = dto.resolutionType;
      report.resolvedAt = now;
    }

    if (adminInfo) {
      report.adminId = adminInfo.id;
      report.adminName = adminInfo.name;
      report.reviewedAt = now;
    }

    const actionMap: Record<string, string> = {
      submitted: '举报已提交',
      under_review: '开始审核',
      evidence_requested: '请求补充证据',
      pending_response: '等待被举报方回应',
      resolved: '举报已解决',
      rejected: '举报已驳回',
      withdrawn: '举报已撤回'
    };

    report.timeline.push({
      id: `timeline-${Date.now()}`,
      reportId,
      action: `status_changed_to_${dto.status}`,
      description: actionMap[dto.status] || `状态更新为: ${dto.status}`,
      actorId: adminInfo?.id,
      actorName: adminInfo?.name || '系统',
      actorRole: adminInfo ? 'admin' : 'system',
      createdAt: now
    });

    return this.updateReport(report);
  }

  private async updateReport(report: InfringementReport): Promise<InfringementReport> {
    try {
      const { error } = await supabaseAdmin
        .from('infringement_reports')
        .update(report)
        .eq('id', report.id);

      if (error) {
        console.warn('更新数据库失败:', error);
      }
    } catch (e) {
      console.warn('数据库操作失败:', e);
    }

    const localReports = JSON.parse(localStorage.getItem('infringement_reports') || '[]');
    const index = localReports.findIndex((r: InfringementReport) => r.id === report.id);
    if (index !== -1) {
      localReports[index] = report;
      localStorage.setItem('infringement_reports', JSON.stringify(localReports));
    }

    return report;
  }

  async getReportById(id: string): Promise<InfringementReport | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('infringement_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取失败:', e);
    }

    const localReports = JSON.parse(localStorage.getItem('infringement_reports') || '[]');
    return localReports.find((r: InfringementReport) => r.id === id) || null;
  }

  async getMyReports(): Promise<InfringementReport[]> {
    const userInfo = getCurrentUserInfo();
    if (!userInfo) return [];

    try {
      const { data, error } = await supabaseAdmin
        .from('infringement_reports')
        .select('*')
        .eq('reporterId', userInfo.id)
        .order('submittedAt', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取失败:', e);
    }

    const localReports = JSON.parse(localStorage.getItem('infringement_reports') || '[]');
    return localReports.filter((r: InfringementReport) => r.reporterId === userInfo.id);
  }

  async getAllReports(filters?: {
    status?: string;
    type?: string;
    priority?: string;
  }): Promise<InfringementReport[]> {
    try {
      let query = supabaseAdmin
        .from('infringement_reports')
        .select('*')
        .order('submittedAt', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('infringementType', filters.type);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取失败:', e);
    }

    let localReports = JSON.parse(localStorage.getItem('infringement_reports') || '[]');
    
    if (filters?.status) {
      localReports = localReports.filter((r: InfringementReport) => r.status === filters.status);
    }
    if (filters?.type) {
      localReports = localReports.filter((r: InfringementReport) => r.infringementType === filters.type);
    }
    if (filters?.priority) {
      localReports = localReports.filter((r: InfringementReport) => r.priority === filters.priority);
    }

    return localReports;
  }

  async withdrawReport(reportId: string): Promise<InfringementReport> {
    const userInfo = getCurrentUserInfo();
    const report = await this.getReportById(reportId);
    
    if (!report) {
      throw new Error('举报不存在');
    }
    
    if (userInfo?.id !== report.reporterId) {
      throw new Error('无权撤回此举报');
    }

    return this.updateStatus(reportId, { status: 'withdrawn' });
  }

  async getStats(): Promise<InfringementReportStats> {
    const reports = await this.getAllReports();

    const total = reports.length;
    const pending = reports.filter(r => r.status === 'submitted').length;
    const underReview = reports.filter(r => r.status === 'under_review').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const rejected = reports.filter(r => r.status === 'rejected').length;

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    reports.forEach(r => {
      byType[r.infringementType] = (byType[r.infringementType] || 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
    });

    const resolvedReports = reports.filter(r => r.resolvedAt && r.submittedAt);
    const resolutionTimes = resolvedReports.map(r => 
      new Date(r.resolvedAt!).getTime() - new Date(r.submittedAt).getTime()
    );
    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / (1000 * 60 * 60)
      : 0;

    return {
      total,
      pending,
      underReview,
      resolved,
      rejected,
      byType: byType as InfringementReportStats['byType'],
      byPriority: byPriority as InfringementReportStats['byPriority'],
      averageResolutionTime
    };
  }

  async requestEvidence(reportId: string, message: string, adminInfo: { id: string; name: string }): Promise<InfringementReport> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('举报不存在');
    }

    const now = new Date().toISOString();
    report.status = 'evidence_requested';
    report.adminId = adminInfo.id;
    report.adminName = adminInfo.name;
    report.reviewedAt = now;
    report.updatedAt = now;

    report.timeline.push({
      id: `timeline-${Date.now()}`,
      reportId,
      action: 'evidence_requested',
      description: `请求补充证据: ${message}`,
      actorId: adminInfo.id,
      actorName: adminInfo.name,
      actorRole: 'admin',
      createdAt: now
    });

    return this.updateReport(report);
  }
}

export const infringementReportService = new InfringementReportService();
export default infringementReportService;
