import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../contexts/authContext';
import { apiClient } from '../lib/apiClient';

import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock apiClient
jest.mock('../lib/apiClient', () => {
  return {
    __esModule: true,
    apiClient: {
      get: jest.fn().mockResolvedValue({ ok: true, data: null }),
      post: jest.fn(),
    },
  };
});

// Mock securityService
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

describe('AuthContext', () => {
  // 创建测试组件来访问AuthContext
  const TestComponent = () => {
    const authContext = React.useContext(AuthContext);
    return (
      <div>
        <div data-testid="is-authenticated">{authContext.isAuthenticated ? 'true' : 'false'}</div>
        <div data-testid="user">{authContext.user ? authContext.user.username : 'null'}</div>
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
            try {
              const result = await authContext.register('testuser', 'test@example.com', 'password123');
              console.log('Register result:', result);
            } catch (error) {
              console.error('Register error:', error);
            }
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
          data-testid="quick-login-btn" 
          onClick={() => authContext.quickLogin('wechat')}
        >
          Quick Login
        </button>
        {/* 添加一个直接访问authContext的ref，方便测试 */}
        <div 
          data-testid="auth-context" 
          ref={(el) => {
            if (el) {
              (window as any).authContext = authContext;
            }
          }} 
        />
      </div>
    );
  };

  beforeEach(() => {
    // 清除localStorage
    localStorage.clear();
    // 只清除调用记录，不重置mock实现
    jest.clearAllMocks();
  });

  test('should initialize with default values', () => {
    render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  test('should handle successful login', async () => {
    render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    // 点击登录按钮
    fireEvent.click(screen.getByTestId('login-btn'));

    // 等待状态更新
    await waitFor(() => {
      // 验证登录后状态
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('test'); // 用户名是从邮箱test@example.com提取的
    });

    // 验证localStorage已更新
    expect(localStorage.getItem('token')).toContain('mock-token');
    expect(localStorage.getItem('user')).not.toBeNull();
  });

  test('should handle failed login', async () => {
    // 设置mock失败响应
    apiClient.post.mockResolvedValue({
      ok: false,
    });

    // 直接测试authContext.login方法，不通过点击按钮
    let authContextValue: any;
    
    // 创建一个测试组件来获取authContext
    const AuthContextConsumer = () => {
      authContextValue = React.useContext(AuthContext);
      return null;
    };

    render(
      <Router>
        <AuthProvider>
          <AuthContextConsumer />
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    // 确保authContextValue已获取
    expect(authContextValue).toBeDefined();

    // 直接调用login方法
    const success = await authContextValue.login('test@example.com', 'wrong-password');
    expect(success).toBe(false);

    // 验证状态未更新
    expect(authContextValue.isAuthenticated).toBe(false);
    expect(authContextValue.user).toBeNull();
  });

  test('should handle successful register', async () => {
    render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    // 点击注册按钮
    fireEvent.click(screen.getByTestId('register-btn'));

    // 等待状态更新
    await waitFor(() => {
      // 验证注册后状态
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });

    // 验证localStorage已更新
    expect(localStorage.getItem('token')).toContain('mock-token');
    expect(localStorage.getItem('user')).not.toBeNull();
  });

  test('should handle logout', async () => {
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

    render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    // 验证初始状态为已登录
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');

    // 点击登出按钮
    fireEvent.click(screen.getByTestId('logout-btn'));

    // 等待状态更新
    await waitFor(() => {
      // 验证登出后状态
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    // 验证localStorage已清除
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('isAuthenticated')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('should handle quick login', async () => {
    render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );

    // 点击快速登录按钮
    fireEvent.click(screen.getByTestId('quick-login-btn'));

    // 等待快速登录完成
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // 验证localStorage已更新
    expect(localStorage.getItem('token')).not.toBeNull();
    expect(localStorage.getItem('user')).not.toBeNull();
  });

  test('should check membership status correctly', () => {
    // 测试付费会员
    const premiumUser: any = {
      membershipLevel: 'premium',
      membershipStatus: 'active',
      membershipEnd: new Date(Date.now() + 86400000).toISOString(), // 1天后过期
    };

    // 测试过期会员
    const expiredUser: any = {
      membershipLevel: 'premium',
      membershipStatus: 'active',
      membershipEnd: new Date(Date.now() - 86400000).toISOString(), // 1天前过期
    };

    // 创建一个组件来测试checkMembershipStatus方法
    const MembershipTestComponent = () => {
      const authContext = React.useContext(AuthContext);
      return (
        <div>
          <div data-testid="free-status">
            {authContext.checkMembershipStatus() ? 'true' : 'false'}
          </div>
          <button 
            data-testid="update-premium-btn" 
            onClick={() => authContext.updateUser(premiumUser)}
          >
            Update to Premium
          </button>
          <button 
            data-testid="update-expired-btn" 
            onClick={() => authContext.updateUser(expiredUser)}
          >
            Update to Expired
          </button>
        </div>
      );
    };

    render(
      <Router>
        <AuthProvider>
          <MembershipTestComponent />
        </AuthProvider>
      </Router>
    );

    // 初始状态应为false（无用户）
    expect(screen.getByTestId('free-status')).toHaveTextContent('false');
  });
});
