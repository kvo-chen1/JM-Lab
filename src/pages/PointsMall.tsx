import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import productService, { Product, ProductCategory, ExchangeRecord } from '@/services/productService';
import pointsService from '@/services/pointsService';

const PointsMall: React.FC = () => {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecord[]>([]);
  const [showRecords, setShowRecords] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // 加载商品和积分数据
  useEffect(() => {
    const allProducts = productService.getAllProducts();
    const records = productService.getUserExchangeRecords('current-user');
    const points = pointsService.getCurrentPoints();
    setProducts(allProducts);
    setFilteredProducts(allProducts);
    setExchangeRecords(records);
    setCurrentPoints(points);
  }, []);

  // 处理分类筛选
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

  // 处理商品兑换
  const handleExchange = (product: Product) => {
    try {
      const record = productService.exchangeProduct(product.id, 'current-user');
      setExchangeRecords([record, ...exchangeRecords]);
      setCurrentPoints(pointsService.getCurrentPoints());
      
      // 更新商品库存
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, stock: p.stock - 1 } : p
      ));
      
      alert(`兑换成功！消耗${product.points}积分`);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  // 分类选项
  const categories = [
    { value: 'all', label: '全部' },
    { value: 'virtual', label: '虚拟商品' },
    { value: 'physical', label: '实物商品' },
    { value: 'service', label: '服务' },
    { value: 'rights', label: '权益' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <main className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">积分商城</h1>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-full px-4 py-2 shadow-md`}>
            <span className="font-medium">当前积分：</span>
            <span className={`ml-2 font-bold ${isDark ? 'text-red-400' : 'text-red-500'}`}>{currentPoints}</span>
          </div>
        </div>

        {/* 搜索和分类筛选 */}
        <div className="mb-8">
          <div className="mb-4">
            <input
              type="text"
              placeholder="搜索商品..."
              className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category.value 
                  ? isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white' 
                  : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* 商品列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden`}
            >
              {/* 商品图片 */}
              <div className="h-48 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    console.error('Image failed to load:', product.imageUrl);
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder-image.svg'; // 使用占位图片
                  }}
                />
              </div>
              
              {/* 商品信息 */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-red-900 bg-opacity-50' : 'bg-red-100'} text-red-500`}>
                    {product.points} 积分
                  </span>
                </div>
                
                <p className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {product.description}
                </p>
                
                {/* 商品标签 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* 商品状态和兑换按钮 */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      库存：{product.stock}
                    </span>
                    <span className={`text-xs mt-1 ${product.status === 'active' ? 'text-green-500' : product.status === 'inactive' ? 'text-gray-500' : 'text-red-500'}`}>
                      {product.status === 'active' ? '已上架' : product.status === 'inactive' ? '已下架' : '已售罄'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleExchange(product)}
                    disabled={product.status !== 'active' || product.stock <= 0 || currentPoints < product.points}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark 
                      ? currentPoints < product.points || product.stock <= 0 || product.status !== 'active' 
                        ? 'bg-gray-700 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700' 
                      : currentPoints < product.points || product.stock <= 0 || product.status !== 'active' 
                        ? 'bg-gray-200 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600'} text-white disabled:opacity-50`}
                  >
                    {product.status !== 'active' ? '已下架' : product.stock <= 0 ? '已售罄' : currentPoints < product.points ? '积分不足' : '立即兑换'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 无商品提示 */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">未找到商品</h3>
            <p className="opacity-70">请尝试调整搜索条件或分类</p>
          </div>
        )}

        {/* 兑换记录 */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">兑换记录</h2>
            <button
              onClick={() => setShowRecords(!showRecords)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {showRecords ? '隐藏' : '查看'}
            </button>
          </div>
          
          {showRecords && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden`}
            >
              {exchangeRecords.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="opacity-70">暂无兑换记录</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className={`${isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                      <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>商品名称</th>
                      <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>积分</th>
                      <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>日期</th>
                      <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangeRecords.map(record => (
                      <tr key={record.id} className={`${isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                        <td className="p-4">{record.productName}</td>
                        <td className="p-4">{record.points}</td>
                        <td className="p-4 text-sm opacity-70">{record.date}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'completed' 
                            ? 'bg-green-500 text-white' 
                            : record.status === 'pending' 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-red-500 text-white'}`}
                          >
                            {record.status === 'completed' ? '已完成' : record.status === 'pending' ? '处理中' : '已取消'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PointsMall;
