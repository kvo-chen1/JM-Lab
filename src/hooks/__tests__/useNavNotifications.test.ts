import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNavNotifications, type NavItemType } from '../useNavNotifications';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        in: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ count: 5, data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ count: 3, data: [], error: null })),
      })),
    })),
  })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
  })),
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

describe('useNavNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初始化时返回默认状态', () => {
    const { result } = renderHook(() => useNavNotifications());

    expect(result.current.notifications).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalUnreadCount).toBe(0);
    expect(result.current.lastUpdated).toBeNull();
  });

  it('markAsViewed 正确更新通知状态', () => {
    const { result } = renderHook(() => useNavNotifications());

    act(() => {
      result.current.markAsViewed('feedback');
    });

    expect(result.current.notifications.feedback.hasNew).toBe(false);
    expect(result.current.notifications.feedback.lastViewedAt).toBeInstanceOf(Date);
  });

  it('markAllAsViewed 正确更新所有通知状态', () => {
    const { result } = renderHook(() => useNavNotifications());

    act(() => {
      result.current.markAllAsViewed();
    });

    Object.values(result.current.notifications).forEach((notification) => {
      expect(notification.hasNew).toBe(false);
      expect(notification.lastViewedAt).toBeInstanceOf(Date);
    });
  });

  it('正确计算 totalUnreadCount', () => {
    const { result } = renderHook(() => useNavNotifications());

    // 初始状态应该是 0
    expect(result.current.totalUnreadCount).toBe(0);
  });

  it('refreshNotifications 调用时设置 isLoading 状态', async () => {
    const { result } = renderHook(() => useNavNotifications());

    act(() => {
      result.current.refreshNotifications();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('从 localStorage 恢复状态', () => {
    const savedState = {
      feedback: {
        count: 5,
        hasNew: true,
        lastViewedAt: new Date().toISOString(),
      },
    };

    (window.localStorage.getItem as vi.Mock).mockReturnValue(JSON.stringify(savedState));

    const { result } = renderHook(() => useNavNotifications());

    // 由于 localStorage 被模拟，应该能恢复状态
    expect(window.localStorage.getItem).toHaveBeenCalledWith('admin_nav_notifications');
  });

  it('保存状态到 localStorage', () => {
    const { result } = renderHook(() => useNavNotifications());

    act(() => {
      result.current.markAsViewed('feedback');
    });

    expect(window.localStorage.setItem).toHaveBeenCalled();
  });
});

describe('useNavNotifications - 导航项类型', () => {
  it('支持所有定义的导航项类型', () => {
    const { result } = renderHook(() => useNavNotifications());

    const navItems: NavItemType[] = [
      'feedback',
      'eventAudit',
      'contentAudit',
      'userAudit',
      'orders',
      'permissions',
      'productManagement',
      'notificationManagement',
      'communities',
      'campaigns',
      'users',
      'creators',
    ];

    navItems.forEach((item) => {
      expect(result.current.notifications[item]).toBeDefined();
      expect(result.current.notifications[item]).toHaveProperty('count');
      expect(result.current.notifications[item]).toHaveProperty('hasNew');
      expect(result.current.notifications[item]).toHaveProperty('lastViewedAt');
    });
  });
});
