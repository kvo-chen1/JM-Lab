import { supabase } from '@/lib/supabaseClient';
import type {
  Notification,
  NotificationBatchOperation,
  NotificationFilterOptions,
  NotificationSettings,
  NotificationCategory,
  NotificationType,
  NotificationPriority
} from '../types/notification';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../types/notification';

const SETTINGS_STORAGE_KEY = 'notification_settings';

export async function batchMarkAsRead(
  notificationIds: string[],
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (notificationIds.length === 0) {
      return { success: true, count: 0 };
    }

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: Math.floor(Date.now() / 1000)
      })
      .in('id', notificationIds)
      .eq('user_id', userId);

    if (error) {
      console.error('Batch mark as read error:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: notificationIds.length };
  } catch (error) {
    console.error('Batch mark as read error:', error);
    return { success: false, count: 0, error: String(error) };
  }
}

export async function batchMarkAsUnread(
  notificationIds: string[],
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (notificationIds.length === 0) {
      return { success: true, count: 0 };
    }

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: false,
        read_at: null
      })
      .in('id', notificationIds)
      .eq('user_id', userId);

    if (error) {
      console.error('Batch mark as unread error:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: notificationIds.length };
  } catch (error) {
    console.error('Batch mark as unread error:', error);
    return { success: false, count: 0, error: String(error) };
  }
}

export async function batchArchive(
  notificationIds: string[],
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (notificationIds.length === 0) {
      return { success: true, count: 0 };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'archived' })
      .in('id', notificationIds)
      .eq('user_id', userId);

    if (error) {
      console.error('Batch archive error:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: notificationIds.length };
  } catch (error) {
    console.error('Batch archive error:', error);
    return { success: false, count: 0, error: String(error) };
  }
}

export async function batchDelete(
  notificationIds: string[],
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (notificationIds.length === 0) {
      return { success: true, count: 0 };
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .eq('user_id', userId);

    if (error) {
      console.error('Batch delete error:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: notificationIds.length };
  } catch (error) {
    console.error('Batch delete error:', error);
    return { success: false, count: 0, error: String(error) };
  }
}

export async function executeBatchOperation(
  operation: NotificationBatchOperation,
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  const { operation: op, notificationIds, filters } = operation;

  let ids = notificationIds;

  if (filters && notificationIds.length === 0) {
    const filteredIds = await getFilteredNotificationIds(filters, userId);
    ids = filteredIds;
  }

  switch (op) {
    case 'mark_read':
      return batchMarkAsRead(ids, userId);
    case 'mark_unread':
      return batchMarkAsUnread(ids, userId);
    case 'archive':
      return batchArchive(ids, userId);
    case 'delete':
      return batchDelete(ids, userId);
    default:
      return { success: false, count: 0, error: 'Unknown operation' };
  }
}

async function getFilteredNotificationIds(
  filters: NotificationFilterOptions,
  userId: string
): Promise<string[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId);

    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories);
    }

    if (filters.types && filters.types.length > 0) {
      query = query.in('type', filters.types);
    }

    if (filters.priorities && filters.priorities.length > 0) {
      query = query.in('priority', filters.priorities);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get filtered notification ids error:', error);
      return [];
    }

    return (data || []).map(item => item.id);
  } catch (error) {
    console.error('Get filtered notification ids error:', error);
    return [];
  }
}

export async function markAllAsReadByCategory(
  category: NotificationCategory,
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  return executeBatchOperation(
    {
      operation: 'mark_read',
      notificationIds: [],
      filters: { categories: [category], unreadOnly: true }
    },
    userId
  );
}

export async function markAllAsReadByType(
  type: NotificationType,
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  return executeBatchOperation(
    {
      operation: 'mark_read',
      notificationIds: [],
      filters: { types: [type], unreadOnly: true }
    },
    userId
  );
}

export async function deleteAllRead(
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  return executeBatchOperation(
    {
      operation: 'delete',
      notificationIds: [],
      filters: { status: ['read'] }
    },
    userId
  );
}

export async function deleteAllByCategory(
  category: NotificationCategory,
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  return executeBatchOperation(
    {
      operation: 'delete',
      notificationIds: [],
      filters: { categories: [category] }
    },
    userId
  );
}

export function loadSettingsFromStorage(): NotificationSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...parsed,
        categories: {
          ...DEFAULT_NOTIFICATION_SETTINGS.categories,
          ...(parsed.categories || {})
        },
        types: {
          ...DEFAULT_NOTIFICATION_SETTINGS.types,
          ...(parsed.types || {})
        },
        priorities: {
          ...DEFAULT_NOTIFICATION_SETTINGS.priorities,
          ...(parsed.priorities || {})
        }
      };
    }
  } catch (error) {
    console.error('Load settings error:', error);
  }
  return { ...DEFAULT_NOTIFICATION_SETTINGS };
}

export function saveSettingsToStorage(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Save settings error:', error);
  }
}

export async function loadSettingsFromDB(userId: string): Promise<NotificationSettings> {
  try {
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return loadSettingsFromStorage();
      }
      console.error('Load settings from DB error:', error);
      return loadSettingsFromStorage();
    }

    if (data) {
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...data.settings,
        categories: {
          ...DEFAULT_NOTIFICATION_SETTINGS.categories,
          ...(data.settings?.categories || {})
        },
        types: {
          ...DEFAULT_NOTIFICATION_SETTINGS.types,
          ...(data.settings?.types || {})
        },
        priorities: {
          ...DEFAULT_NOTIFICATION_SETTINGS.priorities,
          ...(data.settings?.priorities || {})
        }
      };
    }

    return loadSettingsFromStorage();
  } catch (error) {
    console.error('Load settings from DB error:', error);
    return loadSettingsFromStorage();
  }
}

export async function saveSettingsToDB(
  userId: string,
  settings: NotificationSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    saveSettingsToStorage(settings);

    const { error } = await supabase
      .from('user_notification_settings')
      .upsert(
        {
          user_id: userId,
          settings,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Save settings to DB error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Save settings to DB error:', error);
    return { success: false, error: String(error) };
  }
}

export function isInQuietHours(settings: NotificationSettings): boolean {
  if (!settings.quietHoursEnabled || !settings.quietHoursStart || !settings.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes > endMinutes) {
    return currentTime >= startMinutes || currentTime < endMinutes;
  } else {
    return currentTime >= startMinutes && currentTime < endMinutes;
  }
}

export function shouldNotify(
  type: NotificationType,
  priority: NotificationPriority,
  settings: NotificationSettings
): { sound: boolean; desktop: boolean; push: boolean } {
  if (!settings.enabled) {
    return { sound: false, desktop: false, push: false };
  }

  if (isInQuietHours(settings) && priority !== 'urgent') {
    return { sound: false, desktop: false, push: false };
  }

  const typeEnabled = settings.types[type] !== false;
  const priorityEnabled = settings.priorities[priority] !== false;

  if (!typeEnabled || !priorityEnabled) {
    return { sound: false, desktop: false, push: false };
  }

  return {
    sound: settings.soundEnabled,
    desktop: settings.desktopEnabled,
    push: settings.pushEnabled
  };
}

export function updateCategorySetting(
  settings: NotificationSettings,
  category: NotificationCategory,
  enabled: boolean
): NotificationSettings {
  const categoryConfig = Object.values(
    require('../types/notification').NOTIFICATION_CATEGORIES
  ).find((c: any) => c.category === category);

  if (!categoryConfig) return settings;

  const newTypes = { ...settings.types };
  
  if (!categoryConfig.canDisable && !enabled) {
    return settings;
  }

  for (const type of categoryConfig.types) {
    if (categoryConfig.canDisable || enabled) {
      newTypes[type] = enabled;
    }
  }

  return {
    ...settings,
    categories: {
      ...settings.categories,
      [category]: enabled
    },
    types: newTypes
  };
}

export function updateTypeSetting(
  settings: NotificationSettings,
  type: NotificationType,
  enabled: boolean
): NotificationSettings {
  const typeConfig = require('../types/notification').NOTIFICATION_TYPES[type];
  
  if (!typeConfig) return settings;

  const categoryConfig = Object.values(
    require('../types/notification').NOTIFICATION_CATEGORIES
  ).find((c: any) => c.category === typeConfig.category);

  if (categoryConfig && !categoryConfig.canDisable && !enabled) {
    return settings;
  }

  return {
    ...settings,
    types: {
      ...settings.types,
      [type]: enabled
    }
  };
}

export const notificationBatchService = {
  batchMarkAsRead,
  batchMarkAsUnread,
  batchArchive,
  batchDelete,
  executeBatchOperation,
  markAllAsReadByCategory,
  markAllAsReadByType,
  deleteAllRead,
  deleteAllByCategory,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  loadSettingsFromDB,
  saveSettingsToDB,
  isInQuietHours,
  shouldNotify,
  updateCategorySetting,
  updateTypeSetting
};

export default notificationBatchService;
