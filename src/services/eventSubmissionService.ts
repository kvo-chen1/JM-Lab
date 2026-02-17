import { supabase, supabaseAdmin } from '@/lib/supabase';
import { supabaseStorageService } from './supabaseStorageService';

// 提交文件接口
export interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  thumbnailUrl?: string;
}

// 作品提交数据接口
export interface SubmissionData {
  title: string;
  description: string;
  files: SubmissionFile[];
  metadata?: Record<string, any>;
}

// 提交记录接口
export interface EventSubmission {
  id: string;
  eventId: string;
  userId: string;
  participationId: string;
  title: string;
  description: string;
  files: SubmissionFile[];
  status: 'draft' | 'submitted' | 'under_review' | 'reviewed' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  score?: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// 草稿自动保存数据
export interface SubmissionDraft {
  participationId: string;
  title: string;
  description: string;
  files: SubmissionFile[];
  lastSavedAt: string;
}

const STORAGE_KEY = 'event_submission_drafts';
const BUCKET_NAME = 'event-submissions';

class EventSubmissionService {
  /**
   * 获取提交详情
   */
  async getSubmission(submissionId: string): Promise<EventSubmission | null> {
    try {
      const { data, error } = await supabase
        .from('event_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.formatSubmission(data);
    } catch (error) {
      console.error('获取提交详情失败:', error);
      return null;
    }
  }

  /**
   * 根据参与ID获取提交
   */
  async getSubmissionByParticipation(participationId: string): Promise<EventSubmission | null> {
    try {
      console.log('[getSubmissionByParticipation] 查询 participationId:', participationId);
      // 使用 supabaseAdmin 绕过 RLS
      const { data, error } = await supabaseAdmin
        .from('event_submissions')
        .select('*')
        .eq('participation_id', participationId)
        .maybeSingle();

      console.log('[getSubmissionByParticipation] 查询结果:', { data, error });

      if (error) throw error;
      if (!data) return null;

      return this.formatSubmission(data);
    } catch (error) {
      console.error('[getSubmissionByParticipation] 获取提交失败:', error);
      return null;
    }
  }

  /**
   * 创建草稿
   */
  async createDraft(
    eventId: string,
    userId: string,
    participationId: string,
    data: SubmissionData
  ): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    try {
      // 使用 bigint 时间戳（毫秒），与数据库类型兼容
      const now = Date.now();
      const { data: result, error } = await supabase
        .from('event_submissions')
        .insert({
          event_id: eventId,
          user_id: userId,
          participation_id: participationId,
          title: data.title,
          description: data.description,
          files: data.files,
          status: 'draft',
          metadata: data.metadata || {},
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, submissionId: result.id };
    } catch (error: any) {
      console.error('创建草稿失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新草稿
   */
  async updateDraft(
    submissionId: string,
    data: Partial<SubmissionData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        updated_at: Date.now(), // 使用 bigint 时间戳（毫秒）
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.files !== undefined) updateData.files = data.files;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;

      const { error } = await supabase
        .from('event_submissions')
        .update(updateData)
        .eq('id', submissionId)
        .eq('status', 'draft');

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('更新草稿失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 提交作品（正式发布）
   */
  async submitWork(
    eventId: string,
    userId: string,
    participationId: string,
    data: SubmissionData
  ): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    try {
      const { data: result, error } = await supabase.rpc('submit_event_work', {
        p_event_id: eventId,
        p_user_id: userId,
        p_participation_id: participationId,
        p_title: data.title,
        p_description: data.description,
        p_files: data.files,
      });

      if (error) throw error;

      if (result?.success) {
        // 清除本地草稿
        this.clearDraft(participationId);
        return { success: true, submissionId: result.submission_id };
      } else {
        return { success: false, error: result?.error || '提交失败' };
      }
    } catch (error: any) {
      console.error('提交作品失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除草稿
   */
  async deleteDraft(submissionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('event_submissions')
        .delete()
        .eq('id', submissionId)
        .eq('status', 'draft');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除草稿失败:', error);
      return false;
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(
    file: File,
    eventId: string,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; fileData?: SubmissionFile; error?: string }> {
    try {
      const filePath = `${eventId}/${userId}/${Date.now()}_${file.name}`;
      
      const result = await supabaseStorageService.uploadFile(
        BUCKET_NAME,
        filePath,
        file,
        {
          onProgress,
          upsert: true,
        }
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // 获取文件URL
      const { data: { publicUrl } } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const fileData: SubmissionFile = {
        id: `${Date.now()}_${file.name}`,
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
      };

      // 如果是图片，生成缩略图
      if (file.type.startsWith('image/')) {
        fileData.thumbnailUrl = publicUrl;
      }

      return { success: true, fileData };
    } catch (error: any) {
      console.error('上传文件失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除已上传的文件
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const result = await supabaseStorageService.deleteFile(BUCKET_NAME, filePath);
      return result.success;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }

  /**
   * 本地草稿：保存到 localStorage
   */
  saveDraftToLocal(draft: SubmissionDraft): void {
    try {
      const drafts = this.getAllDraftsFromLocal();
      drafts[draft.participationId] = {
        ...draft,
        lastSavedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('保存草稿到本地失败:', error);
    }
  }

  /**
   * 本地草稿：从 localStorage 读取
   */
  getDraftFromLocal(participationId: string): SubmissionDraft | null {
    try {
      const drafts = this.getAllDraftsFromLocal();
      return drafts[participationId] || null;
    } catch (error) {
      console.error('读取本地草稿失败:', error);
      return null;
    }
  }

  /**
   * 本地草稿：获取所有草稿
   */
  getAllDraftsFromLocal(): Record<string, SubmissionDraft> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * 本地草稿：清除指定草稿
   */
  clearDraft(participationId: string): void {
    try {
      const drafts = this.getAllDraftsFromLocal();
      delete drafts[participationId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('清除草稿失败:', error);
    }
  }

  /**
   * 本地草稿：清除所有草稿
   */
  clearAllDrafts(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('清除所有草稿失败:', error);
    }
  }

  /**
   * 格式化提交数据
   */
  private formatSubmission(data: any): EventSubmission {
    return {
      id: data.id,
      eventId: data.event_id,
      userId: data.user_id,
      participationId: data.participation_id,
      title: data.title,
      description: data.description,
      files: data.files || [],
      status: data.status,
      submittedAt: data.submitted_at,
      reviewedAt: data.reviewed_at,
      reviewNotes: data.review_notes,
      score: data.score,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * 检查提交状态
   */
  async checkSubmissionStatus(
    eventId: string,
    userId: string
  ): Promise<{
    hasSubmitted: boolean;
    submission?: EventSubmission;
    canSubmit: boolean;
    deadline?: string;
  }> {
    try {
      // 获取活动信息
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('end_time, status')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      const now = new Date();
      const deadline = new Date(event.end_time);
      const canSubmit = event.status === 'published' && now < deadline;

      // 检查是否已提交
      const { data: submission, error: subError } = await supabase
        .from('event_submissions')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') throw subError;

      return {
        hasSubmitted: !!submission && submission.status !== 'draft',
        submission: submission ? this.formatSubmission(submission) : undefined,
        canSubmit,
        deadline: event.end_time,
      };
    } catch (error) {
      console.error('检查提交状态失败:', error);
      return { hasSubmitted: false, canSubmit: false };
    }
  }

  /**
   * 获取用户的所有提交
   */
  async getUserSubmissions(
    userId: string,
    options?: {
      status?: EventSubmission['status'];
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ data: EventSubmission[]; total: number }> {
    try {
      const { status, page = 1, pageSize = 10 } = options || {};
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('event_submissions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: (data || []).map((item) => this.formatSubmission(item)),
        total: count || 0,
      };
    } catch (error) {
      console.error('获取用户提交失败:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * 从AI写作提交作品
   */
  async submitWorkFromAIWriter(params: {
    eventId: string;
    userId: string;
    participationId: string;
    title: string;
    description: string;
    aiWriterContent: string;
    aiWriterHistoryId?: string;
  }): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    try {
      const { data: result, error } = await supabase.rpc('submit_work_from_ai_writer', {
        p_event_id: params.eventId,
        p_user_id: params.userId,
        p_participation_id: params.participationId,
        p_title: params.title,
        p_description: params.description,
        p_ai_writer_content: params.aiWriterContent,
        p_ai_writer_history_id: params.aiWriterHistoryId || null,
        p_files: [],
      });

      if (error) throw error;

      if (result?.success) {
        return { success: true, submissionId: result.submission_id };
      } else {
        return { success: false, error: result?.error || '提交失败' };
      }
    } catch (error: any) {
      console.error('从AI写作提交作品失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取活动类型配置
   */
  async getEventTypeConfig(typeCode: string): Promise<any | null> {
    try {
      const { data, error } = await supabase.rpc('get_event_type_config', {
        p_type_code: typeCode,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取活动类型配置失败:', error);
      return null;
    }
  }

  /**
   * 获取所有活动类型配置
   */
  async getAllEventTypeConfigs(): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_event_type_configs');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取所有活动类型配置失败:', error);
      return [];
    }
  }
}

export const eventSubmissionService = new EventSubmissionService();
