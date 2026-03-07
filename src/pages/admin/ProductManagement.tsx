/**
 * 商品管理组件
 */
import React, { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { adminReviewProduct } from '@/services/productService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table';
import { CheckCircle, XCircle, Search, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ProductManagement: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_sale':
        return <Badge className="bg-green-500">销售中</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">待审核</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500">已批准</Badge>;
      case 'off_shelf':
        return <Badge className="bg-gray-500">已下架</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">商品总数</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">销售中</p>
          <p className="text-2xl font-bold text-green-600">
            {products.filter((p) => p.status === 'on_sale').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">待审核</p>
          <p className="text-2xl font-bold text-yellow-600">
            {products.filter((p) => p.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索商品..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">全部状态</option>
          <option value="pending">待审核</option>
          <option value="on_sale">销售中</option>
          <option value="off_shelf">已下架</option>
        </select>
      </div>

      {/* 商品列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>库存</TableHead>
              <TableHead>销量</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.cover_image ? (
                        <img
                          src={product.cover_image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200" />
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>¥{product.price.toLocaleString()}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.sold_count}</TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>
                    {product.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReview(product.id, 'approved')}
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReview(product.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductManagement;
