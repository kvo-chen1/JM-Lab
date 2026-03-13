import { toast } from 'sonner';

export interface WorkVersion {
  id: string;
  workId: number | string;
  versionNumber: number;
  title: string;
  description?: string;
  content?: any;
  thumbnailUrl?: string;
  tags?: string[];
  files?: string[];
  createdAt: string;
  createdBy: string;
  changeLog?: string;
  isAutoSave?: boolean;
}

interface VersionConfig {
  maxVersions: number;
  autoSaveInterval: number;
}

class WorkVersionService {
  private versions: Map<string | number, WorkVersion[]> = new Map();
  private config: VersionConfig = {
    maxVersions: 50,
    autoSaveInterval: 30000,
  };

  setConfig(config: Partial<VersionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  createVersion(
    workId: number | string,
    data: Omit<WorkVersion, 'id' | 'versionNumber' | 'createdAt'>,
    changeLog?: string
  ): WorkVersion {
    const existingVersions = this.versions.get(workId) || [];
    const versionNumber = existingVersions.length + 1;

    const version: WorkVersion = {
      id: `v-${workId}-${Date.now()}`,
      workId,
      versionNumber,
      ...data,
      createdAt: new Date().toISOString(),
      changeLog,
    };

    let updatedVersions = [...existingVersions, version];

    if (updatedVersions.length > this.config.maxVersions) {
      updatedVersions = updatedVersions.slice(-this.config.maxVersions);
    }

    this.versions.set(workId, updatedVersions);
    toast.success(`版本 v${versionNumber} 已保存`);

    return version;
  }

  getVersions(workId: number | string): WorkVersion[] {
    return this.versions.get(workId) || [];
  }

  getVersion(workId: number | string, versionId: string): WorkVersion | undefined {
    const versions = this.versions.get(workId);
    return versions?.find(v => v.id === versionId);
  }

  getLatestVersion(workId: number | string): WorkVersion | undefined {
    const versions = this.versions.get(workId);
    return versions?.[versions.length - 1];
  }

  restoreVersion(workId: number | string, versionId: string): WorkVersion | undefined {
    const version = this.getVersion(workId, versionId);
    if (!version) {
      toast.error('版本不存在');
      return undefined;
    }

    const restoredVersion = this.createVersion(
      workId,
      {
        title: version.title,
        description: version.description,
        content: version.content,
        thumbnailUrl: version.thumbnailUrl,
        tags: version.tags,
        files: version.files,
        createdBy: version.createdBy,
      },
      `恢复自版本 v${version.versionNumber}`
    );

    toast.success(`已恢复到版本 v${version.versionNumber}`);
    return restoredVersion;
  }

  deleteVersion(workId: number | string, versionId: string): boolean {
    const versions = this.versions.get(workId);
    if (!versions) return false;

    const filteredVersions = versions.filter(v => v.id !== versionId);
    if (filteredVersions.length === versions.length) return false;

    this.versions.set(workId, filteredVersions);
    toast.success('版本已删除');
    return true;
  }

  clearVersions(workId: number | string): void {
    this.versions.delete(workId);
    toast.success('所有版本已清除');
  }

  compareVersions(
    workId: number | string,
    versionId1: string,
    versionId2: string
  ): { added: string[]; removed: string[]; modified: string[] } | null {
    const v1 = this.getVersion(workId, versionId1);
    const v2 = this.getVersion(workId, versionId2);

    if (!v1 || !v2) return null;

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    if (v1.title !== v2.title) modified.push('title');
    if (v1.description !== v2.description) modified.push('description');

    const tags1 = new Set(v1.tags || []);
    const tags2 = new Set(v2.tags || []);
    for (const tag of tags2) {
      if (!tags1.has(tag)) added.push(`tag:${tag}`);
    }
    for (const tag of tags1) {
      if (!tags2.has(tag)) removed.push(`tag:${tag}`);
    }

    return { added, removed, modified };
  }

  getVersionStats(workId: number | string): {
    totalVersions: number;
    firstVersionAt?: string;
    lastVersionAt?: string;
    autoSaveCount: number;
  } {
    const versions = this.versions.get(workId) || [];
    const autoSaveCount = versions.filter(v => v.isAutoSave).length;

    return {
      totalVersions: versions.length,
      firstVersionAt: versions[0]?.createdAt,
      lastVersionAt: versions[versions.length - 1]?.createdAt,
      autoSaveCount,
    };
  }
}

export const workVersionService = new WorkVersionService();

export default workVersionService;
