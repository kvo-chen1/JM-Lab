import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, ExternalLink, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import * as orderExecutionService from '@/services/orderExecutionService';

interface ProductLinkData {
  product_name: string;
  product_url: string;
  product_image?: string;
  price?: number;
  commission_rate?: number;
}

interface ProductLinkSelectorProps {
  workId?: string;
  onLinksChange?: (links: ProductLinkData[]) => void;
  isDark: boolean;
}

const ProductLinkSelector: React.FC<ProductLinkSelectorProps> = ({ workId, onLinksChange, isDark }) => {
  const [showAddLink, setShowAddLink] = useState(false);
  const [links, setLinks] = useState<ProductLinkData[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 添加商单链接
  const handleAddLink = async (linkData: ProductLinkData) => {
    if (!workId) {
      toast.error('请先保存作品');
      return;
    }

    setLoading(true);
    try {
      const linkId = await orderExecutionService.addWorkProductLink({
        work_id: workId,
        order_id: selectedOrderId || undefined,
        ...linkData,
      });

      if (linkId) {
        setLinks([...links, linkData]);
        setShowAddLink(false);
        toast.success('商单链接添加成功');
        onLinksChange?.([...links, linkData]);
      } else {
        toast.error('添加失败，请重试');
      }
    } catch (error) {
      console.error('添加商单链接失败:', error);
      toast.error('添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
    onLinksChange?.(newLinks);
    toast.success('已移除链接');
  };

  return (
    <div className="space-y-4">
      {/* 商单链接列表 */}
      {links.length > 0 && (
        <div className="space-y-3">
          {links.map((link, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {link.product_image ? (
                  <img
                    src={link.product_image}
                    alt={link.product_name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <ShoppingBag className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {link.product_name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      价格：¥{link.price?.toLocaleString() || '0'}
                    </span>
                    <span className="text-emerald-500 font-medium">
                      佣金：{link.commission_rate}%
                    </span>
                  </div>
                  <a
                    href={link.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-500 mt-2 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    查看商品
                  </a>
                </div>

                <button
                  onClick={() => handleRemoveLink(index)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-red-500/20 text-red-400'
                      : 'hover:bg-red-50 text-red-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 添加按钮 */}
      {!showAddLink && (
        <button
          type="button"
          onClick={() => setShowAddLink(true)}
          className={`w-full py-3 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
            isDark
              ? 'border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-400'
              : 'border-gray-300 hover:border-blue-500 text-gray-500 hover:text-blue-500'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span>添加商单链接</span>
        </button>
      )}

      {/* 添加表单 */}
      {showAddLink && (
        <AddLinkForm
          isDark={isDark}
          onAdd={handleAddLink}
          onCancel={() => setShowAddLink(false)}
          loading={loading}
          selectedOrderId={selectedOrderId}
          setSelectedOrderId={setSelectedOrderId}
        />
      )}
    </div>
  );
};

// ============================================================================
// 添加链接表单
// ============================================================================

interface AddLinkFormProps {
  isDark: boolean;
  onAdd: (data: ProductLinkData) => void;
  onCancel: () => void;
  loading: boolean;
  selectedOrderId: string;
  setSelectedOrderId: (id: string) => void;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({
  isDark,
  onAdd,
  onCancel,
  loading,
  selectedOrderId,
  setSelectedOrderId,
}) => {
  const [formData, setFormData] = useState<ProductLinkData>({
    product_name: '',
    product_url: '',
    product_image: '',
    price: 0,
    commission_rate: 10,
  });

  const handleSubmit = () => {
    if (!formData.product_name.trim() || !formData.product_url.trim()) {
      toast.error('请填写产品名称和链接');
      return;
    }

    onAdd(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-xl border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        添加商单链接
      </h4>

      <div className="space-y-4">
        {/* 产品名称 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            产品名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            placeholder="例如：SINSIN 冰皮防晒衣"
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              isDark
                ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } focus:outline-none`}
          />
        </div>

        {/* 产品链接 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            产品链接 <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.product_url}
            onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
            placeholder="https://..."
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              isDark
                ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } focus:outline-none`}
          />
        </div>

        {/* 产品图片 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            产品图片
          </label>
          <input
            type="url"
            value={formData.product_image}
            onChange={(e) => setFormData({ ...formData, product_image: e.target.value })}
            placeholder="产品图片 URL"
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              isDark
                ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } focus:outline-none`}
          />
        </div>

        {/* 价格和佣金 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              价格（元）
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700 text-white focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              佣金比例（%）
            </label>
            <input
              type="number"
              value={formData.commission_rate}
              onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700 text-white focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
              } focus:outline-none`}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '添加中...' : '确认添加'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductLinkSelector;
