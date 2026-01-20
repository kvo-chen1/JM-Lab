import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('Integration Tests', () => {
  const IntegrationTestComponent = () => {
    const authContext = React.useContext(AuthContext);
    return (
      <div>
        {/* 认证状态 */}
        <div data-testid="is-authenticated">{authContext.isAuthenticated ? 'true' : 'false'}</div>
        <div data-testid="user">{authContext.user ? authContext.user.username : 'null'}</div>
        <div data-testid="membership-level">{authContext.user ? authContext.user.membershipLevel : 'null'}</div>
        
        {/* 认证操作 */}
        <button 
          data-testid="login-btn" 
          onClick={async () => {
            await authContext.login('test@example.com', 'password123');
          }}
        >
          Login
        </button>
        <button 
          data-testid="logout-btn" 
          onClick={() => authContext.logout()}
        >
          Logout
        </button>
        
        {/* 用户设置操作 */}
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
        
        {/* 会员状态检查 */}
        <button 
          data-testid="check-membership-btn" 
          onClick={() => {
            const isActive = authContext.checkMembershipStatus();
            console.log('Membership status:', isActive);
          }}
        >
          Check Membership
        </button>
        
        {/* 会员权益获取 */}
        <div data-testid="membership-benefits">
          {authContext.getMembershipBenefits().join(', ')}
        </div>
      </div>
    );
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should integrate authentication with user settings', async () => {
    render(
      <Router>
        <AuthProvider>
          <IntegrationTestComponent />
        </AuthProvider>
      </Router>
    );

    // 初始状态应该是未认证
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('membership-level')).toHaveTextContent('null');

    // 登录
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('test');
      expect(screen.getByTestId('membership-level')).toHaveTextContent('free');
    });

    // 更新用户信息
    fireEvent.click(screen.getByTestId('update-user-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('updateduser');
      expect(screen.getByTestId('membership-level')).toHaveTextContent('premium');
    });

    // 验证会员权益更新
    const benefits = screen.getByTestId('membership-benefits').textContent;
    expect(benefits).toContain('无限AI生成次数');
    expect(benefits).toContain('高级AI模型访问');

    // 登出
    fireEvent.click(screen.getByTestId('logout-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('membership-level')).toHaveTextContent('null');
    });

    // 验证登出后会员权益清空
    expect(screen.getByTestId('membership-benefits').textContent).toBe('');
  });

  test('should integrate authentication with membership management', async () => {
    render(
      <Router>
        <AuthProvider>
          <IntegrationTestComponent />
        </AuthProvider>
      </Router>
    );

    // 登录
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // 验证免费会员权益
    expect(screen.getByTestId('membership-benefits').textContent).toContain('基础AI创作功能');
    expect(screen.getByTestId('membership-benefits').textContent).toContain('每天限量生成次数');

    // 更新为高级会员
    fireEvent.click(screen.getByTestId('update-user-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('membership-level')).toHaveTextContent('premium');
    });

    // 验证高级会员权益
    const premiumBenefits = screen.getByTestId('membership-benefits').textContent;
    expect(premiumBenefits).toContain('无限AI生成次数');
    expect(premiumBenefits).toContain('高级AI模型访问');
    expect(premiumBenefits).toContain('高清作品导出');

    // 登出后权益应该清空
    fireEvent.click(screen.getByTestId('logout-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('membership-benefits').textContent).toBe('');
    });
  });

  test('should handle authentication state across module boundaries', async () => {
    // 创建两个不同的组件，模拟不同模块
    const ModuleA = () => {
      const authContext = React.useContext(AuthContext);
      return (
        <div className="module-a">
          <div data-testid="module-a-auth">{authContext.isAuthenticated ? 'true' : 'false'}</div>
          <button 
            data-testid="module-a-login" 
            onClick={async () => {
              await authContext.login('test@example.com', 'password123');
            }}
          >
            Login from Module A
          </button>
        </div>
      );
    };

    const ModuleB = () => {
      const authContext = React.useContext(AuthContext);
      return (
        <div className="module-b">
          <div data-testid="module-b-auth">{authContext.isAuthenticated ? 'true' : 'false'}</div>
          <div data-testid="module-b-user">{authContext.user ? authContext.user.username : 'null'}</div>
          <button 
            data-testid="module-b-logout" 
            onClick={() => authContext.logout()}
          >
            Logout from Module B
          </button>
        </div>
      );
    };

    // 渲染两个模块
    render(
      <Router>
        <AuthProvider>
          <ModuleA />
          <ModuleB />
        </AuthProvider>
      </Router>
    );

    // 初始状态：两个模块都未认证
    expect(screen.getByTestId('module-a-auth')).toHaveTextContent('false');
    expect(screen.getByTestId('module-b-auth')).toHaveTextContent('false');
    expect(screen.getByTestId('module-b-user')).toHaveTextContent('null');

    // 从Module A登录
    fireEvent.click(screen.getByTestId('module-a-login'));
    await waitFor(() => {
      // 验证两个模块都反映了认证状态变化
      expect(screen.getByTestId('module-a-auth')).toHaveTextContent('true');
      expect(screen.getByTestId('module-b-auth')).toHaveTextContent('true');
      expect(screen.getByTestId('module-b-user')).toHaveTextContent('test');
    });

    // 从Module B登出
    fireEvent.click(screen.getByTestId('module-b-logout'));
    await waitFor(() => {
      // 验证两个模块都反映了登出状态变化
      expect(screen.getByTestId('module-a-auth')).toHaveTextContent('false');
      expect(screen.getByTestId('module-b-auth')).toHaveTextContent('false');
      expect(screen.getByTestId('module-b-user')).toHaveTextContent('null');
    });
  });

  test('should manage authentication state with quick login', async () => {
    // 测试组件中添加快速登录按钮
    const QuickLoginIntegrationComponent = () => {
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
          <button 
            data-testid="logout-btn" 
            onClick={() => authContext.logout()}
          >
            Logout
          </button>
          <div data-testid="membership-benefits">
            {authContext.getMembershipBenefits().join(', ')}
          </div>
        </div>
      );
    };

    render(
      <Router>
        <AuthProvider>
          <QuickLoginIntegrationComponent />
        </AuthProvider>
      </Router>
    );

    // 初始状态未认证
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');

    // 快速登录
    fireEvent.click(screen.getByTestId('quick-login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('微信用户');
    });

    // 验证会员权益
    expect(screen.getByTestId('membership-benefits').textContent).toContain('基础AI创作功能');

    // 登出
    fireEvent.click(screen.getByTestId('logout-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });
});
