/**
 * 商城后台管理 - 主页面
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import BrandManagement from './BrandManagement';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import AuthorizationManagement from './AuthorizationManagement';

const MarketplaceAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('brands');

  // 检查是否为管理员
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">您没有权限访问此页面</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回管理后台
              </button>
              <h1 className="text-xl font-bold text-gray-900">🏪 商城管理</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              品牌方管理
            </TabsTrigger>
            <TabsTrigger value="authorizations" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              授权管理
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              商品管理
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              订单管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brands">
            <BrandManagement />
          </TabsContent>

          <TabsContent value="authorizations">
            <AuthorizationManagement />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketplaceAdminPage;
