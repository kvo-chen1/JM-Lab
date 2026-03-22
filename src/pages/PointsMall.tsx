import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import productService, { Product, ProductCategory, ExchangeRecord } from '@/services/productService';
import { useSupabasePoints } from '@/hooks/useSupabasePoints';
import { toast } from 'sonner';
import { Search, ShoppingCart, History, Package, CheckCircle, AlertCircle, Coins, Tag, Box, Gift } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import BlindBoxSection from '@/components/points-mall/BlindBoxSection';
import blindBoxService, { BlindBox } from '@/services/blindBoxService';
import { useNavigate } from 'react-router-dom';

const PointsMall: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecord[]>([]);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedBlindBox, setSelectedBlindBox] = useState<BlindBox | null>(null);
  const [showBlindBoxConfirm, setShowBlindBoxConfirm] = useState(false);

  // 使用 Supabase 积分服务获取真实积分
  const { balance, isLoading: pointsLoading, refreshBalance, consumePoints } = useSupabasePoints();
  const currentPoints = balance?.balance || 0;
  const userId = user?.id;

  // 加载商品和积分数据
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 获取商品列表（支持分类和搜索）
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const allProducts = await productService.getAllProducts(category, searchQuery || undefined);
      
      // 获取用户兑换记录
      let records: ExchangeRecord[] = [];
      if (userId) {
        records = await productService.getUserExchangeRecords(userId);
      }
      
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      setExchangeRecords(records);
      
      // 刷新积分余额
      await refreshBalance();
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [userId, refreshBalance, selectedCategory, searchQuery]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 监听积分更新事件
  useEffect(() => {
    const handlePointsUpdate = async () => {
      // 刷新积分余额
      await refreshBalance();
      // 刷新兑换记录
      if (userId) {
        const records = await productService.getUserExchangeRecords(userId);
        setExchangeRecords(records);
      }
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate as EventListener);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate as EventListener);
  }, [userId, refreshBalance]);

  // 处理分类筛选和搜索（前端筛选，因为已经从后端获取了数据）
  useEffect(() => {
    let result = [...products];
    
    if (selectedCategory !== 'all' && selectedCategory !== 'blind-box') {
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
    if (!userId) {
      toast.error('请先登录');
      return;
    }
    
    if (product.status !== 'on_sale') {
      toast.error('该商品暂时无法兑换');
      return;
    }
    if (product.stock <= 0) {
      toast.error('该商品已售罄');
      return;
    }
    if (currentPoints < product.price) {
      toast.error('积分不足，快去完成任务获取积分吧！');
      return;
    }
    
    setSelectedProduct(product);
    setShowConfirmDialog(true);
  };

  // 打开盲盒兑换确认对话框
  const openBlindBoxExchangeDialog = (box: BlindBox) => {
    if (!userId) {
      toast.error('请先登录');
      return;
    }
    
    if (!box.available) {
      toast.error('该盲盒已售罄');
      return;
    }
    
    if (currentPoints < box.price) {
      toast.error('积分不足，快去完成任务获取积分吧！');
      return;
    }
    
    setSelectedBlindBox(box);
    setShowBlindBoxConfirm(true);
  };

  // 处理盲盒兑换
  const handleExchangeBlindBox = async () => {
    if (!selectedBlindBox || !userId) return;

    try {
      setIsLoading(true);

      // 扣除积分（使用 useSupabasePoints 的 consumePoints）
      const pointsResult = await consumePoints(
        selectedBlindBox.price,
        'blind_box_exchange',
        'exchange',
        `兑换${selectedBlindBox.name}`
      );

      if (!pointsResult) {
        throw new Error('积分扣减失败');
      }
      
      // 购买盲盒（更新库存）
      const success = blindBoxService.purchaseBlindBox(selectedBlindBox.id, userId);
      
      if (!success) {
        throw new Error('盲盒购买失败');
      }
      
      // 刷新积分余额
      await refreshBalance();
      
      // 关闭对话框
      setShowBlindBoxConfirm(false);
      setSelectedBlindBox(null);
      
      // 显示成功消息
      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-500" />
            兑换成功！
          </div>
          <div className="text-sm">{selectedBlindBox.name}</div>
          <div className="text-sm text-red-400">消耗 {selectedBlindBox.price} 积分</div>
        </div>
      );
      
      // 触发积分更新事件
      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: { 
          newBalance: currentPoints - selectedBlindBox.price,
          change: -selectedBlindBox.price,
          type: 'spent',
          source: 'blind_box'
        }
      }));
      
      // 跳转到盲盒开启页面
      setTimeout(() => {
        navigate(`/blind-box?boxId=${selectedBlindBox.id}&autoOpen=true`);
      }, 1000);
      
    } catch (error: any) {
      console.error('盲盒兑换失败:', error);
      toast.error(error.message || '兑换失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理商品兑换
  const handleExchange = async () => {
    if (!selectedProduct || !userId) return;

    try {
      setIsLoading(true);
      
      // 使用新的 RPC 函数兑换商品（自动处理积分扣减和库存扣减）
      const result = await productService.exchangeProduct(selectedProduct.id, userId);

      if (!result.success) {
        throw new Error(result.errorMessage || '兑换失败');
      }
      
      // 刷新兑换记录
      const records = await productService.getUserExchangeRecords(userId);
      setExchangeRecords(records);
      
      // 刷新商品列表（更新库存）
      const allProducts = await productService.getAllProducts();
      setProducts(allProducts);
      
      // 刷新积分余额
      await refreshBalance();

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
          <div className="text-sm text-green-400">剩余积分：{currentPoints - selectedProduct.points}</div>
        </div>
      );

      // 触发积分更新事件
      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: { 
          newBalance: currentPoints - selectedProduct.points,
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
    { value: 'blind-box', label: '盲盒', icon: Gift },
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
      case 'on_sale':
        return '可兑换';
      case 'off_shelf':
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
                  <div className="text-2xl font-bold text-yellow-500">
                    {pointsLoading ? '...' : currentPoints}
                  </div>
                </div>
              </motion.div>

              {/* 兑换记录按钮 */}
              <button
                onClick={() => setShowRecordsModal(true)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } shadow-lg`}
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:inline">兑换记录</span>
                {exchangeRecords.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    isDark ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
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

        {/* 盲盒专区（当选择"全部"或"盲盒"分类时显示） */}
        {(selectedCategory === 'all' || selectedCategory === 'blind-box') && (
          <BlindBoxSection 
            onExchangeBlindBox={openBlindBoxExchangeDialog}
            currentPoints={currentPoints}
          />
        )}

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
                      {product.price} 积分
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
                        disabled={product.status !== 'on_sale' || product.stock <= 0 || !userId}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          product.status !== 'on_sale' || product.stock <= 0
                            ? isDark 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : !userId
                              ? isDark
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : currentPoints < product.price
                              ? isDark
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isDark
                                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-600/30'
                                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30'
                        }`}
                      >
                        {product.status !== 'on_sale' 
                          ? '已下架' 
                          : product.stock <= 0 
                            ? '已售罄' 
                            : !userId
                              ? '请登录'
                              : currentPoints < product.price 
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

        {/* 兑换记录弹窗 */}
        <AnimatePresence>
          {showRecordsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
              onClick={() => setShowRecordsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col`}
                onClick={e => e.stopPropagation()}
              >
                {/* 弹窗头部 */}
                <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                      <History className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">兑换记录</h2>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        共 {exchangeRecords.length} 条记录
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRecordsModal(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 弹窗内容 */}
                <div className="flex-1 overflow-hidden">
                  {exchangeRecords.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <Package className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        暂无兑换记录
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        快去兑换心仪的商品吧！
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[calc(80vh-140px)]">
                      <table className="w-full">
                        <thead className={`sticky top-0 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                          <tr className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
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
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`${isDark ? 'border-b border-gray-700/50 hover:bg-gray-700/30' : 'border-b border-gray-100 hover:bg-gray-50'} last:border-0 transition-colors`}
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                                  }`}>
                                    <Package className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                  </div>
                                  <div className="font-medium">{record.productName}</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-red-500 font-medium">-{record.points}</span>
                              </td>
                              <td className="p-4 text-sm opacity-70">
                                {new Date(record.date).toLocaleString('zh-CN')}
                              </td>
                              <td className="p-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                  record.status === 'completed'
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : record.status === 'pending'
                                      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                      : record.status === 'processing'
                                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
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

                {/* 弹窗底部 */}
                <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
                  <button
                    onClick={() => setShowRecordsModal(false)}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    关闭
                  </button>
                </div>
              </motion.div>
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
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

        {/* 盲盒兑换确认对话框 */}
        <AnimatePresence>
          {showBlindBoxConfirm && selectedBlindBox && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
              onClick={() => setShowBlindBoxConfirm(false)}
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
                    isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <Gift className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">确认兑换盲盒</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    您确定要兑换这个盲盒吗？
                  </p>
                </div>

                <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={selectedBlindBox.image} 
                      alt={selectedBlindBox.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold">{selectedBlindBox.name}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedBlindBox.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>稀有度</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedBlindBox.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' :
                      selectedBlindBox.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' :
                      selectedBlindBox.rarity === 'rare' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {selectedBlindBox.rarity === 'legendary' ? '传奇' :
                       selectedBlindBox.rarity === 'epic' ? '史诗' :
                       selectedBlindBox.rarity === 'rare' ? '稀有' : '普通'}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-600/20">
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>消耗积分</span>
                      <span className="text-xl font-bold text-purple-500">{selectedBlindBox.price}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>兑换后剩余</span>
                      <span className="font-medium">{currentPoints - selectedBlindBox.price}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBlindBoxConfirm(false)}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleExchangeBlindBox}
                    disabled={isLoading}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      isDark
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
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
