/**
 * 左侧边栏组件 V2 - 全新设计
 * 包含分类导航、品牌筛选等
 * 优化：更现代的UI、更好的交互体验
 */
import React from 'react';
import { 
  ShoppingBag, 
  Store
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LeftSidebarProps {
  categories?: Array<{ id: string; name: string; icon?: string }>;
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  categories = [],
  selectedCategory = '',
  onCategorySelect,
}) => {

  return (
    <div className="space-y-4">
      {/* 商品分类 - 新设计 */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mp-sidebar-card"
        >
          <h3 className="mp-sidebar-card-title">
            <Store className="w-4 h-4 text-gray-400" />
            商品分类
          </h3>
          <nav className="mp-sidebar-nav">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onCategorySelect?.('')}
              className={`mp-sidebar-nav-item ${selectedCategory === '' ? 'active' : ''}`}
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={selectedCategory === '' ? 2.5 : 2} />
              <span>全部商品</span>
            </motion.button>
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => onCategorySelect?.(category.id)}
                className={`mp-sidebar-nav-item ${selectedCategory === category.id ? 'active' : ''}`}
              >
                <span className="w-5 h-5 flex items-center justify-center text-lg">
                  {category.icon || '📦'}
                </span>
                <span>{category.name}</span>
              </motion.button>
            ))}
          </nav>
        </motion.div>
      )}

    </div>
  );
};

export default LeftSidebar;
