/**
 * 商家工作平台 - 主页面
 * 三栏式布局：左侧导航 + 中间内容 + 右侧数据概览
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

// 布局组件
import MerchantLayout from './components/MerchantLayout';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import HeaderBar from './components/HeaderBar';

// 功能模块
import ProductManager from './components/modules/ProductManager';
import OrderManager from './components/modules/OrderManager';
import AfterSalesManager from './components/modules/AfterSalesManager';
import ReviewManager from './components/modules/ReviewManager';
import DataCenter from './components/modules/DataCenter';

// 功能模块配置
const MODULES = [
  { id: 'products', label: '商品管理', icon: 'Package' },
  { id: 'orders', label: '交易管理', icon: 'ShoppingCart' },
  { id: 'aftersales', label: '售后管理', icon: 'RefreshCw' },
  { id: 'reviews', label: '评论管理', icon: 'MessageSquare' },
  { id: 'datacenter', label: '数据中心', icon: 'BarChart3' },
];

const MerchantWorkbench: React.FC = () => {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState('products');

  // 渲染当前功能模块
  const renderModule = () => {
    switch (activeModule) {
      case 'products':
        return <ProductManager />;
      case 'orders':
        return <OrderManager />;
      case 'aftersales':
        return <AfterSalesManager />;
      case 'reviews':
        return <ReviewManager />;
      case 'datacenter':
        return <DataCenter />;
      default:
        return <ProductManager />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 顶部商家信息栏 */}
      <HeaderBar />

      {/* 三栏式主体内容 */}
      <div className="p-6 pt-4">
        <div className="grid grid-cols-12 gap-6">
          
          {/* 左栏：功能导航 */}
          <div className="col-span-12 lg:col-span-2">
            <LeftSidebar 
              modules={MODULES}
              activeModule={activeModule}
              onModuleChange={setActiveModule}
            />
          </div>

          {/* 中栏：内容区域 */}
          <div className="col-span-12 lg:col-span-7">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderModule()}
            </motion.div>
          </div>

          {/* 右栏：数据概览 */}
          <div className="col-span-12 lg:col-span-3">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantWorkbench;
