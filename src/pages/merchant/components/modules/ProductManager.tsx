/**
 * 商家工作平台 - 商品管理模块
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit3,
  Eye,
  ArrowUpDown,
  Grid3X3,
  List,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// 模拟商品数据
const mockProducts = [
  { id: 1, name: '津小脉文创 T 恤', price: 500, stock: 100, sales: 45, status: 'on_sale', category: '服饰配饰', image: null },
  { id: 2, name: '津脉智坊定制笔记本', price: 300, stock: 200, sales: 128, status: 'on_sale', category: '文具用品', image: null },
  { id: 3, name: '天津文化明信片套装', price: 200, stock: 500, sales: 256, status: 'on_sale', category: '文具用品', image: null },
  { id: 4, name: '津小脉毛绒公仔', price: 800, stock: 50, sales: 32, status: 'on_sale', category: '毛绒玩具', image: null },
  { id: 5, name: '智能保温杯', price: 600, stock: 150, sales: 89, status: 'on_sale', category: '数码配件', image: null },
  { id: 6, name: '无线充电宝', price: 1200, stock: 80, sales: 67, status: 'on_sale', category: '数码配件', image: null },
];

const ProductManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // 筛选商品
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // 统计数据
  const stats = {
    total: mockProducts.length,
    onSale: mockProducts.filter(p => p.status === 'on_sale').length,
    offShelf: mockProducts.filter(p => p.status === 'off_shelf').length,
    lowStock: mockProducts.filter(p => p.stock < 20).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_sale':
        return <Badge className="bg-emerald-500 border-0">销售中</Badge>;
      case 'off_shelf':
        return <Badge className="bg-slate-500 border-0">已下架</Badge>;
      default:
        return <Badge className="border-0">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">商品管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">管理您的商品，支持上架、下架、编辑等操作</p>
        </div>
        <Button className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white">
          <Plus className="w-4 h-4 mr-2" />
          发布商品
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#5ba3d4]/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#5ba3d4]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">商品总数</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">销售中</p>
              <p className="text-xl font-bold text-emerald-400">{stats.onSale}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已下架</p>
              <p className="text-xl font-bold text-slate-400">{stats.offShelf}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">库存预警</p>
              <p className="text-xl font-bold text-red-400">{stats.lowStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="搜索商品名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 bg-[#1a1a1a] text-white text-sm"
          >
            <option value="all">全部状态</option>
            <option value="on_sale">销售中</option>
            <option value="off_shelf">已下架</option>
          </select>

          {/* 分类筛选 */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 bg-[#1a1a1a] text-white text-sm"
          >
            <option value="all">全部分类</option>
            <option value="服饰配饰">服饰配饰</option>
            <option value="文具用品">文具用品</option>
            <option value="毛绒玩具">毛绒玩具</option>
            <option value="数码配件">数码配件</option>
          </select>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 bg-[#1a1a1a] text-white text-sm"
          >
            <option value="newest">最新上架</option>
            <option value="price_asc">价格从低到高</option>
            <option value="price_desc">价格从高到低</option>
            <option value="sales">销量优先</option>
          </select>

          {/* 视图切换 */}
          <div className="flex items-center bg-[#1a1a1a] rounded-lg p-0.5 border border-[#2a2a2a]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid' 
                  ? 'bg-[#2a2a2a] text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list' 
                  ? 'bg-[#2a2a2a] text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">
            商品列表
            <span className="ml-2 text-sm font-normal text-gray-500">
              共 {filteredProducts.length} 件
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
              批量上架
            </Button>
            <Button variant="outline" size="sm" className="border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
              批量下架
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden hover:border-[#3a3a3a] transition-all group"
              >
                {/* 商品图片 */}
                <div className="aspect-[4/3] bg-[#0a0a0a] flex items-center justify-center relative">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-[#3a3a3a]" />
                  )}
                  <div className="absolute top-2 left-2">
                    {getStatusBadge(product.status)}
                  </div>
                  {product.stock < 20 && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">库存紧张</span>
                    </div>
                  )}
                </div>

                {/* 商品信息 */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                  <h4 className="font-medium text-white mb-2 line-clamp-1">{product.name}</h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-[#5ba3d4]">¥{product.price}</span>
                    <span className="text-sm text-gray-500">库存 {product.stock}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">销量 {product.sales}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all"
              >
                <div className="w-16 h-16 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="w-6 h-6 text-[#3a3a3a]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{product.category}</p>
                  <h4 className="font-medium text-white">{product.name}</h4>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#5ba3d4]">¥{product.price}</p>
                  <p className="text-sm text-gray-500">库存 {product.stock}</p>
                </div>
                <div>{getStatusBadge(product.status)}</div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;
