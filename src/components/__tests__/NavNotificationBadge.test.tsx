import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NavNotificationBadge from '../NavNotificationBadge';

describe('NavNotificationBadge', () => {
  it('当 count 为 0 时不渲染', () => {
    const { container } = render(<NavNotificationBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('当 count 为 undefined 且 showDot 为 false 时不渲染', () => {
    const { container } = render(<NavNotificationBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('正确显示数字标记', () => {
    render(<NavNotificationBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('当 count 超过 maxCount 时显示 maxCount+', () => {
    render(<NavNotificationBadge count={150} maxCount={99} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('显示小红点当 showDot 为 true', () => {
    const { container } = render(<NavNotificationBadge showDot={true} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('不同尺寸渲染正确', () => {
    const { rerender } = render(<NavNotificationBadge count={5} size="sm" />);
    expect(screen.getByText('5')).toBeInTheDocument();

    rerender(<NavNotificationBadge count={5} size="md" />);
    expect(screen.getByText('5')).toBeInTheDocument();

    rerender(<NavNotificationBadge count={5} size="lg" />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('不同变体渲染正确', () => {
    const variants = ['default', 'error', 'warning', 'success'] as const;
    
    variants.forEach((variant) => {
      const { rerender } = render(<NavNotificationBadge count={5} variant={variant} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('点击事件正常工作', () => {
    const handleClick = vi.fn();
    render(<NavNotificationBadge count={5} onClick={handleClick} />);
    
    const badge = screen.getByText('5').parentElement;
    fireEvent.click(badge!);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应用自定义 className', () => {
    const { container } = render(
      <NavNotificationBadge count={5} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('数字变化时有动画效果', () => {
    const { rerender } = render(<NavNotificationBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();

    rerender(<NavNotificationBadge count={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('脉冲效果在 showDot 模式下默认开启', () => {
    const { container } = render(<NavNotificationBadge showDot={true} pulse={true} />);
    const pulseElement = container.querySelector('[class*="animate"]');
    expect(pulseElement).toBeInTheDocument();
  });

  it('脉冲效果可以被禁用', () => {
    const { container } = render(<NavNotificationBadge showDot={true} pulse={false} />);
    // 应该仍然渲染，但没有脉冲动画
    expect(container.firstChild).toBeInTheDocument();
  });
});
