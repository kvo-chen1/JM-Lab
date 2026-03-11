import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrandPartnership } from '@/services/brandPartnershipService';
import {
  Building2,
  Handshake,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Search,
  CheckCircle2,
  Store,
  ChevronDown
} from 'lucide-react';

interface LeftSidebarProps {
  isDark: boolean;
  selectedBrand?: { id: string; name: string; image: string };
  onBrandSelect?: (brand: { id: string; name: string; image: string }) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  partnershipCount?: number;
  approvedBrands?: BrandPartnership[];
  stats?: {
    approvedPartnerships: number;
    totalEvents: number;
  };
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isDark,
  selectedBrand,
  onBrandSelect,
  searchQuery = '',
  onSearchChange,
  partnershipCount = 0,
  approvedBrands = [],
  stats
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // 使用已入驻的品牌数据
  const displayBrands = approvedBrands.length > 0
    ? approvedBrands.map(p => ({
        id: p.id,
        name: p.brand_name,
        image: p.brand_logo || 'https://via.placeholder.com/40?text=Brand'
      }))
    : [];

  const filteredBrands = displayBrands.filter(b =>
    b.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  ).slice(0, 8);

  const isBusinessPage = location.pathname === '/business' || location.pathname === '/business-cooperation';
  const isShowcasePage = location.pathname === '/brand-showcase';

  const menuItems = [
    { icon: Building2, label: '品牌入驻', count: stats?.approvedPartnerships || 0, active: isBusinessPage, path: '/business' },
    { icon: Store, label: '品牌展示', count: null, active: isShowcasePage, path: '/brand-showcase' },
    { icon: Handshake, label: '合作申请', count: partnershipCount, active: false, path: '/business', subMenu: [
      { label: '品牌方合作', path: '/business' },
      { label: '商家入驻申请', path: '/merchant/apply' },
    ]},
    { icon: TrendingUp, label: '品牌活动', count: stats?.totalEvents || 0, active: false, path: '/business' },
    { icon: Sparkles, label: 'AI创意', count: null, active: false, path: '/business' },
  ];

  const handleMenuClick = (item: any) => {
    if (item.subMenu) {
      // 有子菜单，切换展开状态
      setExpandedMenu(expandedMenu === item.label ? null : item.label);
    } else {
      // 没有子菜单，直接跳转
      navigate(item.path);
    }
  };

  const handleSubMenuClick = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(path);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Logo区域 */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            品牌合作
          </h1>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            企业服务门户
          </p>
        </div>
      </div>

      {/* 快速导航 */}
      <div className="space-y-1">
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          快速导航
        </h3>
        {menuItems.map((item, index) => (
          <div key={item.label}>
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleMenuClick(item)}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                ${item.active
                  ? (isDark ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200')
                  : (isDark ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                }
              `}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.count !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                    {item.count}
                  </span>
                )}
                {item.subMenu ? (
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenu === item.label ? 'rotate-180' : ''}`} />
                ) : (
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </motion.button>
            
            {/* 子菜单 */}
            <AnimatePresence>
              {item.subMenu && expandedMenu === item.label && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pl-11 pr-4 py-2 space-y-1">
                    {item.subMenu.map((subItem: any) => (
                      <button
                        key={subItem.label}
                        onClick={(e) => handleSubMenuClick(subItem.path, e)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                          ${isDark 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }
                        `}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* 品牌搜索 */}
      <div className="space-y-3">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          搜索入驻品牌
        </h3>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="搜索已入驻品牌..."
            className={`
              w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200
              ${isDark 
                ? 'bg-gray-700/50 text-white placeholder-gray-500 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                : 'bg-gray-100 text-gray-900 placeholder-gray-400 border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }
              outline-none
            `}
          />
        </div>
      </div>

      {/* 已入驻品牌列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            已入驻品牌
          </h3>
          <span className={`
            text-xs px-2 py-0.5 rounded-full flex items-center gap-1
            ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}
          `}>
            <CheckCircle2 className="w-3 h-3" />
            官方认证
          </span>
        </div>
        
        <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {filteredBrands.length > 0 ? (
            filteredBrands.map((brand, index) => (
              <motion.button
                key={brand.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onBrandSelect?.(brand)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${selectedBrand?.id === brand.id
                    ? (isDark ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200')
                    : (isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100')
                  }
                `}
              >
                <img 
                  src={brand.image} 
                  alt={brand.name}
                  className="w-8 h-8 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {brand.name}
                  </p>
                </div>
                {selectedBrand?.id === brand.id && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </motion.button>
            ))
          ) : (
            <div className={`text-center py-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">暂无入驻品牌</p>
              <p className="text-xs mt-1">成为第一个入驻的品牌！</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className={`
        mt-auto p-4 rounded-xl border
        ${isDark ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'}
      `}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            AI 赋能
          </span>
        </div>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          利用生成式AI技术，快速产出海量国潮设计方案
        </p>
      </div>
    </div>
  );
};

export default LeftSidebar;
