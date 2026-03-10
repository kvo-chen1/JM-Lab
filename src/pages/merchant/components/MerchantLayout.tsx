/**
 * 商家工作平台 - 布局组件
 */
import React from 'react';

interface MerchantLayoutProps {
  children: React.ReactNode;
}

const MerchantLayout: React.FC<MerchantLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {children}
    </div>
  );
};

export default MerchantLayout;
