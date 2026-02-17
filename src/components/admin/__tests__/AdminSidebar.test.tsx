import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminSidebar from '../AdminSidebar';
import type { NavNotificationsMap } from '@/hooks/useNavNotifications';

describe('AdminSidebar', () => {
  const mockNotifications: NavNotificationsMap = {
    feedback: { count: 5, hasNew: true, lastViewedAt: null },
    eventAudit: { count: 3, hasNew: false, lastViewedAt: new Date() },
    contentAudit: { count: 0, hasNew: false, lastViewedAt: null },
    userAudit: { count: 2, hasNew: true, lastViewedAt: null },
    orders: { count: 0, hasNew: false, lastViewedAt: null },
    permissions: { count: 0, hasNew: false, lastViewedAt: null },
    productManagement: { count: 0, hasNew: false, lastViewedAt: null },
    notificationManagement: { count: 0, hasNew: false, lastViewedAt: null },
    communities: { count: 1, hasNew: true, lastViewedAt: null },
    campaigns: { count: 0, hasNew: false, lastViewedAt: null },
    users: { count: 4, hasNew: true, lastViewedAt: null },
    creators: { count: 0, hasNew: false, lastViewedAt: null },
  };

  const defaultProps = {
    isDark: false,
    activeTab: 'dashboard',
    onTabChange: vi.fn(),
    user: { username: 'Admin', avatar: 'https://example.com/avatar.png' },
    onLogout: vi.fn(),
    notifications: mockNotifications,
    onMarkAsViewed: vi.fn(),
    totalUnreadCount: 15,
  };

  it('正确渲染所有导航项', () => {
    render(<AdminSidebar {...defaultProps} />);

    expect(screen.getByText('控制台')).toBeInTheDocument();
    expect(screen.getByText('活动管理')).toBeInTheDocument();
    expect(screen.getByText('反馈管理')).toBeInTheDocument();
    expect(screen.getByText('用户管理')).toBeInTheDocument();
  });

  it('点击导航项时调用 onTabChange', () => {
    const onTabChange = vi.fn();
    render(<AdminSidebar {...defaultProps} onTabChange={onTabChange} />);

    const feedbackButton = screen.getByText('反馈管理').closest('button');
    fireEvent.click(feedbackButton!);

    expect(onTabChange).toHaveBeenCalledWith('feedback');
  });

  it('点击有通知的导航项时调用 onMarkAsViewed', () => {
    const onMarkAsViewed = vi.fn();
    render(<AdminSidebar {...defaultProps} onMarkAsViewed={onMarkAsViewed} />);

    const feedbackButton = screen.getByText('反馈管理').closest('button');
    fireEvent.click(feedbackButton!);

    expect(onMarkAsViewed).toHaveBeenCalledWith('feedback');
  });

  it('显示通知数量标记', () => {
    render(<AdminSidebar {...defaultProps} />);

    // 反馈管理有 5 条通知
    expect(screen.getByText('5')).toBeInTheDocument();
    // 用户管理有 4 条通知
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('不显示没有通知的导航项的数量', () => {
    render(<AdminSidebar {...defaultProps} />);

    // 内容审核没有通知，不应该显示 0
    const contentAuditButton = screen.getByText('内容管理').closest('button');
    expect(contentAuditButton).not.toHaveTextContent('0');
  });

  it('正确显示用户信息', () => {
    render(<AdminSidebar {...defaultProps} />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('超级管理员')).toBeInTheDocument();
  });

  it('点击退出按钮调用 onLogout', () => {
    const onLogout = vi.fn();
    render(<AdminSidebar {...defaultProps} onLogout={onLogout} />);

    const logoutButton = screen.getByLabelText('退出登录');
    fireEvent.click(logoutButton);

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('暗色模式正确应用样式', () => {
    const { container } = render(<AdminSidebar {...defaultProps} isDark={true} />);

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('bg-gray-800');
    expect(aside).toHaveClass('border-gray-700');
  });

  it('亮色模式正确应用样式', () => {
    const { container } = render(<AdminSidebar {...defaultProps} isDark={false} />);

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('bg-white');
    expect(aside).toHaveClass('border-gray-200');
  });

  it('活跃导航项正确高亮显示', () => {
    render(<AdminSidebar {...defaultProps} activeTab="feedback" />);

    const feedbackButton = screen.getByText('反馈管理').closest('button');
    expect(feedbackButton).toHaveClass('bg-red-600');
    expect(feedbackButton).toHaveClass('text-white');
  });

  it('非活跃导航项正确显示默认样式', () => {
    render(<AdminSidebar {...defaultProps} activeTab="dashboard" isDark={false} />);

    const feedbackButton = screen.getByText('反馈管理').closest('button');
    expect(feedbackButton).toHaveClass('text-gray-600');
  });

  it('当 totalUnreadCount > 0 时 Logo 旁显示指示器', () => {
    const { container } = render(<AdminSidebar {...defaultProps} totalUnreadCount={15} />);

    // 检查是否有脉冲动画元素
    const pulseIndicator = container.querySelector('.animate-ping');
    expect(pulseIndicator).toBeInTheDocument();
  });

  it('当 totalUnreadCount = 0 时 Logo 旁不显示指示器', () => {
    const { container } = render(<AdminSidebar {...defaultProps} totalUnreadCount={0} />);

    // 检查是否没有脉冲动画元素
    const pulseIndicator = container.querySelector('.animate-ping');
    expect(pulseIndicator).not.toBeInTheDocument();
  });

  it('没有传入 notifications 时也能正常渲染', () => {
    render(<AdminSidebar {...defaultProps} notifications={undefined} />);

    expect(screen.getByText('控制台')).toBeInTheDocument();
    expect(screen.getByText('反馈管理')).toBeInTheDocument();
  });
});
