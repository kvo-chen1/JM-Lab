/**
 * 商家工作平台 - 左侧功能导航
 */
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  RefreshCw, 
  MessageSquare, 
  BarChart3,
  Store,
  HelpCircle
} from 'lucide-react';

interface Module {
  id: string;
  label: string;
  icon: string;
}

interface LeftSidebarProps {
  modules: Module[];
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
}

// 图标映射
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  ShoppingCart,
  RefreshCw,
  MessageSquare,
  BarChart3,
};

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  modules, 
  activeModule, 
  onModuleChange 
}) => {
  return (
    <div className="space-y-4 sticky top-6">
      {/* 功能导航卡片 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
        {/* 标题 */}
        <div className="px-4 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#5ba3d4]" />
            <span className="font-semibold text-white">工作台</span>
          </div>
        </div>
        
        {/* 导航菜单 */}
        <nav className="p-2">
          {modules.map((module, index) => {
            const Icon = iconMap[module.icon] || Package;
            const isActive = activeModule === module.id;
            
            return (
              <motion.button
                key={module.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onModuleChange(module.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all mb-1 ${
                  isActive 
                    ? 'bg-[#5ba3d4] text-white shadow-lg shadow-[#5ba3d4]/20' 
                    : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{module.label}</span>
                
                {/* 未读标记（示例） */}
                {module.id === 'orders' && (
                  <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    3
                  </span>
                )}
                {module.id === 'aftersales' && (
                  <span className="ml-auto w-5 h-5 bg-amber-500 rounded-full text-xs flex items-center justify-center text-white">
                    2
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* 快捷帮助 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-400">帮助中心</span>
        </div>
        <div className="space-y-2">
          <button className="w-full text-left text-xs text-gray-500 hover:text-white transition-colors py-1">
            • 如何发布商品？
          </button>
          <button className="w-full text-left text-xs text-gray-500 hover:text-white transition-colors py-1">
            • 订单发货流程
          </button>
          <button className="w-full text-left text-xs text-gray-500 hover:text-white transition-colors py-1">
            • 售后处理指南
          </button>
          <button className="w-full text-left text-xs text-gray-500 hover:text-white transition-colors py-1">
            • 联系平台客服
          </button>
        </div>
      </div>

      {/* 平台公告 */}
      <div className="bg-gradient-to-br from-[#5ba3d4]/10 to-[#3d6a8a]/10 rounded-xl border border-[#5ba3d4]/20 p-4">
        <h4 className="text-sm font-medium text-[#5ba3d4] mb-2">平台公告</h4>
        <p className="text-xs text-gray-400 leading-relaxed">
          新功能上线：商家数据中心现已支持实时数据监控，帮助您更好地了解店铺运营情况。
        </p>
      </div>
    </div>
  );
};

export default LeftSidebar;
