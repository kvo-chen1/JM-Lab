/**
 * 文创商城商品管理组件 - 深色主题
 */
import React, { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { adminReviewProduct } from '@/services/productService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Loader2, 
  Package, 
  Grid3X3,
  List,
  Plus,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// 商品分类数据
const CATEGORIES = [
  { id: 'all', name: '全部商品', count: 6 },
  { id: 'clothing', name: '服饰配饰', count: 1 },
  { id: 'stationery', name: '文具用品', count: 2 },
  { id: 'toys', name: '毛绒玩具', count: 1 },
  { id: 'electronics', name: '数码配件', count: 2 },
];

// 状态选项
const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态', count: 6 },
  { value: 'on_sale', label: '销售中', count: 6, color: 'bg-emerald-500' },
  { value: 'pending', label: '待审核', count: 0, color: 'bg-amber-500' },
  { value: 'off_shelf', label: '已下架', count: 0, color: 'bg-slate-400' },
];

const MarketplaceProductManagement: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('newest');

  const { products, count, loading, refetch } = useProducts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50,
  });

  // 审核商品
  const handleReview = async (productId: string, status: 'approved' | 'rejected') => {
    try {
      const result = await adminReviewProduct(productId, status);
      if (result.data) {
        toast.success(status === 'approved' ? '已通过审核' : '已拒绝');
        refetch();
      } else {
        toast.error('操作失败');
      }
    } catch (err) {
      toast.error('操作失败');
    }
  };

  // 筛选和排序商品
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(filter.toLowerCase());
      return nameMatch;
    });

    // 排序
    switch (sortBy) {
      case 'price_asc':
        result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
      default:
        result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, filter, sortBy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_sale':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-2 py-0.5 text-xs border-0">
            销售中
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-2 py-0.5 text-xs border-0">
            待审核
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-2 py-0.5 text-xs border-0">
            已批准
          </Badge>
        );
      case 'off_shelf':
        return (
          <Badge className="bg-slate-500 hover:bg-slate-600 text-white font-medium px-2 py-0.5 text-xs border-0">
            已下架
          </Badge>
        );
      default:
        return <Badge className="px-2 py-0.5 text-xs border-0">{status}</Badge>;
    }
  };

  // 商品卡片组件
  const ProductCard = ({ product }: { product: any }) => (
    <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-sm hover:border-[#3a3a3a] hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {/* 商品图片 */}
      <div className="relative aspect-[4/3] bg-[#1a1a1a] overflow-hidden">
        {product.cover_image ? (
          <img
            src={product.cover_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-[#3a3a3a]" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          {getStatusBadge(product.status)}
        </div>
        {product.stock < 20 && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">
              库存紧张
            </span>
          </div>
        )}
      </div>
      
      {/* 商品信息 */}
      <div className="p-3">
        <h3 className="font-medium text-white text-sm mb-1 line-clamp-1" title={product.name}>
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">
          {product.description || '暂无描述'}
        </p>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-bold text-white">
            ¥{product.price?.toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">
            库存 {product.stock}
          </span>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
          >
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-gray-500 hover:text-white hover:bg-[#2a2a2a]"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">商品管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">管理文创商城的所有商品</p>
        </div>
        <Button className="bg-white hover:bg-gray-100 text-black h-9 font-medium">
          <Plus className="w-4 h-4 mr-2" />
          添加商品
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="搜索商品名称..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 h-9 text-sm bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#3a3a3a]"
              />
            </div>
          </div>

          {/* 分类筛选 */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm bg-[#1a1a1a] text-white hover:border-[#3a3a3a] focus:border-[#3a3a3a] transition-all cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[#1a1a1a]">
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm bg-[#1a1a1a] text-white hover:border-[#3a3a3a] focus:border-[#3a3a3a] transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value} className="bg-[#1a1a1a]">
                {status.label} ({status.count})
              </option>
            ))}
          </select>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm bg-[#1a1a1a] text-white hover:border-[#3a3a3a] focus:border-[#3a3a3a] transition-all cursor-pointer"
          >
            <option value="newest" className="bg-[#1a1a1a]">最新上架</option>
            <option value="price_asc" className="bg-[#1a1a1a]">价格从低到高</option>
            <option value="price_desc" className="bg-[#1a1a1a]">价格从高到低</option>
          </select>

          {/* 视图切换 */}
          <div className="flex items-center bg-[#1a1a1a] rounded-lg p-0.5 border border-[#2a2a2a]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'grid' 
                  ? 'bg-[#2a2a2a] text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${
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
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">
            商品列表
            <span className="ml-2 text-sm font-normal text-gray-500">
              共 {filteredProducts.length} 件
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
            <p className="text-gray-500 mt-2 text-sm">加载中...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-[#1a1a1a] rounded-full p-3 mb-3">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm font-medium">暂无商品数据</p>
            <p className="text-gray-600 text-xs mt-1">请尝试调整筛选条件</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg hover:bg-[#1f1f1f] transition-colors border border-[#2a2a2a]"
              >
                <div className="w-12 h-12 rounded bg-[#141414] flex items-center justify-center border border-[#2a2a2a]">
                  {product.cover_image ? (
                    <img 
                      src={product.cover_image} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{product.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{product.description || '暂无描述'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white text-sm">¥{product.price?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">库存 {product.stock}</p>
                </div>
                <div>{getStatusBadge(product.status)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceProductManagement;
