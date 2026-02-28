import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ExternalLink, DollarSign, TrendingUp, MousePointer2 } from 'lucide-react';
import { toast } from 'sonner';
import * as orderExecutionService from '@/services/orderExecutionService';

interface ProductLinkCardProps {
  link: orderExecutionService.ProductLink;
  workId?: string;
  isDark: boolean;
  onLinkClick?: () => void;
}

const ProductLinkCard: React.FC<ProductLinkCardProps> = ({ link, workId, isDark, onLinkClick }) => {
  const [clicked, setClicked] = useState(false);

  const handleLinkClick = async () => {
    try {
      // 记录点击
      if (link.id) {
        // 这里应该调用 API 记录点击，但需要 execution_id
        // 暂时只记录本地状态
        setClicked(true);
      }
      
      // 打开链接
      window.open(link.product_url, '_blank');
      
      onLinkClick?.();
    } catch (error) {
      console.error('记录点击失败:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }}
      className={`rounded-2xl overflow-hidden border transition-all ${
        isDark
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
      } shadow-lg`}
    >
      {/* 产品图片 */}
      <div className="relative h-48 overflow-hidden">
        {link.product_image ? (
          <img
            src={link.product_image}
            alt={link.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <ShoppingBag className={`w-16 h-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
        )}
        
        {/* 价格标签 */}
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
          <span className="text-white font-bold text-sm">
            ¥{link.price?.toLocaleString() || '0'}
          </span>
        </div>

        {/* 佣金标签 */}
        {link.commission_rate && (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
            <span className="text-white font-bold text-xs flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {link.commission_rate}% 佣金
            </span>
          </div>
        )}
      </div>

      {/* 产品信息 */}
      <div className="p-4">
        <h3 className={`font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {link.product_name}
        </h3>

        {/* 数据统计 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <MousePointer2 className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {link.click_count || 0} 点击
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {link.conversion_count || 0} 成交
            </span>
          </div>
        </div>

        {/* 购买按钮 */}
        <button
          onClick={handleLinkClick}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>立即购买</span>
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* 提示信息 */}
        <p className={`text-xs mt-3 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          通过此链接购买，创作者将获得佣金
        </p>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 商单链接列表组件（用于作品详情页）
// ============================================================================

interface WorkProductLinksProps {
  workId: string;
  isDark: boolean;
  onLinkClick?: (link: orderExecutionService.ProductLink) => void;
}

const WorkProductLinks: React.FC<WorkProductLinksProps> = ({ workId, isDark, onLinkClick }) => {
  const [links, setLinks] = useState<orderExecutionService.ProductLink[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadLinks = async () => {
      try {
        const productLinks = await orderExecutionService.getWorkProductLinks(workId);
        setLinks(productLinks);
      } catch (error) {
        console.error('加载产品链接失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLinks();
  }, [workId]);

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-48 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-6 w-3/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-4 w-1/2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
      </div>
    );
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <ShoppingBag className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          相关推荐
        </h2>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          ({links.length})
        </span>
      </div>

      {/* 链接列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {links.map((link) => (
          <ProductLinkCard
            key={link.id}
            link={link}
            workId={workId}
            isDark={isDark}
            onLinkClick={() => onLinkClick?.(link)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 悬浮卡片样式（类似 B 站）
// ============================================================================

interface FloatingProductCardProps {
  link: orderExecutionService.ProductLink;
  isDark: boolean;
  onClose?: () => void;
}

const FloatingProductCard: React.FC<FloatingProductCardProps> = ({ link, isDark, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md rounded-2xl overflow-hidden shadow-2xl z-50 ${
        isDark
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-200'
      }`}
    >
      <div className="flex">
        {/* 产品图片 */}
        <div className="w-32 h-32 flex-shrink-0">
          {link.product_image ? (
            <img src={link.product_image} alt={link.product_name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <ShoppingBag className={`w-12 h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          )}
        </div>

        {/* 产品信息 */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className={`font-bold text-sm mb-1 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {link.product_name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-red-500">
                ¥{link.price?.toLocaleString() || '0'}
              </span>
              {link.commission_rate && (
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full">
                  佣金{link.commission_rate}%
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              关闭
            </button>
            <a
              href={link.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              购买
            </a>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 p-1.5 rounded-full ${
            isDark ? 'bg-black/50 text-white' : 'bg-white/80 text-gray-700'
          }`}
        >
          <span className="text-xs">×</span>
        </button>
      </div>
    </motion.div>
  );
};

export { WorkProductLinks, ProductLinkCard, FloatingProductCard };
