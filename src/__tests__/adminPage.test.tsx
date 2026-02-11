import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Admin from '../pages/admin/Admin';
import { AuthContext } from '../contexts/authContext';
import '@testing-library/jest-dom';

// Mock external dependencies
jest.mock('../components/SidebarLayout', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="sidebar-layout-mock" {...props}>{children}</div>
  ),
}));

jest.mock('../components/AdminRoute', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="admin-route-mock" {...props}>{children}</div>
  ),
}));

jest.mock('../components/AnalyticsDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="analytics-dashboard-mock">Analytics Dashboard Mock</div>,
}));

jest.mock('../components/ErrorMonitoringDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="error-monitoring-dashboard-mock">Error Monitoring Dashboard Mock</div>,
}));

jest.mock('../components/PerformanceMonitoringDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="performance-monitoring-dashboard-mock">Performance Monitoring Dashboard Mock</div>,
}));

jest.mock('../components/RoleManager', () => ({
  __esModule: true,
  default: () => <div data-testid="role-manager-mock">Role Manager Mock</div>,
}));

// Mock services
jest.mock('../services/analyticsService', () => ({
  __esModule: true,
  default: {
    getAnalytics: jest.fn().mockResolvedValue({ data: {} }),
    getMetrics: jest.fn().mockResolvedValue({ metrics: {} }),
  }
}));

jest.mock('../services/errorService', () => ({
  __esModule: true,
  default: {
    getErrors: jest.fn().mockResolvedValue({ errors: [] }),
    getErrorDetails: jest.fn().mockResolvedValue({}),
  }
}));

jest.mock('../utils/performanceMonitor', () => ({
  __esModule: true,
  default: {
    getPerformanceMetrics: jest.fn().mockResolvedValue({ metrics: {} }),
    getPageLoadTimes: jest.fn().mockResolvedValue({ times: [] }),
  }
}));

jest.mock('../lib/apiClient', () => ({
  __esModule: true,
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
  }
}));

// Mock vite environment variables
process.env = {
  ...process.env,
  VITE_API_BASE_URL: 'http://localhost:3000/api',
  VITE_ENV: 'test',
};

// Mock theme context
jest.mock('../hooks/useTheme', () => ({
  __esModule: true,
  useTheme: () => ({
    theme: 'light',
    isDark: false,
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  }),
}));

// Mock AuthContext value
const mockContextValue = {
  user: {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    avatar: 'https://example.com/avatar.jpg',
    interests: ['admin'],
    isAdmin: true,
    membershipLevel: 'vip' as const,
    membershipStatus: 'active' as const,
    membershipStart: new Date().toISOString(),
  },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn().mockResolvedValue(true),
  loginWithCode: jest.fn().mockResolvedValue(true),
  sendEmailOtp: jest.fn().mockResolvedValue({ success: true }),
  sendRegisterEmailOtp: jest.fn().mockResolvedValue({ success: true }),
  sendSmsOtp: jest.fn().mockResolvedValue({ success: true }),
  register: jest.fn().mockResolvedValue({ success: true }),
  logout: jest.fn(),
  setIsAuthenticated: jest.fn(),
  quickLogin: jest.fn().mockResolvedValue(true),
  updateUser: jest.fn(),
  updateMembership: jest.fn().mockResolvedValue(true),
  checkMembershipStatus: jest.fn().mockReturnValue(true),
  getMembershipBenefits: jest.fn().mockReturnValue([]),
  enableTwoFactorAuth: jest.fn().mockResolvedValue(true),
  verifyTwoFactorCode: jest.fn().mockResolvedValue(true),
  resendTwoFactorCode: jest.fn().mockResolvedValue(true),
  disableTwoFactorAuth: jest.fn().mockResolvedValue(true),
  refreshToken: jest.fn().mockResolvedValue(true),
  resetPassword: jest.fn().mockResolvedValue({ success: true }),
  verifyUserIdConsistency: jest.fn().mockResolvedValue(true),
};

// Create a custom render function with auth context provider
const renderWithAuth = (ui: React.ReactElement) => {
  // Create a wrapper that provides the AuthContext with our mock value
  const AuthContextProviderWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );
  };

  return render(
    <Router>
      <AuthContextProviderWrapper>
        {ui}
      </AuthContextProviderWrapper>
    </Router>
  );
};

describe('Admin Page', () => {
  test('should render without errors', async () => {
    renderWithAuth(<Admin />);
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 简单检查页面是否包含基本结构
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
  });

  test('should render sidebar layout component', async () => {
    renderWithAuth(<Admin />);
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查页面是否包含侧边栏结构
    expect(document.querySelector('.w-64')).toBeInTheDocument();
    expect(document.querySelector('.ml-64')).toBeInTheDocument();
  });

  test('should render admin route component', async () => {
    renderWithAuth(<Admin />);
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查管理页面内容区域是否存在
    expect(document.querySelector('.flex-1')).toBeInTheDocument();
  });

  test('should have expected page structure', async () => {
    renderWithAuth(<Admin />);
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查页面基本结构
    expect(document.querySelector('.flex')).toBeInTheDocument();
    expect(document.querySelector('.p-8')).toBeInTheDocument();
    expect(document.querySelector('.space-y-8')).toBeInTheDocument();
  });
});
