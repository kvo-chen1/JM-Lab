/**
 * 商城后台管理 - 深色主题三栏式布局
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  CheckCircle,
  ArrowLeft,
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Users,
  Box
} from 'lucide-react';
import BrandManagement from './BrandManagement';
import MarketplaceProductManagement from './MarketplaceProductManagement';
import OrderManagement from './OrderManagement';
import AuthorizationManagement from './AuthorizationManagement';

// 标签页配置
const TABS = [
  { id: 'products', label: '商品管理', icon: Package },
  { id: 'brands', label: '品牌方管理', icon: Store },
  { id: 'authorizations', label: '授权管理', icon: CheckCircle },
  { id: 'orders', label: '订单管理', icon: ShoppingCart },
];

const MarketplaceAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  // 渲染当前标签页内容
  const renderContent = () => {
    switch (activeTab) {
      case 'brands':
        return <BrandManagement />;
      case 'authorizations':
        return <AuthorizationManagement />;
      case 'products':
        return <MarketplaceProductManagement />;
      case 'orders':
        return <OrderManagement />;
      default:
        return <MarketplaceProductManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 三栏式主体内容 */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* 左栏：导航菜单 */}
          <div className="col-span-12 lg:col-span-2">
            <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-sm overflow-hidden sticky top-6">
              {/* 返回按钮 */}
              <div className="p-4 border-b border-[#2a2a2a]">
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">返回管理后台</span>
                </button>
              </div>
              
              {/* 菜单标题 */}
              <div className="px-4 py-3 bg-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                  <span className="font-semibold text-white">商城管理</span>
                </div>
              </div>
              
              {/* 菜单项 */}
              <nav className="p-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all mb-1 ${
                        isActive 
                          ? 'bg-white text-black shadow-sm' 
                          : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* 中栏：内容区域 */}
          <div className="col-span-12 lg:col-span-7">
            {renderContent()}
          </div>

          {/* 右栏：统计概览 */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* 商城数据概览 */}
            <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-sm p-4">
              <h3 className="font-semibold text-white text-sm mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                商城概览
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                      <Box className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-400">商品总数</span>
                  </div>
                  <span className="text-xl font-bold text-white">6</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-400">销售中</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-400">6</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Store className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-400">品牌方</span>
                  </div>
                  <span className="text-xl font-bold text-blue-400">0</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-sm text-gray-400">今日订单</span>
                  </div>
                  <span className="text-xl font-bold text-violet-400">0</span>
                </div>
              </div>
            </div>

            {/* 销售统计 */}
            <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-sm p-4">
              <h3 className="font-semibold text-white text-sm mb-4 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                销售统计
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">今日销售额</span>
                    <span className="font-semibold text-white">¥0</span>
                  </div>
                  <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{width: '0%'}} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">本周销售额</span>
                    <span className="font-semibold text-white">¥0</span>
                  </div>
                  <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{width: '0%'}} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">本月销售额</span>
                    <span className="font-semibold text-white">¥0</span>
                  </div>
                  <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{width: '0%'}} />
                  </div>
                </div>
              </div>
            </div>

            {/* 快捷入口 */}
            <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-sm p-4">
              <h3 className="font-semibold text-white text-sm mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-400" />
                快捷入口
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1f1f1f] hover:text-white transition-colors">
                  查看商品详情
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1f1f1f] hover:text-white transition-colors">
                  管理商品分类
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1f1f1f] hover:text-white transition-colors">
                  查看销售报表
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1f1f1f] hover:text-white transition-colors">
                  设置配送方式
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceAdminPage;
