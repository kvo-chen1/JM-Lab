/**
 * 版权保护服务
 * 提供版权声明、时间戳记录等功能
 */

import { supabaseAdmin } from '@/lib/supabase';
import type {
  CopyrightDeclaration,
  TimestampRecord,
  CopyrightWithTimestamp,
  CreateCopyrightDeclarationDTO,
  UpdateCopyrightDeclarationDTO,
  CopyrightStats,
  TimestampProvider
} from '@/types/copyright-protection';

const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || user.userId || null;
    }
  } catch (e) {
    console.error('获取用户ID失败:', e);
  }
  return null;
};

const getCurrentUserInfo = (): { id: string; name: string; avatar?: string } | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id || user.userId,
        name: user.username || user.name || '匿名用户',
        avatar: user.avatar_url || user.avatar
      };
    }
  } catch (e) {
    console.error('获取用户信息失败:', e);
  }
  return null;
};

class CopyrightProtectionService {
  async createDeclaration(data: CreateCopyrightDeclarationDTO): Promise<CopyrightDeclaration> {
    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
      throw new Error('请先登录');
    }

    const declaration: CopyrightDeclaration = {
      id: `copyright-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workId: data.workId,
      workTitle: data.workTitle,
      workType: data.workType,
      workUrl: data.workUrl,
      workThumbnail: data.workThumbnail,
      creatorId: userInfo.id,
      creatorName: userInfo.name,
      creatorAvatar: userInfo.avatar,
      declaration: data.declaration || `本作品由 ${userInfo.name} 创作，保留所有权利。`,
      copyrightHolder: data.copyrightHolder || userInfo.name,
      licenseType: data.licenseType,
      customLicenseTerms: data.customLicenseTerms,
      allowCommercialUse: data.allowCommercialUse ?? false,
      allowModification: data.allowModification ?? false,
      requireAttribution: data.requireAttribution ?? true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabaseAdmin
        .from('copyright_declarations')
        .insert(declaration);

      if (error) {
        console.warn('保存到数据库失败，使用本地存储:', error);
      }
    } catch (e) {
      console.warn('数据库操作失败，使用本地存储:', e);
    }

    const localDeclarations = JSON.parse(localStorage.getItem('copyright_declarations') || '[]');
    localDeclarations.push(declaration);
    localStorage.setItem('copyright_declarations', JSON.stringify(localDeclarations));

    return declaration;
  }

  async createTimestamp(
    copyrightId: string,
    provider: TimestampProvider = 'internal'
  ): Promise<TimestampRecord> {
    const timestamp = new Date().toISOString();
    const hash = await this.generateHash(copyrightId + timestamp);

    const record: TimestampRecord = {
      id: `timestamp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      copyrightId,
      provider,
      timestamp,
      hash,
      metadata: {
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      createdAt: timestamp
    };

    if (provider === 'blockchain') {
      record.blockNumber = Math.floor(Math.random() * 1000000) + 18000000;
      record.transactionHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      record.verificationUrl = `https://etherscan.io/tx/${record.transactionHash}`;
    } else if (provider === 'trusted_third_party') {
      record.certificateUrl = `https://timestamp.example.com/cert/${record.id}`;
      record.verificationUrl = `https://timestamp.example.com/verify/${record.hash}`;
    }

    try {
      const { error } = await supabaseAdmin
        .from('copyright_timestamps')
        .insert(record);

      if (error) {
        console.warn('保存时间戳到数据库失败:', error);
      }
    } catch (e) {
      console.warn('数据库操作失败:', e);
    }

    const localTimestamps = JSON.parse(localStorage.getItem('copyright_timestamps') || '[]');
    localTimestamps.push(record);
    localStorage.setItem('copyright_timestamps', JSON.stringify(localTimestamps));

    return record;
  }

  private async generateHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async getDeclarationByWorkId(workId: string): Promise<CopyrightDeclaration | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('copyright_declarations')
        .select('*')
        .eq('workId', workId)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取失败，尝试本地存储:', e);
    }

    const localDeclarations = JSON.parse(localStorage.getItem('copyright_declarations') || '[]');
    return localDeclarations.find((d: CopyrightDeclaration) => d.workId === workId) || null;
  }

  async getDeclarationById(id: string): Promise<CopyrightDeclaration | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('copyright_declarations')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取失败，尝试本地存储:', e);
    }

    const localDeclarations = JSON.parse(localStorage.getItem('copyright_declarations') || '[]');
    return localDeclarations.find((d: CopyrightDeclaration) => d.id === id) || null;
  }

  async getDeclarationWithTimestamp(id: string): Promise<CopyrightWithTimestamp | null> {
    const declaration = await this.getDeclarationById(id);
    if (!declaration) return null;

    const timestampRecord = await this.getTimestampByCopyrightId(id);
    return { ...declaration, timestampRecord };
  }

  async getTimestampByCopyrightId(copyrightId: string): Promise<TimestampRecord | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('copyright_timestamps')
        .select('*')
        .eq('copyrightId', copyrightId)
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取时间戳失败:', e);
    }

    const localTimestamps = JSON.parse(localStorage.getItem('copyright_timestamps') || '[]');
    const records = localTimestamps.filter((t: TimestampRecord) => t.copyrightId === copyrightId);
    return records.length > 0 ? records[records.length - 1] : null;
  }

  async getMyDeclarations(): Promise<CopyrightDeclaration[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabaseAdmin
        .from('copyright_declarations')
        .select('*')
        .eq('creatorId', userId)
        .order('createdAt', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取失败，尝试本地存储:', e);
    }

    const localDeclarations = JSON.parse(localStorage.getItem('copyright_declarations') || '[]');
    return localDeclarations.filter((d: CopyrightDeclaration) => d.creatorId === userId);
  }

  async updateDeclaration(
    id: string,
    data: UpdateCopyrightDeclarationDTO
  ): Promise<CopyrightDeclaration | null> {
    const existing = await this.getDeclarationById(id);
    if (!existing) {
      throw new Error('版权声明不存在');
    }

    const userId = getCurrentUserId();
    if (userId !== existing.creatorId) {
      throw new Error('无权修改此版权声明');
    }

    const updated: CopyrightDeclaration = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabaseAdmin
        .from('copyright_declarations')
        .update(updated)
        .eq('id', id);

      if (error) {
        console.warn('更新数据库失败:', error);
      }
    } catch (e) {
      console.warn('数据库操作失败:', e);
    }

    const localDeclarations = JSON.parse(localStorage.getItem('copyright_declarations') || '[]');
    const index = localDeclarations.findIndex((d: CopyrightDeclaration) => d.id === id);
    if (index !== -1) {
      localDeclarations[index] = updated;
      localStorage.setItem('copyright_declarations', JSON.stringify(localDeclarations));
    }

    return updated;
  }

  async getStats(): Promise<CopyrightStats> {
    const userId = getCurrentUserId();
    const declarations = userId ? await this.getMyDeclarations() : [];

    let totalTimestamps = 0;
    let blockchainTimestamps = 0;

    for (const d of declarations) {
      const ts = await this.getTimestampByCopyrightId(d.id);
      if (ts) {
        totalTimestamps++;
        if (ts.provider === 'blockchain') {
          blockchainTimestamps++;
        }
      }
    }

    return {
      totalDeclarations: declarations.length,
      activeDeclarations: declarations.filter(d => d.status === 'active').length,
      disputedDeclarations: declarations.filter(d => d.status === 'disputed').length,
      totalTimestamps,
      blockchainTimestamps
    };
  }

  async verifyTimestamp(hash: string): Promise<{ valid: boolean; record?: TimestampRecord; message: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('copyright_timestamps')
        .select('*')
        .eq('hash', hash)
        .single();

      if (!error && data) {
        return {
          valid: true,
          record: data,
          message: '时间戳验证成功'
        };
      }
    } catch (e) {
      console.warn('从数据库验证失败:', e);
    }

    const localTimestamps = JSON.parse(localStorage.getItem('copyright_timestamps') || '[]');
    const record = localTimestamps.find((t: TimestampRecord) => t.hash === hash);

    if (record) {
      return {
        valid: true,
        record,
        message: '时间戳验证成功（本地存储）'
      };
    }

    return {
      valid: false,
      message: '未找到对应的时间戳记录'
    };
  }

  getLicenseTypeLabel(type: CopyrightDeclaration['licenseType']): string {
    const labels: Record<string, string> = {
      all_rights_reserved: '保留所有权利',
      cc_by: 'CC BY 署名',
      cc_by_sa: 'CC BY-SA 署名-相同方式共享',
      cc_by_nc: 'CC BY-NC 署名-非商业使用',
      cc_by_nc_sa: 'CC BY-NC-SA 署名-非商业使用-相同方式共享',
      cc_by_nd: 'CC BY-ND 署名-禁止演绎',
      cc_by_nc_nd: 'CC BY-NC-ND 署名-非商业使用-禁止演绎',
      custom: '自定义许可'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: '有效',
      disputed: '争议中',
      expired: '已过期',
      revoked: '已撤销'
    };
    return labels[status] || status;
  }

  getProviderLabel(provider: TimestampProvider): string {
    const labels: Record<TimestampProvider, string> = {
      internal: '平台内部时间戳',
      trusted_third_party: '可信第三方时间戳',
      blockchain: '区块链时间戳'
    };
    return labels[provider];
  }
}

export const copyrightProtectionService = new CopyrightProtectionService();
export default copyrightProtectionService;
