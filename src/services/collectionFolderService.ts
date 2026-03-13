import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CollectionType } from './collectionService';
import {
  CollectionFolder,
  CollectionFolderItem,
  FolderVisibility,
  CreateFolderData,
  UpdateFolderData,
  AddToFolderData,
  MoveItemData,
  FolderStats,
  FolderShareInfo,
  PublicFolderView,
  FolderWithItems,
} from '@/types/collectionFolder';

async function getCurrentUserId(): Promise<string | null> {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id) {
        return String(user.id);
      }
    } catch {}
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return user.id;
    }
  } catch {}

  return null;
}

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getFolders(): Promise<CollectionFolder[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('collection_folders')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        console.warn('collection_folders table does not exist');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('获取收藏夹列表失败:', error);
    return [];
  }
}

export async function getFolderById(folderId: string): Promise<FolderWithItems | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return null;
    }

    const { data: folder, error: folderError } = await supabase
      .from('collection_folders')
      .select('*')
      .eq('id', folderId)
      .eq('user_id', userId)
      .single();

    if (folderError) {
      throw folderError;
    }

    const { data: items, error: itemsError } = await supabase
      .from('collection_folder_items')
      .select('*')
      .eq('folder_id', folderId)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    return {
      ...folder,
      items: items || [],
    };
  } catch (error) {
    console.error('获取收藏夹详情失败:', error);
    return null;
  }
}

export async function createFolder(data: CreateFolderData): Promise<CollectionFolder | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return null;
    }

    const { data: existingFolders } = await supabase
      .from('collection_folders')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = (existingFolders?.[0]?.sort_order || 0) + 1;

    const { data: folder, error } = await supabase
      .from('collection_folders')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description,
        cover_image: data.cover_image,
        visibility: data.visibility || FolderVisibility.PRIVATE,
        sort_order: nextSortOrder,
        item_count: 0,
        view_count: 0,
        share_code: generateShareCode(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        toast.error('收藏夹功能暂未开通，请联系管理员');
        return null;
      }
      throw error;
    }

    toast.success('收藏夹创建成功');
    return folder;
  } catch (error) {
    console.error('创建收藏夹失败:', error);
    toast.error('创建收藏夹失败');
    return null;
  }
}

export async function updateFolder(folderId: string, data: UpdateFolderData): Promise<CollectionFolder | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return null;
    }

    const { data: folder, error } = await supabase
      .from('collection_folders')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    toast.success('收藏夹更新成功');
    return folder;
  } catch (error) {
    console.error('更新收藏夹失败:', error);
    toast.error('更新收藏夹失败');
    return null;
  }
}

export async function deleteFolder(folderId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    await supabase
      .from('collection_folder_items')
      .delete()
      .eq('folder_id', folderId);

    const { error } = await supabase
      .from('collection_folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    toast.success('收藏夹已删除');
    return true;
  } catch (error) {
    console.error('删除收藏夹失败:', error);
    toast.error('删除收藏夹失败');
    return false;
  }
}

export async function reorderFolders(folderIds: string[]): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return false;
    }

    const updates = folderIds.map((id, index) => ({
      id,
      sort_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('collection_folders')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('user_id', userId);
    }

    return true;
  } catch (error) {
    console.error('重排序收藏夹失败:', error);
    toast.error('排序失败');
    return false;
  }
}

export async function addToFolder(data: AddToFolderData): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    const { data: existingItems } = await supabase
      .from('collection_folder_items')
      .select('sort_order')
      .eq('folder_id', data.folder_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = (existingItems?.[0]?.sort_order || 0) + 1;

    const { error } = await supabase
      .from('collection_folder_items')
      .insert({
        folder_id: data.folder_id,
        item_id: data.item_id,
        item_type: data.item_type,
        sort_order: nextSortOrder,
      });

    if (error) {
      if (error.code === '23505') {
        toast.warning('该作品已在收藏夹中');
        return false;
      }
      throw error;
    }

    await supabase.rpc('increment_folder_item_count', { folder_id: data.folder_id }).catch(() => {
      return supabase
        .from('collection_folders')
        .update({ item_count: (existingItems?.[0]?.sort_order || 0) + 1 })
        .eq('id', data.folder_id);
    });

    toast.success('已添加到收藏夹');
    return true;
  } catch (error) {
    console.error('添加到收藏夹失败:', error);
    toast.error('添加失败');
    return false;
  }
}

export async function removeFromFolder(folderId: string, itemId: string, itemType: CollectionType): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    const { error } = await supabase
      .from('collection_folder_items')
      .delete()
      .eq('folder_id', folderId)
      .eq('item_id', itemId)
      .eq('item_type', itemType);

    if (error) {
      throw error;
    }

    await supabase.rpc('decrement_folder_item_count', { folder_id: folderId }).catch(() => {});

    toast.success('已从收藏夹移除');
    return true;
  } catch (error) {
    console.error('从收藏夹移除失败:', error);
    toast.error('移除失败');
    return false;
  }
}

export async function moveItem(data: MoveItemData): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    const { error: deleteError } = await supabase
      .from('collection_folder_items')
      .delete()
      .eq('folder_id', data.source_folder_id)
      .eq('item_id', data.item_id)
      .eq('item_type', data.item_type);

    if (deleteError) {
      throw deleteError;
    }

    const { data: existingItems } = await supabase
      .from('collection_folder_items')
      .select('sort_order')
      .eq('folder_id', data.target_folder_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = (existingItems?.[0]?.sort_order || 0) + 1;

    const { error: insertError } = await supabase
      .from('collection_folder_items')
      .insert({
        folder_id: data.target_folder_id,
        item_id: data.item_id,
        item_type: data.item_type,
        sort_order: nextSortOrder,
      });

    if (insertError) {
      throw insertError;
    }

    toast.success('作品已移动');
    return true;
  } catch (error) {
    console.error('移动作品失败:', error);
    toast.error('移动失败');
    return false;
  }
}

export async function batchAddToFolder(folderId: string, items: Array<{ id: string; type: CollectionType }>): Promise<number> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return 0;
    }

    const { data: existingItems } = await supabase
      .from('collection_folder_items')
      .select('item_id, item_type, sort_order')
      .eq('folder_id', folderId)
      .order('sort_order', { ascending: false })
      .limit(1);

    let currentSortOrder = existingItems?.[0]?.sort_order || 0;
    const existingSet = new Set(
      (existingItems || []).map(item => `${item.item_id}-${item.item_type}`)
    );

    const itemsToInsert = items
      .filter(item => !existingSet.has(`${item.id}-${item.type}`))
      .map(item => ({
        folder_id: folderId,
        item_id: item.id,
        item_type: item.type,
        sort_order: ++currentSortOrder,
      }));

    if (itemsToInsert.length === 0) {
      toast.info('所选作品已在收藏夹中');
      return 0;
    }

    const { error } = await supabase
      .from('collection_folder_items')
      .insert(itemsToInsert);

    if (error) {
      throw error;
    }

    toast.success(`已添加 ${itemsToInsert.length} 个作品到收藏夹`);
    return itemsToInsert.length;
  } catch (error) {
    console.error('批量添加失败:', error);
    toast.error('批量添加失败');
    return 0;
  }
}

export async function getFolderStats(): Promise<FolderStats> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        total_folders: 0,
        total_items: 0,
        public_folders: 0,
        total_views: 0,
      };
    }

    const { data: folders, error } = await supabase
      .from('collection_folders')
      .select('id, visibility, item_count, view_count')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return {
      total_folders: folders?.length || 0,
      total_items: folders?.reduce((sum, f) => sum + (f.item_count || 0), 0) || 0,
      public_folders: folders?.filter(f => f.visibility === FolderVisibility.PUBLIC).length || 0,
      total_views: folders?.reduce((sum, f) => sum + (f.view_count || 0), 0) || 0,
    };
  } catch (error) {
    console.error('获取收藏夹统计失败:', error);
    return {
      total_folders: 0,
      total_items: 0,
      public_folders: 0,
      total_views: 0,
    };
  }
}

export async function getShareInfo(folderId: string): Promise<FolderShareInfo | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return null;
    }

    const { data: folder, error } = await supabase
      .from('collection_folders')
      .select('id, name, item_count, share_code, visibility')
      .eq('id', folderId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (!folder.share_code) {
      const newShareCode = generateShareCode();
      await supabase
        .from('collection_folders')
        .update({ share_code: newShareCode, visibility: FolderVisibility.PUBLIC })
        .eq('id', folderId);

      folder.share_code = newShareCode;
    }

    const baseUrl = window.location.origin;
    return {
      share_code: folder.share_code,
      share_url: `${baseUrl}/collection/${folder.share_code}`,
      folder_name: folder.name,
      item_count: folder.item_count,
    };
  } catch (error) {
    console.error('获取分享信息失败:', error);
    return null;
  }
}

export async function getPublicFolder(shareCode: string): Promise<PublicFolderView | null> {
  try {
    const { data: folder, error: folderError } = await supabase
      .from('collection_folders')
      .select(`
        id,
        user_id,
        name,
        description,
        cover_image,
        visibility,
        item_count,
        view_count,
        share_code,
        created_at,
        updated_at
      `)
      .eq('share_code', shareCode)
      .eq('visibility', FolderVisibility.PUBLIC)
      .single();

    if (folderError || !folder) {
      return null;
    }

    await supabase
      .from('collection_folders')
      .update({ view_count: (folder.view_count || 0) + 1 })
      .eq('id', folder.id);

    const { data: items, error: itemsError } = await supabase
      .from('collection_folder_items')
      .select('id, item_id, item_type, sort_order, created_at')
      .eq('folder_id', folder.id)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      console.error('获取收藏夹内容失败:', itemsError);
    }

    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .eq('id', folder.user_id)
      .single();

    return {
      ...folder,
      items: items || [],
      owner: owner || { id: folder.user_id, username: '未知用户' },
    };
  } catch (error) {
    console.error('获取公开收藏夹失败:', error);
    return null;
  }
}

export async function toggleFolderVisibility(folderId: string): Promise<FolderVisibility | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return null;
    }

    const { data: folder, error: fetchError } = await supabase
      .from('collection_folders')
      .select('visibility')
      .eq('id', folderId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const newVisibility = folder.visibility === FolderVisibility.PUBLIC
      ? FolderVisibility.PRIVATE
      : FolderVisibility.PUBLIC;

    const { error } = await supabase
      .from('collection_folders')
      .update({ visibility: newVisibility, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    toast.success(newVisibility === FolderVisibility.PUBLIC ? '已设为公开' : '已设为私有');
    return newVisibility;
  } catch (error) {
    console.error('切换可见性失败:', error);
    toast.error('操作失败');
    return null;
  }
}

export const collectionFolderService = {
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  reorderFolders,
  addToFolder,
  removeFromFolder,
  moveItem,
  batchAddToFolder,
  getFolderStats,
  getShareInfo,
  getPublicFolder,
  toggleFolderVisibility,
};

export default collectionFolderService;
