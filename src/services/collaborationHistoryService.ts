import { supabase } from '../lib/supabase';
import type {
  CollaborationHistory,
  CollaborationVersion,
  CollaborationStats,
  PaginatedResponse,
} from '../types/work-collaboration';

class CollaborationHistoryService {
  async recordAction(
    workId: string,
    userId: string,
    actionType: CollaborationHistory['actionType'],
    options?: {
      actionDetail?: Record<string, any>;
      sessionId?: string;
    }
  ): Promise<CollaborationHistory | null> {
    try {
      const { data, error } = await supabase
        .from('collaboration_history')
        .insert({
          work_id: workId,
          user_id: userId,
          action_type: actionType,
          action_detail: options?.actionDetail,
          session_id: options?.sessionId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.warn('Failed to record history to database:', error);
        return this.createLocalHistory(workId, userId, actionType, options);
      }

      return this.mapHistoryFromDB(data);
    } catch (error) {
      console.error('Error recording history:', error);
      return this.createLocalHistory(workId, userId, actionType, options);
    }
  }

  private createLocalHistory(
    workId: string,
    userId: string,
    actionType: CollaborationHistory['actionType'],
    options?: {
      actionDetail?: Record<string, any>;
      sessionId?: string;
    }
  ): CollaborationHistory {
    return {
      id: `local-${Date.now()}`,
      workId,
      userId,
      actionType,
      actionDetail: options?.actionDetail,
      sessionId: options?.sessionId,
      createdAt: new Date().toISOString(),
    };
  }

  async getWorkHistory(
    workId: string,
    options?: {
      page?: number;
      pageSize?: number;
      actionTypes?: CollaborationHistory['actionType'][];
      userId?: string;
    }
  ): Promise<PaginatedResponse<CollaborationHistory>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    try {
      let query = supabase
        .from('collaboration_history')
        .select('*', { count: 'exact' })
        .eq('work_id', workId);

      if (options?.actionTypes && options.actionTypes.length > 0) {
        query = query.in('action_type', options.actionTypes);
      }

      if (options?.userId) {
        query = query.eq('user_id', options.userId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.warn('Failed to fetch history from database:', error);
        return {
          items: [],
          total: 0,
          page,
          pageSize,
          hasMore: false,
        };
      }

      const items = (data || []).map(this.mapHistoryFromDB);
      return {
        items,
        total: count || 0,
        page,
        pageSize,
        hasMore: (count || 0) > page * pageSize,
      };
    } catch (error) {
      console.error('Error fetching history:', error);
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      };
    }
  }

  async getUserHistory(
    userId: string,
    options?: {
      page?: number;
      pageSize?: number;
      workId?: string;
    }
  ): Promise<PaginatedResponse<CollaborationHistory>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    try {
      let query = supabase
        .from('collaboration_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (options?.workId) {
        query = query.eq('work_id', options.workId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.warn('Failed to fetch user history from database:', error);
        return {
          items: [],
          total: 0,
          page,
          pageSize,
          hasMore: false,
        };
      }

      const items = (data || []).map(this.mapHistoryFromDB);
      return {
        items,
        total: count || 0,
        page,
        pageSize,
        hasMore: (count || 0) > page * pageSize,
      };
    } catch (error) {
      console.error('Error fetching user history:', error);
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      };
    }
  }

  async createVersion(
    workId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      content?: any;
      thumbnailUrl?: string;
      tags?: string[];
      files?: string[];
      changeLog?: string;
      isAutoSave?: boolean;
    }
  ): Promise<CollaborationVersion> {
    try {
      const latestVersion = await this.getLatestVersion(workId);
      const versionNumber = (latestVersion?.versionNumber || 0) + 1;

      const { data: version, error } = await supabase
        .from('collaboration_versions')
        .insert({
          work_id: workId,
          version_number: versionNumber,
          title: data.title,
          description: data.description,
          content: data.content,
          thumbnail_url: data.thumbnailUrl,
          tags: data.tags,
          files: data.files,
          created_by: userId,
          change_log: data.changeLog,
          is_auto_save: data.isAutoSave || false,
          is_collaboration_snapshot: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.warn('Failed to save version to database:', error);
        return this.createLocalVersion(workId, versionNumber, userId, data);
      }

      await this.recordAction(workId, userId, 'version_create', {
        actionDetail: { versionId: version.id, versionNumber },
      });

      return this.mapVersionFromDB(version);
    } catch (error) {
      console.error('Error creating version:', error);
      const latestVersion = await this.getLatestVersion(workId);
      const versionNumber = (latestVersion?.versionNumber || 0) + 1;
      return this.createLocalVersion(workId, versionNumber, userId, data);
    }
  }

  private createLocalVersion(
    workId: string,
    versionNumber: number,
    userId: string,
    data: {
      title: string;
      description?: string;
      content?: any;
      thumbnailUrl?: string;
      tags?: string[];
      files?: string[];
      changeLog?: string;
      isAutoSave?: boolean;
    }
  ): CollaborationVersion {
    return {
      id: `local-version-${Date.now()}`,
      workId,
      versionNumber,
      title: data.title,
      description: data.description,
      content: data.content,
      thumbnailUrl: data.thumbnailUrl,
      tags: data.tags,
      files: data.files,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      changeLog: data.changeLog,
      isAutoSave: data.isAutoSave || false,
      isCollaborationSnapshot: true,
      collaboratorCount: 1,
      collaborators: [userId],
    };
  }

  async getVersions(
    workId: string,
    options?: {
      page?: number;
      pageSize?: number;
      includeAutoSaves?: boolean;
    }
  ): Promise<PaginatedResponse<CollaborationVersion>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    try {
      let query = supabase
        .from('collaboration_versions')
        .select('*', { count: 'exact' })
        .eq('work_id', workId);

      if (!options?.includeAutoSaves) {
        query = query.eq('is_auto_save', false);
      }

      const { data, error, count } = await query
        .order('version_number', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.warn('Failed to fetch versions from database:', error);
        return {
          items: [],
          total: 0,
          page,
          pageSize,
          hasMore: false,
        };
      }

      const items = (data || []).map(this.mapVersionFromDB);
      return {
        items,
        total: count || 0,
        page,
        pageSize,
        hasMore: (count || 0) > page * pageSize,
      };
    } catch (error) {
      console.error('Error fetching versions:', error);
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      };
    }
  }

  async getVersion(workId: string, versionId: string): Promise<CollaborationVersion | null> {
    try {
      const { data, error } = await supabase
        .from('collaboration_versions')
        .select('*')
        .eq('id', versionId)
        .eq('work_id', workId)
        .single();

      if (error || !data) {
        console.warn('Version not found:', error);
        return null;
      }

      return this.mapVersionFromDB(data);
    } catch (error) {
      console.error('Error fetching version:', error);
      return null;
    }
  }

  async getVersionByNumber(workId: string, versionNumber: number): Promise<CollaborationVersion | null> {
    try {
      const { data, error } = await supabase
        .from('collaboration_versions')
        .select('*')
        .eq('work_id', workId)
        .eq('version_number', versionNumber)
        .single();

      if (error || !data) {
        console.warn('Version not found:', error);
        return null;
      }

      return this.mapVersionFromDB(data);
    } catch (error) {
      console.error('Error fetching version:', error);
      return null;
    }
  }

  async getLatestVersion(workId: string): Promise<CollaborationVersion | null> {
    try {
      const { data, error } = await supabase
        .from('collaboration_versions')
        .select('*')
        .eq('work_id', workId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapVersionFromDB(data);
    } catch (error) {
      console.error('Error fetching latest version:', error);
      return null;
    }
  }

  async restoreVersion(
    workId: string,
    versionId: string,
    userId: string
  ): Promise<CollaborationVersion> {
    const version = await this.getVersion(workId, versionId);
    if (!version) {
      throw new Error('版本不存在');
    }

    const latestVersion = await this.getLatestVersion(workId);
    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    const newVersion = await this.createVersion(workId, userId, {
      title: version.title,
      description: version.description,
      content: version.content,
      thumbnailUrl: version.thumbnailUrl,
      tags: version.tags,
      files: version.files,
      changeLog: `恢复自版本 v${version.versionNumber}`,
      isAutoSave: false,
    });

    await this.recordAction(workId, userId, 'version_restore', {
      actionDetail: { restoredVersionId: versionId, newVersionId: newVersion.id },
    });

    return newVersion;
  }

  async deleteVersion(workId: string, versionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collaboration_versions')
        .delete()
        .eq('id', versionId)
        .eq('work_id', workId);

      if (error) {
        console.error('Error deleting version:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting version:', error);
      return false;
    }
  }

  async getStats(workId: string): Promise<CollaborationStats> {
    try {
      const [
        { count: collaboratorCount },
        { count: sessionCount },
        { count: versionCount },
        { data: lastActivity },
      ] = await Promise.all([
        supabase
          .from('work_collaborators')
          .select('*', { count: 'exact', head: true })
          .eq('work_id', workId),
        supabase
          .from('collaboration_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('work_id', workId),
        supabase
          .from('collaboration_versions')
          .select('*', { count: 'exact', head: true })
          .eq('work_id', workId),
        supabase
          .from('collaboration_history')
          .select('created_at')
          .eq('work_id', workId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ]);

      return {
        totalCollaborators: collaboratorCount || 0,
        activeCollaborators: collaboratorCount || 0,
        totalSessions: sessionCount || 0,
        totalEdits: collaboratorCount || 0,
        totalVersions: versionCount || 0,
        averageSessionDuration: 0,
        lastActiveAt: lastActivity?.created_at,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalCollaborators: 0,
        activeCollaborators: 0,
        totalSessions: 0,
        totalEdits: 0,
        totalVersions: 0,
        averageSessionDuration: 0,
      };
    }
  }

  async getActivitySummary(
    workId: string,
    days: number = 7
  ): Promise<{ date: string; edits: number; joins: number; leaves: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const { data, error } = await supabase
        .from('collaboration_history')
        .select('action_type, created_at')
        .eq('work_id', workId)
        .gte('created_at', startDate.toISOString());

      if (error) {
        console.warn('Failed to fetch activity summary:', error);
        return [];
      }

      const activityMap = new Map<string, { edits: number; joins: number; leaves: number }>();

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        activityMap.set(dateStr, { edits: 0, joins: 0, leaves: 0 });
      }

      (data || []).forEach((item: any) => {
        const dateStr = item.created_at.split('T')[0];
        const activity = activityMap.get(dateStr);
        if (activity) {
          if (item.action_type === 'edit') activity.edits++;
          else if (item.action_type === 'join') activity.joins++;
          else if (item.action_type === 'leave') activity.leaves++;
        }
      });

      return Array.from(activityMap.entries()).map(([date, counts]) => ({
        date,
        ...counts,
      }));
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      return [];
    }
  }

  private mapHistoryFromDB(data: any): CollaborationHistory {
    return {
      id: data.id,
      workId: data.work_id,
      userId: data.user_id,
      actionType: data.action_type,
      actionDetail: data.action_detail,
      sessionId: data.session_id,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: data.created_at,
    };
  }

  private mapVersionFromDB(data: any): CollaborationVersion {
    return {
      id: data.id,
      workId: data.work_id,
      versionNumber: data.version_number,
      title: data.title,
      description: data.description,
      content: data.content,
      thumbnailUrl: data.thumbnail_url,
      tags: data.tags,
      files: data.files,
      createdBy: data.created_by,
      createdAt: data.created_at,
      changeLog: data.change_log,
      isAutoSave: data.is_auto_save,
      isCollaborationSnapshot: data.is_collaboration_snapshot,
      collaboratorCount: data.collaborator_count || 1,
      collaborators: data.collaborators || [data.created_by],
    };
  }
}

export const collaborationHistoryService = new CollaborationHistoryService();
export default collaborationHistoryService;
