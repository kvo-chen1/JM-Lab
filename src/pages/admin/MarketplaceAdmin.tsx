/**
 * 商城后台管理 - 三栏式布局
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
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
import MerchantApplicationReview from './components/MerchantApplicationReview';

// 标签页配置
const TABS = [
  { id: 'products', label: '商品管理', icon: Package },
  { id: 'brands', label: '品牌方管理', icon: Store },
  { id: 'authorizations', label: '授权管理', icon: CheckCircle },
  { id: 'merchant-applications', label: '入驻审核', icon: Users },
  { id: 'orders', label: '订单管理', icon: ShoppingCart },
];

const MarketplaceAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('products');

  // 渲染当前标签页内容
  const renderContent = () => {
    switch (activeTab) {
      case 'brands':
        return <BrandManagement />;
      case 'authorizations':
        return <AuthorizationManagement />;
      case 'merchant-applications':
        return <MerchantApplicationReview isDarkMode={isDark} />;
      case 'products':
        return <MarketplaceProductManagement />;
      case 'orders':
        return <OrderManagement />;
      default:
        return <MarketplaceProductManagement />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      {/* 三栏式主体内容 */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">

          {/* 左栏：导航菜单 */}
          <div className="col-span-12 lg:col-span-2">
            <div className={`rounded-xl border shadow-sm overflow-hidden sticky top-6 ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
              {/* 返回按钮 */}
              <div className={`p-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <button
                  onClick={() => navigate('/admin')}
                  className={`flex items-center transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">返回管理后台</span>
                </button>
              </div>

              {/* 菜单标题 */}
              <div className={`px-4 py-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <LayoutDashboard className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>商城管理</span>
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
                          ? isDark ? 'bg-white text-black shadow-sm' : 'bg-gray-900 text-white shadow-sm'
                          : isDark ? 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
            <div className={`rounded-xl border shadow-sm p-4 ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold text-sm mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <TrendingUp className={`w-4 h-4 mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                商城概览
              </h3>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                      <Box className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>商品总数</span>
                  </div>
                  <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>6</span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                      <Package className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>销售中</span>
                  </div>
                  <span className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>6</span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                      <Store className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>品牌方</span>
                  </div>
                  <span className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>0</span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
                      <ShoppingCart className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>今日订单</span>
                  </div>
                  <span className={`text-xl font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>0</span>
                </div>
              </div>
            </div>

            {/* 销售统计 */}
            <div className={`rounded-xl border shadow-sm p-4 ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold text-sm mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <DollarSign className={`w-4 h-4 mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                销售统计
              </h3>
              <div className="space-y-4">
                <div>
                  <div className={`flex items-center justify-between text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>今日销售额</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>¥0</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                    <div className="h-full bg-emerald-500 rounded-full" style={{width: '0%'}} />
                  </div>
                </div>
                <div>
                  <div className={`flex items-center justify-between text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>本周销售额</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>¥0</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                    <div className="h-full bg-blue-500 rounded-full" style={{width: '0%'}} />
                  </div>
                </div>
                <div>
                  <div className={`flex items-center justify-between text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>本月销售额</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>¥0</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                    <div className="h-full bg-violet-500 rounded-full" style={{width: '0%'}} />
                  </div>
                </div>
              </div>
            </div>

            {/* 快捷入口 */}
            <div className={`rounded-xl border shadow-sm p-4 ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold text-sm mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Users className={`w-4 h-4 mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                快捷入口
              </h3>
              <div className="space-y-2">
                <button className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                  查看商品详情
                </button>
                <button className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                  管理商品分类
                </button>
                <button className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                  查看销售报表
                </button>
                <button className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
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
