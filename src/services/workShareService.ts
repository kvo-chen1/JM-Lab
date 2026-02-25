// 作品分享服务 - 处理作品分享相关的私信功能
import { supabase } from '../lib/supabase';
import { sendDirectMessage } from './messageService';

export interface WorkShareData {
  senderId: string;
  receiverId: string;
  workId: string;
  workTitle: string;
  workThumbnail?: string;
  workUrl?: string;  // 视频/音频的实际播放URL
  workType?: string;
  message?: string;
}

export interface WorkShareResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * 生成作品分享消息内容（使用 JSON 格式便于解析）
 */
function generateWorkShareMessage(data: WorkShareData): string {
  // 使用特殊标记的 JSON 格式，便于在消息列表中识别和渲染
  const shareContent = {
    type: 'work_share',
    workId: data.workId,
    workTitle: data.workTitle,
    workThumbnail: data.workThumbnail,
    workUrl: data.workUrl,  // 视频/音频播放URL
    workType: data.workType || 'image',
    message: data.message,
  };
  
  // 使用特殊前缀标记，便于识别
  return `[WORK_SHARE]${JSON.stringify(shareContent)}[/WORK_SHARE]`;
}

/**
 * 发送作品分享私信
 */
export async function sendWorkShareMessage(data: WorkShareData): Promise<WorkShareResult> {
  try {
    console.log('[sendWorkShareMessage] 开始发送作品分享:', {
      senderId: data.senderId,
      receiverId: data.receiverId,
      workId: data.workId,
    });

    // 1. 验证用户关系（是否为好友）
    const { data: friendRelation, error: friendError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${data.senderId},receiver_id.eq.${data.receiverId}),and(sender_id.eq.${data.receiverId},receiver_id.eq.${data.senderId})`)
      .eq('status', 'accepted')
      .single();

    if (friendError || !friendRelation) {
      console.warn('[sendWorkShareMessage] 用户不是好友关系，但仍允许发送');
      // 不阻止发送，因为平台可能允许给非好友发送私信
    }

    // 2. 验证作品存在且可访问
    const { data: workData, error: workError } = await supabase
      .from('works')
      .select('id, title, status, creator_id')
      .eq('id', data.workId)
      .single();

    if (workError) {
      console.error('[sendWorkShareMessage] 作品不存在:', workError);
      return {
        success: false,
        message: '作品不存在或已被删除',
      };
    }

    // 检查作品状态
    if (workData.status === 'draft' && workData.creator_id !== data.senderId) {
      return {
        success: false,
        message: '无法分享草稿状态的作品',
      };
    }

    // 3. 生成分享消息内容
    const messageContent = generateWorkShareMessage(data);

    // 4. 保存分享记录到数据库
    const { data: shareRecord, error: shareError } = await supabase
      .from('work_shares')
      .insert({
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        work_id: data.workId,
        work_title: data.workTitle,
        work_thumbnail: data.workThumbnail,
        work_type: data.workType,
        message: data.message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (shareError) {
      console.error('[sendWorkShareMessage] 保存分享记录失败:', shareError);
      // 继续发送私信，不因为记录保存失败而阻止
    }

    // 5. 发送私信
    const messageResult = await sendDirectMessage(
      data.senderId,
      data.receiverId,
      messageContent
    );

    if (!messageResult.success) {
      return {
        success: false,
        message: messageResult.message || '发送私信失败',
      };
    }

    console.log('[sendWorkShareMessage] 作品分享成功:', {
      shareId: shareRecord?.id,
      messageId: messageResult.data?.id,
    });

    return {
      success: true,
      data: {
        shareRecord,
        message: messageResult.data,
      },
    };
  } catch (error) {
    console.error('[sendWorkShareMessage] 发送作品分享失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '发送失败，请重试',
    };
  }
}

/**
 * 获取收到的作品分享列表
 */
export async function getReceivedWorkShares(userId: string, limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('work_shares')
      .select(`
        *,
        sender:profiles!work_shares_sender_id_fkey(username, avatar_url)
      `)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getReceivedWorkShares] 获取失败:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getReceivedWorkShares] 异常:', error);
    return [];
  }
}

/**
 * 获取发送的作品分享列表
 */
export async function getSentWorkShares(userId: string, limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('work_shares')
      .select(`
        *,
        receiver:profiles!work_shares_receiver_id_fkey(username, avatar_url)
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getSentWorkShares] 获取失败:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getSentWorkShares] 异常:', error);
    return [];
  }
}

/**
 * 标记作品分享为已读
 */
export async function markWorkShareAsRead(shareId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('work_shares')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', shareId)
      .eq('receiver_id', userId);

    if (error) {
      console.error('[markWorkShareAsRead] 标记失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[markWorkShareAsRead] 异常:', error);
    return false;
  }
}

/**
 * 获取未读作品分享数量
 */
export async function getUnreadWorkShareCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('work_shares')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('[getUnreadWorkShareCount] 获取失败:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[getUnreadWorkShareCount] 异常:', error);
    return 0;
  }
}

/**
 * 解析作品分享消息
 */
export function parseWorkShareMessage(content: string): { isWorkShare: boolean; data?: any } {
  const match = content.match(/\[WORK_SHARE\](.*?)\[\/WORK_SHARE\]/s);
  if (match) {
    try {
        const data = JSON.parse(match[1]);
        return { isWorkShare: true, data };
      } catch (e) {
        console.error('解析作品分享消息失败:', e);
      }
  }
  return { isWorkShare: false };
}

/**
 * 删除作品分享记录
 */
export async function deleteWorkShare(shareId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('work_shares')
      .delete()
      .eq('id', shareId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) {
      console.error('[deleteWorkShare] 删除失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[deleteWorkShare] 异常:', error);
    return false;
  }
}
