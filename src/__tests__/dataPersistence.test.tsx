import * as React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../contexts/authContext';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../lib/apiClient', () => ({
  __esModule: true,
  apiClient: {
    get: jest.fn().mockResolvedValue({ ok: true, data: null }),
    post: jest.fn(),
  },
}));

jest.mock('../services/securityService', () => ({
  __esModule: true,
  default: {
    getSecureItem: jest.fn().mockResolvedValue(null),
    setSecureItem: jest.fn().mockResolvedValue(undefined),
    encrypt: jest.fn(() => ({ data: 'encrypted', timestamp: Date.now(), signature: 'mock-signature' })),
    decrypt: jest.fn(() => ({})),
    generateSignature: jest.fn(() => 'mock-signature'),
    verifyDataIntegrity: jest.fn(() => true),
    detectCheating: jest.fn(() => false),
    cleanupExpiredCache: jest.fn(() => {}),
    generateUUID: jest.fn(() => 'mock-uuid'),
    isValidUUID: jest.fn(() => true),
  },
}));

describe('Data Persistence', () => {
  const TestComponent = () => {
    const authContext = React.useContext(AuthContext);
    return (
      <div>
        <div data-testid="is-authenticated">{authContext.isAuthenticated ? 'true' : 'false'}</div>
        <div data-testid="user">{authContext.user ? authContext.user.username : 'null'}</div>
        <div data-testid="membership-level">{authContext.user ? authContext.user.membershipLevel : 'null'}</div>
        <button 
          data-testid="login-btn" 
          onClick={async () => {
            await authContext.login('test@example.com', 'password123');
          }}
        >
          Login
        </button>
        <button 
          data-testid="register-btn" 
          onClick={async () => {
            await authContext.register('testuser', 'test@example.com', 'password123');
          }}
        >
          Register
        </button>
        <button 
          data-testid="logout-btn" 
          onClick={() => authContext.logout()}
        >
          Logout
        </button>
        <button 
          data-testid="update-user-btn" 
          onClick={() => {
            authContext.updateUser({
              username: 'updateduser',
              membershipLevel: 'premium',
              membershipStatus: 'active',
            });
          }}
        >
          Update User
        </button>
      </div>
    );
  };

  beforeEach(() => {
    cleanup(); // 清除之前的组件实例
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should persist user authentication state across page reloads', async () => {
    // 首次渲染并登录
    render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    // 登录
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // 验证localStorage已保存认证状态
    expect(localStorage.getItem('token')).toContain('mock-token');
    expect(localStorage.getItem('isAuthenticated')).toBe('true');
    expect(localStorage.getItem('user')).not.toBeNull();
  });

  test('should persist user information across page reloads', async () => {
    // 首次渲染并登录
    render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    // 登录
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // 更新用户信息
    fireEvent.click(screen.getByTestId('update-user-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('updateduser');
      expect(screen.getByTestId('membership-level')).toHaveTextContent('premium');
    });

    // 验证localStorage已保存更新后的用户信息
    const userData = localStorage.getItem('user');
    expect(userData).not.toBeNull();
    if (userData) {
      const parsedUser = JSON.parse(userData);
      expect(parsedUser.username).toBe('updateduser');
      expect(parsedUser.membershipLevel).toBe('premium');
    }
  });

  test('should correctly clear user data on logout', async () => {
    // 首次渲染并登录
    render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    // 登录
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // 登出
    fireEvent.click(screen.getByTestId('logout-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    // 验证localStorage已清除
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('isAuthenticated')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('should handle register and persist user data', async () => {
    // 首次渲染并注册
    render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    // 注册
    fireEvent.click(screen.getByTestId('register-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });

    // 验证localStorage已保存注册信息
    expect(localStorage.getItem('token')).toContain('mock-token');
    expect(localStorage.getItem('isAuthenticated')).toBe('true');
    const userData = localStorage.getItem('user');
    expect(userData).not.toBeNull();
    if (userData) {
      const parsedUser = JSON.parse(userData);
      expect(parsedUser.username).toBe('testuser');
      expect(parsedUser.email).toBe('test@example.com');
    }
  });

  test('should persist quick login state', async () => {
    // 测试组件中添加快速登录按钮
    const QuickLoginTestComponent = () => {
      const authContext = React.useContext(AuthContext);
      return (
        <div>
          <div data-testid="is-authenticated">{authContext.isAuthenticated ? 'true' : 'false'}</div>
          <div data-testid="user">{authContext.user ? authContext.user.username : 'null'}</div>
          <button 
            data-testid="quick-login-btn" 
            onClick={() => authContext.quickLogin('wechat')}
          >
            Quick Login
          </button>
        </div>
      );
    };

    // 首次渲染并快速登录
    render(
      <Router>
        <AuthProvider>
          <QuickLoginTestComponent />
        </AuthProvider>
      </Router>
    );

    // 快速登录
    fireEvent.click(screen.getByTestId('quick-login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('微信用户');
    });

    // 验证localStorage已保存快速登录信息
    expect(localStorage.getItem('token')).toContain('mock-token');
    expect(localStorage.getItem('isAuthenticated')).toBe('true');
    const userData = localStorage.getItem('user');
    expect(userData).not.toBeNull();
    if (userData) {
      const parsedUser = JSON.parse(userData);
      expect(parsedUser.username).toBe('微信用户');
    }
  });

  test('should handle membership updates and persist', async () => {
    // 测试组件中添加更新会员按钮
    const MembershipTestComponent = () => {
      const authContext = React.useContext(AuthContext);
      return (
        <div>
          <div data-testid="is-authenticated">{authContext.isAuthenticated ? 'true' : 'false'}</div>
          <div data-testid="membership-level">{authContext.user ? authContext.user.membershipLevel : 'null'}</div>
          <div data-testid="membership-status">{authContext.user ? authContext.user.membershipStatus : 'null'}</div>
          <button 
            data-testid="update-membership-btn" 
            onClick={async () => {
              await authContext.updateMembership({
                membershipLevel: 'vip',
                membershipStatus: 'active',
                membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后过期
              });
            }}
          >
            Update Membership
          </button>
        </div>
      );
    };

    // 先设置localStorage为已登录状态
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      membershipLevel: 'free',
      membershipStatus: 'active',
    }));

    // 渲染组件
    render(
      <Router>
        <AuthProvider>
          <MembershipTestComponent />
        </AuthProvider>
      </Router>
    );

    // 更新会员信息
    fireEvent.click(screen.getByTestId('update-membership-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('membership-level')).toHaveTextContent('vip');
    });

    // 验证localStorage已保存更新后的会员信息
    const userData = localStorage.getItem('user');
    expect(userData).not.toBeNull();
    if (userData) {
      const parsedUser = JSON.parse(userData);
      expect(parsedUser.membershipLevel).toBe('vip');
      expect(parsedUser.membershipStatus).toBe('active');
    }
  });
});
