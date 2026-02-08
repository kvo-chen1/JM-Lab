import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import productService, { Product, ProductCategory, ExchangeRecord } from '@/services/productService';
import pointsService from '@/services/pointsService';
import { toast } from 'sonner';
import { Search, ShoppingCart, History, Package, CheckCircle, AlertCircle, Coins, Tag, Box } from 'lucide-react';

const PointsMall: React.FC = () => {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecord[]>([]);
  const [showRecords, setShowRecords] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const userId = 'current-user'; // 实际项目中应从认证上下文获取

  // 加载商品和积分数据
  const loadData = useCallback(() => {
    try {
      setIsLoading(true);
      const allProducts = productService.getAllProducts();
      const records = productService.getUserExchangeRecords(userId);
      const points = pointsService.getCurrentPoints();
      
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      setExchangeRecords(records);
      setCurrentPoints(points);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 监听积分更新事件
  useEffect(() => {
    const handlePointsUpdate = (event: CustomEvent) => {
      setCurrentPoints(pointsService.getCurrentPoints());
      // 如果有兑换记录更新，刷新记录
      const records = productService.getUserExchangeRecords(userId);
      setExchangeRecords(records);
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate as EventListener);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate as EventListener);
  }, [userId]);

  // 处理分类筛选和搜索
  useEffect(() => {
    let result = [...products];
    
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, products]);

  // 打开兑换确认对话框
  const openExchangeDialog = (product: Product) => {
    if (product.status !== 'active') {
      toast.error('该商品暂时无法兑换');
      return;
    }
    if (product.stock <= 0) {
      toast.error('该商品已售罄');
      return;
    }
    if (currentPoints < product.points) {
      toast.error('积分不足，快去完成任务获取积分吧！');
      return;
    }
    
    setSelectedProduct(product);
    setShowConfirmDialog(true);
  };

  // 处理商品兑换
  const handleExchange = async () => {
    if (!selectedProduct) return;

    try {
      setIsLoading(true);
      
      // 执行兑换
      const record = productService.exchangeProduct(selectedProduct.id, userId);
      
      // 更新状态
      setExchangeRecords(prev => [record, ...prev]);
      setCurrentPoints(pointsService.getCurrentPoints());
      
      // 更新商品库存
      setProducts(prev => prev.map(p => 
        p.id === selectedProduct.id ? { ...p, stock: p.stock - 1 } : p
      ));

      // 关闭对话框
      setShowConfirmDialog(false);
      setSelectedProduct(null);

      // 显示成功消息
      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            兑换成功！
          </div>
          <div className="text-sm">{selectedProduct.name}</div>
          <div className="text-sm text-red-400">消耗 {selectedProduct.points} 积分</div>
          <div className="text-sm text-green-400">剩余积分：{pointsService.getCurrentPoints()}</div>
        </div>
      );

      // 触发积分更新事件
      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: { 
          newBalance: pointsService.getCurrentPoints(),
          change: -selectedProduct.points,
          type: 'spent',
          source: 'exchange'
        }
      }));
    } catch (error: any) {
      console.error('兑换失败:', error);
      toast.error(error.message || '兑换失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 分类选项
  const categories = [
    { value: 'all', label: '全部', icon: Box },
    { value: 'virtual', label: '虚拟商品', icon: Tag },
    { value: 'physical', label: '实物商品', icon: Package },
    { value: 'service', label: '服务', icon: ShoppingCart },
    { value: 'rights', label: '权益', icon: CheckCircle }
  ];

  // 获取状态样式
  const getStatusStyle = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'sold_out':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 获取状态文本
  const getStatusText = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return '可兑换';
      case 'inactive':
        return '已下架';
      case 'sold_out':
        return '已售罄';
      default:
        return '未知';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <main className="container mx-auto px-4 py-8">
        {/* 头部区域 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">积分商城</h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                使用积分兑换精美商品和专属权益
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* 积分显示 */}
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } shadow-lg`}
              >
                <div className={`p-2 rounded-full ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                  <Coins className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>当前积分</div>
                  <div className="text-2xl font-bold text-yellow-500">{currentPoints}</div>
                </div>
              </motion.div>

              {/* 兑换记录按钮 */}
              <button
                onClick={() => setShowRecords(!showRecords)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  showRecords
                    ? isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                    : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } shadow-lg`}
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:inline">兑换记录</span>
                {exchangeRecords.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    showRecords ? 'bg-white/20' : isDark ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                  }`}>
                    {exchangeRecords.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 搜索和分类筛选 */}
        <div className="mb-8 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="搜索商品..."
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 focus:border-red-500 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-200 focus:border-red-500 text-gray-900 placeholder-gray-400'
              } focus:outline-none`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 分类按钮 */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === category.value 
                      ? isDark 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                        : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : isDark 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                  } shadow-sm`}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 商品列表 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
              isDark ? 'border-red-500' : 'border-red-600'
            }`}></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow`}
                >
                  {/* 商品图片 */}
                  <div className="relative h-48 overflow-hidden group">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-image.svg';
                      }}
                    />
                    {/* 状态标签 */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs text-white ${getStatusStyle(product.status)}`}>
                      {getStatusText(product.status)}
                    </div>
                    {/* 积分标签 */}
                    <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-sm font-bold ${
                      isDark ? 'bg-gray-900/80 text-yellow-400' : 'bg-white/90 text-yellow-600'
                    }`}>
                      {product.points} 积分
                    </div>
                  </div>
                  
                  {/* 商品信息 */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                    
                    <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.description}
                    </p>
                    
                    {/* 商品标签 */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* 库存和兑换按钮 */}
                    <div className="flex items-center justify-between">
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        库存: <span className={product.stock < 10 ? 'text-red-500 font-medium' : ''}>{product.stock}</span>
                      </div>
                      <button
                        onClick={() => openExchangeDialog(product)}
                        disabled={product.status !== 'active' || product.stock <= 0}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          product.status !== 'active' || product.stock <= 0
                            ? isDark 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : currentPoints < product.points
                              ? isDark
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isDark
                                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-600/30'
                                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30'
                        }`}
                      >
                        {product.status !== 'active' 
                          ? '已下架' 
                          : product.stock <= 0 
                            ? '已售罄' 
                            : currentPoints < product.points 
                              ? '积分不足'
                              : '立即兑换'
                        }
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 无商品提示 */}
        {!isLoading && filteredProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Search className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className="text-lg font-medium mb-2">未找到商品</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              请尝试调整搜索条件或分类
            </p>
          </motion.div>
        )}

        {/* 兑换记录 */}
        <AnimatePresence>
          {showRecords && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-12"
            >
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5" />
                <h2 className="text-xl font-bold">兑换记录</h2>
              </div>
              
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
                {exchangeRecords.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>暂无兑换记录</p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      快去兑换心仪的商品吧！
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>商品名称</th>
                          <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>消耗积分</th>
                          <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>兑换时间</th>
                          <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exchangeRecords.map((record, index) => (
                          <motion.tr 
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`${isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'} last:border-0`}
                          >
                            <td className="p-4">
                              <div className="font-medium">{record.productName}</div>
                            </td>
                            <td className="p-4">
                              <span className="text-red-500 font-medium">-{record.points}</span>
                            </td>
                            <td className="p-4 text-sm opacity-70">
                              {new Date(record.date).toLocaleString('zh-CN')}
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                record.status === 'completed' 
                                  ? 'bg-green-500 text-white' 
                                  : record.status === 'pending' 
                                    ? 'bg-yellow-500 text-white' 
                                    : record.status === 'processing'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-red-500 text-white'
                              }`}>
                                {record.status === 'completed' 
                                  ? '已完成' 
                                  : record.status === 'pending' 
                                    ? '待处理' 
                                    : record.status === 'processing'
                                      ? '处理中'
                                      : '已取消'
                                }
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 兑换确认对话框 */}
        <AnimatePresence>
          {showConfirmDialog && selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowConfirmDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full shadow-2xl`}
                onClick={e => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
                  }`}>
                    <AlertCircle className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">确认兑换</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    您确定要兑换以下商品吗？
                  </p>
                </div>

                <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold">{selectedProduct.name}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedProduct.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-600/20">
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>消耗积分</span>
                      <span className="text-xl font-bold text-red-500">{selectedProduct.points}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>兑换后剩余</span>
                      <span className="font-medium">{currentPoints - selectedProduct.points}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleExchange}
                    disabled={isLoading}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      isDark
                        ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                    } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        处理中...
                      </span>
                    ) : (
                      '确认兑换'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PointsMall;
