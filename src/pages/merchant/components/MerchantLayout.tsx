/**
 * 商家工作平台 - 布局组件
 */
import React from 'react';

interface MerchantLayoutProps {
  children: React.ReactNode;
}

const MerchantLayout: React.FC<MerchantLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {children}
    </div>
  );
};

export default MerchantLayout;
