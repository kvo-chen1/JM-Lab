/**
 * 用户数据同步服务测试
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { userSyncService } from '../userSyncService';

// Mock eventBus
jest.mock('@/lib/eventBus', () => ({
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  emit: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => this.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    this.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete this.store[key];
  }),
  clear: jest.fn(() => {
    this.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('UserSyncService', () => {
  beforeEach(() => {
    // 清空 mock 和存储
    localStorageMock.store = {};
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // 重置服务
    userSyncService.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初始化', () => {
    test('应该能正确初始化', () => {
      expect(() => userSyncService.init()).not.toThrow();
    });

    test('应该只初始化一次', () => {
      userSyncService.init();
      userSyncService.init();
      // 不应该抛出错误
    });
  });

  describe('setUser', () => {
    test('应该能设置用户数据', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData);
      expect(userSyncService.getUser()).toEqual(userData);
    });

    test('应该能保存用户数据到 localStorage', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData, { persist: true });
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('应该能设置 null 用户', () => {
      userSyncService.setUser(null);
      expect(userSyncService.getUser()).toBeNull();
    });
  });

  describe('getUser', () => {
    test('应该能获取当前用户', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData);
      expect(userSyncService.getUser()).toEqual(userData);
    });

    test('未设置用户时应该返回 null', () => {
      expect(userSyncService.getUser()).toBeNull();
    });
  });

  describe('getUserId', () => {
    test('应该能获取用户 ID', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData);
      expect(userSyncService.getUserId()).toBe('user-123');
    });

    test('未设置用户时应该返回 null', () => {
      expect(userSyncService.getUserId()).toBeNull();
    });
  });

  describe('updateUser', () => {
    test('应该能更新用户部分字段', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData);
      
      userSyncService.updateUser({ username: 'newusername' });
      
      const updated = userSyncService.getUser();
      expect(updated?.username).toBe('newusername');
      expect(updated?.id).toBe('user-123');
      expect(updated?.email).toBe('test@example.com');
    });

    test('应该添加 updated_at 时间戳', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData);
      userSyncService.updateUser({ username: 'newusername' });
      
      const updated = userSyncService.getUser();
      expect(updated?.updated_at).toBeDefined();
    });

    test('没有登录用户时不应该更新', () => {
      expect(() => userSyncService.updateUser({ username: 'new' })).not.toThrow();
    });
  });

  describe('clear', () => {
    test('应该能清空用户数据', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData);
      userSyncService.clear();
      
      expect(userSyncService.getUser()).toBeNull();
    });

    test('应该从 localStorage 移除数据', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData, { persist: true });
      userSyncService.clear();
      
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('loadFromStorage', () => {
    test('应该能从 localStorage 加载用户数据', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      localStorageMock.store['user_data'] = JSON.stringify(userData);
      
      // 重新初始化服务来触发加载
      userSyncService.init();
      
      expect(userSyncService.getUser()?.id).toBe('user-123');
    });

    test('应该忽略无效的存储数据', () => {
      localStorageMock.store['user_data'] = JSON.stringify({ invalid: 'data' });
      
      userSyncService.init();
      
      expect(userSyncService.getUser()).toBeNull();
    });
  });

  describe('refreshUser', () => {
    test('应该能刷新用户数据', async () => {
      const fetchUserFn = jest.fn().mockResolvedValue({
        id: 'user-123',
        username: 'updateduser',
        email: 'updated@example.com',
      });

      const result = await userSyncService.refreshUser(fetchUserFn);
      
      expect(result).toBe(true);
      expect(userSyncService.getUser()?.username).toBe('updateduser');
    });

    test('获取用户失败时应该返回 false', async () => {
      const fetchUserFn = jest.fn().mockResolvedValue(null);

      const result = await userSyncService.refreshUser(fetchUserFn);
      
      expect(result).toBe(false);
    });

    test('发生错误时应该返回 false', async () => {
      const fetchUserFn = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await userSyncService.refreshUser(fetchUserFn);
      
      expect(result).toBe(false);
    });
  });

  describe('forceSync', () => {
    test('应该能强制同步到服务器', async () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData);
      
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      await userSyncService.forceSync();
      
      expect(global.fetch).toHaveBeenCalled();
    });

    test('没有用户时不应该同步', async () => {
      await userSyncService.forceSync();
      // 不应该调用 fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('多标签页同步', () => {
    test('应该监听 storage 事件', () => {
      userSyncService.init();
      
      // 模拟 storage 事件
      const event = new StorageEvent('storage', {
        key: 'user_data',
        newValue: JSON.stringify({
          id: 'user-456',
          username: 'newuser',
          email: 'new@example.com',
        }),
      });

      window.dispatchEvent(event);
      
      // 用户数据应该被更新
      expect(userSyncService.getUser()?.id).toBe('user-456');
    });

    test('应该忽略相同用户的 storage 事件', () => {
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData);
      userSyncService.init();
      
      // 模拟相同用户的 storage 事件
      const event = new StorageEvent('storage', {
        key: 'user_data',
        newValue: JSON.stringify(userData),
      });

      window.dispatchEvent(event);
      
      // 不应该有变化
      expect(userSyncService.getUser()?.username).toBe('testuser');
    });
  });

  describe('事件监听', () => {
    test('应该能监听用户更新事件', () => {
      const callback = jest.fn();
      
      const unsubscribe = userSyncService.onUserUpdate(callback);
      userSyncService.init();
      
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      userSyncService.setUser(userData);
      
      expect(callback).toHaveBeenCalledWith(userData);
      
      unsubscribe();
    });

    test('应该能监听用户登出事件', () => {
      const callback = jest.fn();
      
      const unsubscribe = userSyncService.onUserLogout(callback);
      userSyncService.init();
      
      userSyncService.clear();
      
      expect(callback).toHaveBeenCalled();
      
      unsubscribe();
    });
  });
});
