import { supabaseAdmin } from '@/lib/supabase';

export interface WorkVersion {
  id: string;
  work_id: string;
  version_number: number;
  title: string;
  description: string;
  files: any[];
  created_by: string;
  created_at: string;
  note?: string;
}

export interface CreateVersionParams {
  workId: string;
  userId: string;
  title: string;
  description: string;
  files: any[];
  note?: string;
}

class WorkVersionService {
  /**
   * 创建新版本
   */
  async createVersion(params: CreateVersionParams): Promise<{ success: boolean; version?: WorkVersion; error?: string }> {
    try {
      // 获取当前最新版本号
      const { data: latestVersion } = await supabaseAdmin
        .from('work_versions')
        .select('version_number')
        .eq('work_id', params.workId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (latestVersion?.version_number || 0) + 1;

      const { data, error } = await supabaseAdmin
        .from('work_versions')
        .insert({
          work_id: params.workId,
          version_number: nextVersion,
          title: params.title,
          description: params.description,
          files: params.files,
          created_by: params.userId,
          note: params.note || null,
          created_at: Date.now()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, version: this.formatVersion(data) };
    } catch (error: any) {
      console.error('创建版本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取作品的所有版本
   */
  async getVersions(workId: string): Promise<WorkVersion[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('work_versions')
        .select('*')
        .eq('work_id', workId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.formatVersion);
    } catch (error) {
      console.error('获取版本列表失败:', error);
      return [];
    }
  }

  /**
   * 获取指定版本
   */
  async getVersion(workId: string, versionNumber: number): Promise<WorkVersion | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('work_versions')
        .select('*')
        .eq('work_id', workId)
        .eq('version_number', versionNumber)
        .single();

      if (error) throw error;

      return this.formatVersion(data);
    } catch (error) {
      console.error('获取版本失败:', error);
      return null;
    }
  }

  /**
   * 获取最新版本
   */
  async getLatestVersion(workId: string): Promise<WorkVersion | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('work_versions')
        .select('*')
        .eq('work_id', workId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return this.formatVersion(data);
    } catch (error) {
      console.error('获取最新版本失败:', error);
      return null;
    }
  }

  /**
   * 版本对比（返回两个版本之间的差异）
   */
  async compareVersions(workId: string, versionA: number, versionB: number): Promise<{
    titleChanged: boolean;
    descriptionChanged: boolean;
    filesChanged: boolean;
    changes: string[];
  }> {
    try {
      const [version1, version2] = await Promise.all([
        this.getVersion(workId, versionA),
        this.getVersion(workId, versionB)
      ]);

      if (!version1 || !version2) {
        return {
          titleChanged: false,
          descriptionChanged: false,
          filesChanged: false,
          changes: ['版本不存在']
        };
      }

      const changes: string[] = [];
      const titleChanged = version1.title !== version2.title;
      const descriptionChanged = version1.description !== version2.description;
      const filesChanged = JSON.stringify(version1.files) !== JSON.stringify(version2.files);

      if (titleChanged) changes.push('标题已修改');
      if (descriptionChanged) changes.push('描述已修改');
      if (filesChanged) changes.push('文件已修改');

      return {
        titleChanged,
        descriptionChanged,
        filesChanged,
        changes
      };
    } catch (error) {
      console.error('版本对比失败:', error);
      return {
        titleChanged: false,
        descriptionChanged: false,
        filesChanged: false,
        changes: ['对比失败']
      };
    }
  }

  /**
   * 删除版本
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('work_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('删除版本失败:', error);
      return false;
    }
  }

  /**
   * 格式化版本数据
   */
  private formatVersion(data: any): WorkVersion {
    return {
      id: data.id,
      work_id: data.work_id,
      version_number: data.version_number,
      title: data.title,
      description: data.description,
      files: data.files || [],
      created_by: data.created_by,
      created_at: data.created_at,
      note: data.note
    };
  }
}

export const workVersionService = new WorkVersionService();
