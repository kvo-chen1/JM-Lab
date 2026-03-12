/**
 * 商家工作平台 - 商品管理模块
 * 使用真实数据库数据
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { merchantService } from '@/services/merchantService';
import { toast } from 'sonner';
import ProductPublishForm from '../ProductPublishForm';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sales_count: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  category: string;
  images: string[];
}

const ProductManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string>('');
  const [showPublishForm, setShowPublishForm] = useState(false);

  // 获取商家信息和商品数据
  const fetchProducts = async () => {
    try {
      setLoading(true);

      // 获取当前商家（如果不存在会自动创建）
      console.log('[ProductManager] 开始获取商家信息...');
      const merchant = await merchantService.getCurrentMerchant();
      console.log('[ProductManager] 获取到的商家:', merchant);

      if (merchant) {
        setMerchantId(merchant.id);

        // 获取商家商品
        console.log('[ProductManager] 开始获取商品列表，商家ID:', merchant.id);
        const merchantProducts = await merchantService.getProducts(merchant.id);
        console.log('[ProductManager] 获取到的商品:', merchantProducts);

        setProducts(merchantProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          sales_count: p.sales_count,
          status: p.status,
          category: p.category,
          images: p.images
        })));
      } else {
        console.error('[ProductManager] 无法获取商家信息，merchant 为 null');
        toast.error('无法获取商家信息，请确保已登录');
      }
    } catch (error) {
      console.error('[ProductManager] 获取商品数据失败:', error);
      toast.error('获取商品数据失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 筛选商品
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // 统计数据
  const stats = {
    total: products.length,
    onSale: products.filter(p => p.status === 'active').length,
    offShelf: products.filter(p => p.status === 'inactive').length,
    lowStock: products.filter(p => p.stock < 20).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500 border-0">销售中</Badge>;
      case 'inactive':
        return <Badge className="bg-slate-500 border-0">已下架</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-500 border-0">缺货</Badge>;
      default:
        return <Badge className="border-0">{status}</Badge>;
    }
  };

  const handlePublishProduct = () => {
    console.log('点击发布商品按钮, merchantId:', merchantId);
    setShowPublishForm(true);
  };

  const handlePublishSuccess = () => {
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#5ba3d4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">商品管理</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">管理您的商品，支持上架、下架、编辑等操作</p>
        </div>
        <Button
          className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white border-0"
          onClick={handlePublishProduct}
          icon={<Plus className="w-4 h-4" />}
          iconPosition="left"
        >
          发布商品
        </Button>
      </div>

      {/* 统计卡片 - 优化背景色 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#5ba3d4]/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#5ba3d4]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">商品总数</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">销售中</p>
              <p className="text-xl font-bold text-emerald-400">{stats.onSale}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">已下架</p>
              <p className="text-xl font-bold text-slate-400">{stats.offShelf}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">库存预警</p>
              <p className="text-xl font-bold text-red-400">{stats.lowStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 - 优化背景色 */}
      <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 border border-[var(--border-primary)]">
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="搜索商品名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm"
          >
            <option value="all">全部状态</option>
            <option value="active">销售中</option>
            <option value="inactive">已下架</option>
            <option value="out_of_stock">缺货</option>
          </select>

          {/* 分类筛选 */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm"
          >
            <option value="all">全部分类</option>
            <option value="virtual">虚拟商品</option>
            <option value="physical">实物商品</option>
            <option value="service">服务</option>
          </select>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm"
          >
            <option value="newest">最新上架</option>
            <option value="price_asc">价格从低到高</option>
            <option value="price_desc">价格从高到低</option>
            <option value="sales">销量优先</option>
          </select>

          {/* 视图切换 */}
          <div className="flex items-center bg-[var(--bg-tertiary)] rounded-lg p-0.5 border border-[var(--border-primary)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid' 
                  ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list' 
                  ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 发布商品表单 */}
      {showPublishForm && merchantId && (
        <ProductPublishForm
          merchantId={merchantId}
          onClose={() => setShowPublishForm(false)}
          onSuccess={handlePublishSuccess}
        />
      )}

      {/* 商品列表 - 优化背景色 */}
      <div className="bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-[var(--text-primary)]">
            商品列表
            <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
              共 {filteredProducts.length} 件
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
              批量上架
            </Button>
            <Button variant="outline" size="sm" className="border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
              批量下架
            </Button>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">暂无商品</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">点击右上角"发布商品"按钮添加商品</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)] overflow-hidden hover:border-[var(--border-secondary)] transition-all group"
              >
                {/* 商品图片 */}
                <div className="aspect-[4/3] bg-[var(--bg-primary)] flex items-center justify-center relative">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-[var(--border-secondary)]" />
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
                  <p className="text-xs text-[var(--text-muted)] mb-1">{product.category}</p>
                  <h4 className="font-medium text-[var(--text-primary)] mb-2 line-clamp-1">{product.name}</h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-[#5ba3d4]">¥{product.price}</span>
                    <span className="text-sm text-[var(--text-muted)]">库存 {product.stock}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">销量 {product.sales_count}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
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
                className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all"
              >
                <div className="w-16 h-16 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="w-6 h-6 text-[var(--border-secondary)]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--text-muted)]">{product.category}</p>
                  <h4 className="font-medium text-[var(--text-primary)]">{product.name}</h4>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#5ba3d4]">¥{product.price}</p>
                  <p className="text-sm text-[var(--text-muted)]">库存 {product.stock}</p>
                </div>
                <div>{getStatusBadge(product.status)}</div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
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
