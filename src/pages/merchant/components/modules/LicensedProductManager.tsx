/**
 * 商家工作台 - 授权IP产品管理模块
 * 管理通过品牌授权创建的文创产品
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
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
  AlertCircle,
  Building2,
  DollarSign,
  Package,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { copyrightLicenseService } from '@/services/copyrightLicenseService';
import type { LicensedProduct } from '@/types/copyright-license';

// 模拟授权IP产品数据
const mockLicensedProducts: LicensedProduct[] = [
  { 
    id: '1', 
    productName: '津小脉 x 品牌A 联名T恤', 
    price: 299, 
    stock: 100, 
    salesCount: 45, 
    status: 'on_sale', 
    productCategory: '服装配饰', 
    productImages: [],
    brandName: '品牌A',
    applicationId: 'app-1',
    brandId: 'brand-1',
    creatorId: 'creator-1',
    revenue: 13455,
    platformFee: 1345.5,
    brandShare: 2691,
    creatorShare: 9418.5,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  { 
    id: '2', 
    productName: '津脉智坊 x 品牌B 定制笔记本', 
    price: 89, 
    stock: 200, 
    salesCount: 128, 
    status: 'on_sale', 
    productCategory: '文具办公', 
    productImages: [],
    brandName: '品牌B',
    applicationId: 'app-2',
    brandId: 'brand-2',
    creatorId: 'creator-1',
    revenue: 11392,
    platformFee: 1139.2,
    brandShare: 2278.4,
    creatorShare: 7974.4,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z'
  },
  { 
    id: '3', 
    productName: '天津文化 x 品牌C 明信片套装', 
    price: 39, 
    stock: 500, 
    salesCount: 256, 
    status: 'on_sale', 
    productCategory: '文具办公', 
    productImages: [],
    brandName: '品牌C',
    applicationId: 'app-3',
    brandId: 'brand-3',
    creatorId: 'creator-1',
    revenue: 9984,
    platformFee: 998.4,
    brandShare: 1996.8,
    creatorShare: 6988.8,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z'
  },
];

const LicensedProductManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<LicensedProduct[]>(mockLicensedProducts);

  // 筛选产品
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.productCategory === categoryFilter;
    const matchesBrand = brandFilter === 'all' || product.brandName === brandFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesBrand;
  });

  // 统计数据
  const stats = {
    total: products.length,
    onSale: products.filter(p => p.status === 'on_sale').length,
    pending: products.filter(p => p.status === 'pending_review').length,
    totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
    totalSales: products.reduce((sum, p) => sum + p.salesCount, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_sale':
        return <Badge className="bg-emerald-500 border-0">销售中</Badge>;
      case 'pending_review':
        return <Badge className="bg-amber-500 border-0">审核中</Badge>;
      case 'draft':
        return <Badge className="bg-slate-500 border-0">草稿</Badge>;
      case 'sold_out':
        return <Badge className="bg-red-500 border-0">已售罄</Badge>;
      default:
        return <Badge className="border-0">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-400" />
            授权IP产品管理
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">管理您的品牌授权文创产品</p>
        </div>
        <Button className="bg-violet-500 hover:bg-violet-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          创建授权产品
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">授权产品总数</p>
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
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总销量</p>
              <p className="text-xl font-bold text-cyan-400">{stats.totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总收益</p>
              <p className="text-xl font-bold text-amber-400">¥{stats.totalRevenue.toLocaleString()}</p>
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
                placeholder="搜索授权产品名称..."
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
            <option value="pending_review">审核中</option>
            <option value="draft">草稿</option>
            <option value="sold_out">已售罄</option>
          </select>

          {/* 分类筛选 */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 bg-[#1a1a1a] text-white text-sm"
          >
            <option value="all">全部分类</option>
            <option value="服装配饰">服装配饰</option>
            <option value="文具办公">文具办公</option>
            <option value="家居用品">家居用品</option>
            <option value="数字产品">数字产品</option>
          </select>

          {/* 品牌筛选 */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 bg-[#1a1a1a] text-white text-sm"
          >
            <option value="all">全部品牌</option>
            <option value="品牌A">品牌A</option>
            <option value="品牌B">品牌B</option>
            <option value="品牌C">品牌C</option>
          </select>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 bg-[#1a1a1a] text-white text-sm"
          >
            <option value="newest">最新创建</option>
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

      {/* 产品列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden group hover:border-violet-500/50 transition-all"
            >
              {/* 产品图片 */}
              <div className="aspect-square bg-[#1a1a1a] relative">
                {product.productImages[0] ? (
                  <img 
                    src={product.productImages[0]} 
                    alt={product.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <Package className="w-12 h-12" />
                  </div>
                )}
                {/* 授权标识 */}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-violet-500 text-white text-xs font-medium flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  授权
                </div>
              </div>

              {/* 产品信息 */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium line-clamp-1 flex-1">{product.productName}</h3>
                  {getStatusBadge(product.status)}
                </div>

                {/* 品牌信息 */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Building2 className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-sm text-gray-400">{product.brandName}</span>
                </div>

                {/* 价格信息 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-emerald-400">¥{product.price}</span>
                  <span className="text-sm text-gray-500">库存: {product.stock}</span>
                </div>

                {/* 销售数据 */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>销量: {product.salesCount}</span>
                  <span>收益: ¥{product.creatorShare?.toLocaleString()}</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-[#2a2a2a] hover:bg-[#2a2a2a] text-gray-300"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-[#2a2a2a] hover:bg-[#2a2a2a] text-gray-300"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">产品信息</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">品牌</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">价格</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">销量</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">状态</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">收益</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                        {product.productImages[0] ? (
                          <img 
                            src={product.productImages[0]} 
                            alt={product.productName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{product.productName}</p>
                        <p className="text-sm text-gray-500">{product.productCategory}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-violet-400" />
                      <span className="text-gray-300">{product.brandName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-400 font-medium">¥{product.price}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{product.salesCount}</td>
                  <td className="py-3 px-4">{getStatusBadge(product.status)}</td>
                  <td className="py-3 px-4">
                    <span className="text-amber-400">¥{product.creatorShare?.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LicensedProductManager;
