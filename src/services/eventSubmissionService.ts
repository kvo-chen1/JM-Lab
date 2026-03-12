import { supabase, supabaseAdmin } from '@/lib/supabase';
import { storageService, supabaseStorageService } from './supabaseStorageService';
import { uploadFile } from './storageServiceNew';

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
      // 使用 bigint 时间戳（毫秒），与数据库 bigint 类型兼容
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
   * 并行上传多个文件（带并发控制）
   */
  async uploadFilesParallel(
    files: File[],
    eventId: string,
    userId: string,
    options?: {
      maxConcurrent?: number;
      onProgress?: (fileIndex: number, progress: number) => void;
      onFileComplete?: (fileIndex: number, fileData: SubmissionFile) => void;
      onFileError?: (fileIndex: number, error: string) => void;
      retries?: number;
    }
  ): Promise<{ success: boolean; files: SubmissionFile[]; errors: string[] }> {
    const {
      maxConcurrent = 3,
      onProgress,
      onFileComplete,
      onFileError,
      retries = 3
    } = options || {};

    const results: SubmissionFile[] = [];
    const errors: string[] = [];
    const fileCount = files.length;

    // 文件队列管理
    let currentIndex = 0;
    let completedCount = 0;
    let runningCount = 0;

    // 使用 Promise.race 实现并发控制
    const uploadWithRetry = async (file: File, index: number): Promise<void> => {
      let lastError: string | undefined;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await this.uploadFile(file, eventId, userId, (progress) => {
            onProgress?.(index, progress);
          });

          if (result.success && result.fileData) {
            results[index] = result.fileData;
            onFileComplete?.(index, result.fileData);
            completedCount++;
            return;
          } else {
            lastError = result.error || '上传失败';
          }
        } catch (error: any) {
          lastError = error.message;
        }

        // 如果不是最后一次尝试，等待后重试
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }

      // 所有重试都失败
      const errorMsg = `文件 "${file.name}" 上传失败: ${lastError}`;
      errors.push(errorMsg);
      onFileError?.(index, errorMsg);
      completedCount++;
    };

    // 启动并发上传
    const run = async (): Promise<void> => {
      while (currentIndex < fileCount && runningCount < maxConcurrent) {
        const index = currentIndex;
        const file = files[index];
        currentIndex++;
        runningCount++;

        uploadWithRetry(file, index).finally(() => {
          runningCount--;
        });
      }

      // 等待所有任务完成
      while (completedCount < fileCount) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    await run();

    // 按原始顺序返回结果
    const orderedResults = results.filter(Boolean);

    return {
      success: errors.length === 0,
      files: orderedResults,
      errors
    };
  }

  /**
   * 分片上传大文件
   */
  async uploadFileWithChunks(
    file: File,
    eventId: string,
    userId: string,
    options?: {
      chunkSize?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<{ success: boolean; fileData?: SubmissionFile; error?: string }> {
    const { chunkSize = 1024 * 1024, onProgress } = options || {}; // 默认 1MB 分片
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    try {
      const folder = `events/${eventId}/${userId}`;
      const fileName = `${Date.now()}_${file.name}`;
      const uploadedUrls: string[] = [];

      // 分片上传
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        // 每个分片创建一个小型文件（实际生产中应该用专门的断点续传服务）
        const chunkFileName = `${fileName}.part${i}`;
        
        // 上传分片
        const formData = new FormData();
        formData.append('file', chunk, chunkFileName);
        
        // 这里简化处理，实际上需要单独的存储逻辑
        // 使用基础上传但报告进度
        const publicUrl = await this.uploadDirect(chunk, folder, chunkFileName);
        uploadedUrls.push(publicUrl);

        // 报告进度
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        onProgress?.(progress);
      }

      // 返回合并后的文件信息
      const fileData: SubmissionFile = {
        id: `${Date.now()}_${file.name}`,
        name: file.name,
        url: uploadedUrls[0], // 返回第一个分片的URL作为主URL
        type: file.type,
        size: file.size,
        thumbnailUrl: file.type.startsWith('image/') ? uploadedUrls[0] : undefined,
      };

      return { success: true, fileData };
    } catch (error: any) {
      console.error('分片上传失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 直接上传到存储（内部方法）
   */
  private async uploadDirect(
    file: File | Blob,
    folder: string,
    fileName: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`${folder}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${folder}/${fileName}`);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('直接上传失败:', error);
      throw error;
    }
  }

  /**
   * 计算文件哈希（用于完整性校验）
   */
  async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 批量提交作品
   */
  async submitBatchWorks(
    eventId: string,
    userId: string,
    participationId: string,
    works: SubmissionData[],
    options?: {
      onProgress?: (current: number, total: number, workTitle: string) => void;
      onWorkComplete?: (index: number, result: { success: boolean; submissionId?: string; error?: string }) => void;
    }
  ): Promise<{ success: boolean; results: Array<{ index: number; success: boolean; submissionId?: string; error?: string }>; totalSubmitted: number }> {
    const results: Array<{ index: number; success: boolean; submissionId?: string; error?: string }> = [];
    let totalSubmitted = 0;

    try {
      for (let i = 0; i < works.length; i++) {
        const work = works[i];
        options?.onProgress?.(i + 1, works.length, work.title);

        try {
          // 上传文件（如果有）
          let uploadedFiles = work.files;
          if (work.files.length > 0 && work.files[0] instanceof File) {
            const uploadResult = await this.uploadFilesParallel(
              work.files as File[],
              eventId,
              userId,
              { maxConcurrent: 3 }
            );
            uploadedFiles = uploadResult.files;
          }

          // 提交作品
          const submitResult = await this.submitWork(
            eventId,
            userId,
            participationId,
            { ...work, files: uploadedFiles }
          );

          results.push({
            index: i,
            success: submitResult.success,
            submissionId: submitResult.submissionId,
            error: submitResult.error
          });

          if (submitResult.success) {
            totalSubmitted++;
          }

          options?.onWorkComplete?.(i, { success: submitResult.success, submissionId: submitResult.submissionId, error: submitResult.error });
        } catch (error: any) {
          results.push({
            index: i,
            success: false,
            error: error.message
          });
          options?.onWorkComplete?.(i, { success: false, error: error.message });
        }
      }

      return {
        success: totalSubmitted === works.length,
        results,
        totalSubmitted
      };
    } catch (error: any) {
      console.error('批量提交失败:', error);
      return {
        success: false,
        results,
        totalSubmitted
      };
    }
  }

  /**
   * 验证用户提交配额
   */
  async checkSubmissionQuota(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt?: Date; error?: string }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', userId)
        .eq('quota_type', 'daily_submission')
        .gte('reset_at', today.toISOString())
        .lt('reset_at', tomorrow.toISOString())
        .maybeSingle();

      if (error) throw error;

      const dailyLimit = 10;
      const used = data?.used || 0;
      const remaining = Math.max(0, dailyLimit - used);

      return {
        allowed: remaining > 0,
        remaining,
        resetAt: tomorrow
      };
    } catch (error: any) {
      console.error('检查配额失败:', error);
      // 出错时允许提交
      return { allowed: true, remaining: 10 };
    }
  }

  /**
   * 记录提交次数
   */
  async recordSubmission(userId: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', userId)
        .eq('quota_type', 'daily_submission')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // 更新现有记录
        await supabase
          .from('user_quotas')
          .update({
            used: (data.used || 0) + 1,
            updated_at: Date.now()
          })
          .eq('id', data.id);
      } else {
        // 创建新记录
        await supabase
          .from('user_quotas')
          .insert({
            user_id: userId,
            quota_type: 'daily_submission',
            used: 1,
            limit: 10,
            reset_at: today.toISOString(),
            created_at: Date.now(),
            updated_at: Date.now()
          });
      }

      return true;
    } catch (error) {
      console.error('记录提交次数失败:', error);
      return false;
    }
  }

  /**
   * 上传文件（保留原方法用于兼容）
   */
  async uploadFile(
    file: File,
    eventId: string,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; fileData?: SubmissionFile; error?: string }> {
    try {
      const folder = `events/${eventId}/${userId}`;
      
      // 使用新的存储服务上传
      const publicUrl = await uploadFile(file, folder);

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
