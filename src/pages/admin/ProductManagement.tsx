import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import productService, { Product, ProductCategory, ExchangeRecord } from '@/services/productService';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ShoppingBag,
  Package
} from 'lucide-react';

// 订单状态类型
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

// 订单接口
interface Order {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string;
  username: string;
  points: number;
  quantity: number;
  status: OrderStatus;
  created_at: number;
  completed_at?: number;
  product_image?: string;
  user_email?: string;
  contact_phone?: string;
  shipping_address?: string;
  admin_notes?: string;
  processed_at?: string;
  processed_by?: string;
}

// 销售统计接口
interface SalesStats {
  totalSales: number;
  totalPoints: number;
  todaySales: number;
  todayPoints: number;
  pendingOrders: number;
  lowStockProducts: number;
}

// 产品分类接口
interface ProductCategoryUI {
  id: string;
  name: string;
  description: string;
  product_count: number;
  color: string;
}

const ProductManagement: React.FC = () => {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentView, setCurrentView] = useState<'products' | 'orders' | 'stats' | 'categories'>('products');
  
  // 表单数据
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    points: 0,
    stock: 0,
    status: 'active',
    category: 'virtual',
    tags: [],
    imageUrl: '',
    isFeatured: false
  });
  
  // 筛选和搜索
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 批量操作
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  
  // 统计数据
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalPoints: 0,
    todaySales: 0,
    todayPoints: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });
  
  // 订单数据
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderPageSize] = useState(10);
  const [adminNotes, setAdminNotes] = useState('');

  // 订单统计数据
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    refunded: 0,
    totalPoints: 0,
    todayOrders: 0
  });

  // 分类数据
  const [categories, setCategories] = useState<ProductCategoryUI[]>([]);

  // 销售趋势数据
  const [salesTrend, setSalesTrend] = useState<{ date: string; count: number; points: number }[]>([]);

  // 热销商品数据
  const [topSellingProducts, setTopSellingProducts] = useState<{ productId: string; productName: string; productImage: string; points: number; totalSold: number }[]>([]);

  // 库存预警阈值
  const LOW_STOCK_THRESHOLD = 10;

  // 订单状态配置
  const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: any }> = {
    pending: {
      label: '待处理',
      color: '#f59e0b',
      bgColor: 'bg-yellow-100',
      icon: Clock
    },
    processing: {
      label: '处理中',
      color: '#3b82f6',
      bgColor: 'bg-blue-100',
      icon: Package
    },
    completed: {
      label: '已完成',
      color: '#10b981',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    },
    cancelled: {
      label: '已取消',
      color: '#6b7280',
      bgColor: 'bg-gray-100',
      icon: XCircle
    },
    refunded: {
      label: '已退款',
      color: '#ef4444',
      bgColor: 'bg-red-100',
      icon: RotateCcw
    }
  };

  // 统计卡片组件
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    trendValue
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
            }`}>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );

  // 加载订单统计数据
  const loadOrderStats = useCallback(async () => {
    try {
      const data = await productService.getOrderStats();
      setOrderStats(data);
    } catch (error) {
      console.error('加载订单统计失败:', error);
    }
  }, []);

  // 获取订单数据
  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const offset = (orderPage - 1) * orderPageSize;
      const response = await productService.getAllExchangeRecords({
        status: orderFilter === 'all' ? undefined : orderFilter,
        limit: orderPageSize,
        offset
      });

      // 转换数据格式
      const formattedOrders: Order[] = response.records.map(record => ({
        id: record.id,
        product_id: record.productId,
        product_name: record.productName,
        user_id: record.userId,
        username: record.userName || '未知用户',
        points: record.points,
        quantity: record.quantity,
        status: record.status as OrderStatus,
        created_at: new Date(record.date).getTime(),
        completed_at: record.status === 'completed' ? new Date(record.date).getTime() : undefined,
        product_image: record.productImage,
        user_email: record.userEmail,
        contact_phone: record.contactPhone,
        shipping_address: record.shippingAddress,
        admin_notes: record.adminNotes,
        processed_at: record.processedAt,
        processed_by: record.processedBy
      }));

      setOrders(formattedOrders);
      setTotalOrders(response.total);
    } catch (error) {
      console.error('获取订单数据失败:', error);
      toast.error('获取订单数据失败');
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [orderPage, orderPageSize, orderFilter]);

  // 计算统计数据
  const calculateStats = async (productList: Product[]) => {
    const lowStock = productList.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;

    try {
      // 并行获取所有统计数据
      const [orderStatsData, trendData, topProducts] = await Promise.all([
        productService.getOrderStats(),
        productService.getSalesTrend(7),
        productService.getTopSellingProducts(5)
      ]);

      // 计算今日积分
      const today = new Date().toISOString().split('T')[0];
      const todayStats = trendData.find(d => d.date === today);
      const todayPoints = todayStats?.points || 0;

      setStats({
        lowStockProducts: lowStock,
        totalSales: orderStatsData.completed,
        totalPoints: orderStatsData.totalPoints,
        todaySales: orderStatsData.todayOrders,
        todayPoints: todayPoints,
        pendingOrders: orderStatsData.pending
      });

      setSalesTrend(trendData);
      setTopSellingProducts(topProducts);
    } catch (error) {
      console.error('获取订单统计失败:', error);
      setStats(prev => ({
        ...prev,
        lowStockProducts: lowStock
      }));
    }
  };

  // 加载商品数据
  const fetchProducts = async () => {
    const allProducts = await productService.getAllProducts();
    setProducts(allProducts);
    await calculateStats(allProducts);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // 当切换到订单视图时加载订单数据
  useEffect(() => {
    if (currentView === 'orders') {
      fetchOrders();
      loadOrderStats();
    }
  }, [currentView, fetchOrders, loadOrderStats]);

  // 当订单筛选或页码变化时重新加载订单
  useEffect(() => {
    if (currentView === 'orders') {
      fetchOrders();
    }
  }, [orderFilter, orderPage, currentView, fetchOrders]);
  
  // 获取分类数据
  const fetchCategories = () => {
    setCategories([
      { id: '1', name: '虚拟商品', description: '数字产品和服务', product_count: 15, color: '#3B82F6' },
      { id: '2', name: '实物商品', description: '实体商品和周边', product_count: 28, color: '#EF4444' },
      { id: '3', name: '服务', description: '各类服务权益', product_count: 8, color: '#10B981' },
      { id: '4', name: '权益', description: '会员权益和特权', product_count: 12, color: '#F59E0B' }
    ]);
  };

  // 重置商品数据
  const handleResetProducts = async () => {
    if (window.confirm('确定要重置所有商品数据到默认值吗？这将清除所有自定义的商品。')) {
      try {
        // 删除所有现有商品
        const { error } = await supabaseAdmin
          .from('products')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) throw error;
        
        // 重新加载商品列表
        await fetchProducts();
        toast.success('商品数据已重置');
      } catch (error) {
        console.error('重置商品数据失败:', error);
        toast.error('重置商品数据失败');
      }
    }
  };

  // 打开添加商品模态框
  const handleAddProduct = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      description: '',
      points: 0,
      stock: 0,
      status: 'active',
      category: 'virtual' as ProductCategory,
      tags: [] as string[],
      imageUrl: '',
      isFeatured: false
    });
    setShowModal(true);
  };

  // 打开编辑商品模态框
  const handleEditProduct = (product: Product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      points: product.points,
      stock: product.stock,
      status: product.status,
      category: product.category,
      tags: [...product.tags] as string[],
      imageUrl: product.imageUrl,
      isFeatured: product.isFeatured
    });
    setShowModal(true);
  };

  // 保存商品
  const handleSaveProduct = async () => {
    try {
      let updatedProducts = [...products];
      if (isEditing && selectedProduct) {
        const updatedProduct = await productService.updateProduct(selectedProduct.id, formData);
        if (updatedProduct) {
          updatedProducts = products.map(p => p.id === selectedProduct.id ? updatedProduct : p);
          setProducts(updatedProducts);
          toast.success('商品更新成功');
        } else {
          toast.error('商品更新失败');
        }
      } else {
        const newProduct = await productService.addProduct(formData);
        if (newProduct) {
          updatedProducts = [...products, newProduct];
          setProducts(updatedProducts);
          toast.success('商品添加成功');
        } else {
          toast.error('商品添加失败');
        }
      }
      setShowModal(false);
      await calculateStats(updatedProducts);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // 删除商品
  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('确定要删除该商品吗？')) {
      const success = await productService.deleteProduct(productId);
      if (success) {
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        toast.success('商品删除成功');
        await calculateStats(updatedProducts);
      } else {
        toast.error('商品删除失败');
      }
    }
  };

  // 切换商品状态
  const toggleProductStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    const updatedProduct = await productService.updateProduct(product.id, { status: newStatus });
    if (updatedProduct) {
      setProducts(products.map(p => p.id === product.id ? updatedProduct : p));
      toast.success(`商品已${newStatus === 'active' ? '上架' : '下架'}`);
    }
  };
  
  // 批量上架
  const handleBatchActivate = () => {
    if (selectedProducts.size === 0) {
      toast.error('请先选择商品');
      return;
    }
    
    const updatedProducts = products.map(p => {
      if (selectedProducts.has(p.id)) {
        return { ...p, status: 'active' as const };
      }
      return p;
    });
    setProducts(updatedProducts);
    setSelectedProducts(new Set());
    setIsBatchMode(false);
    toast.success(`已批量上架 ${selectedProducts.size} 个商品`);
  };
  
  // 批量下架
  const handleBatchDeactivate = () => {
    if (selectedProducts.size === 0) {
      toast.error('请先选择商品');
      return;
    }
    
    const updatedProducts = products.map(p => {
      if (selectedProducts.has(p.id)) {
        return { ...p, status: 'inactive' as const };
      }
      return p;
    });
    setProducts(updatedProducts);
    setSelectedProducts(new Set());
    setIsBatchMode(false);
    toast.success(`已批量下架 ${selectedProducts.size} 个商品`);
  };
  
  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedProducts.size === 0) {
      toast.error('请先选择商品');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedProducts.size} 个商品吗？`)) {
      return;
    }

    const updatedProducts = products.filter(p => !selectedProducts.has(p.id));
    setProducts(updatedProducts);
    setSelectedProducts(new Set());
    setIsBatchMode(false);
    await calculateStats(updatedProducts);
    toast.success(`已批量删除 ${selectedProducts.size} 个商品`);
  };

  // 处理标签输入
  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      const newTag = value.split(',')[0].trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      e.target.value = '';
    }
  };

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // 切换商品选择
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };
  
  // 处理订单状态更新
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdatingOrder(true);
    try {
      const success = await productService.updateOrderStatus(
        orderId,
        newStatus,
        adminNotes,
        'admin'
      );

      if (success) {
        toast.success(`订单状态已更新为${orderStatusConfig[newStatus].label}`);
        setAdminNotes('');
        await fetchOrders();
        await loadOrderStats();

        // 更新选中的订单
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        toast.error('更新订单状态失败');
      }
    } catch (error) {
      console.error('更新订单状态失败:', error);
      toast.error('更新订单状态失败');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // 导出订单数据
  const handleExportOrders = () => {
    const headers = ['订单ID', '商品名称', '用户', '积分', '数量', '状态', '日期'];
    const rows = filteredOrders.map(order => [
      order.id,
      order.product_name,
      order.username || order.user_id,
      order.points,
      order.quantity,
      orderStatusConfig[order.status]?.label || order.status,
      new Date(order.created_at).toLocaleString('zh-CN')
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `订单数据_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('订单数据已导出');
  };

  // 格式化日期
  const formatOrderDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 订单搜索过滤
  const filteredOrders = orders.filter(order => {
    if (!orderSearchTerm) return true;
    const search = orderSearchTerm.toLowerCase();
    return (
      order.product_name?.toLowerCase().includes(search) ||
      order.username?.toLowerCase().includes(search) ||
      order.user_email?.toLowerCase().includes(search) ||
      order.id?.toLowerCase().includes(search)
    );
  });

  // 总页数
  const totalOrderPages = Math.ceil(totalOrders / orderPageSize);
  
  // 筛选商品
  const filteredProducts = products.filter(product => {
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && product.status !== statusFilter) return false;
    return true;
  });
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 获取状态样式
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-600';
      case 'inactive':
        return 'bg-gray-100 text-gray-600';
      case 'sold_out':
        return 'bg-red-100 text-red-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'completed':
        return 'bg-green-100 text-green-600';
      case 'cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '已上架',
      inactive: '已下架',
      sold_out: '已售罄',
      pending: '待处理',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  // 渲染统计视图
  const renderStatsView = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold">{stats.totalSales}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总销量</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.totalPoints}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总积分消耗</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.todaySales}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>今日销量</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-purple-600">{stats.todayPoints}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>今日积分</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>待处理订单</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-red-600">{stats.lowStockProducts}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>库存预警</div>
        </div>
      </div>
      
      {/* 销售趋势图表 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className="font-medium mb-4">销售趋势（近7天）</h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {salesTrend.length > 0 ? (
            (() => {
              const maxCount = Math.max(...salesTrend.map(d => d.count), 1);
              return salesTrend.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-red-600 rounded-t transition-all duration-500"
                    style={{ height: `${maxCount > 0 ? (data.count / maxCount) * 100 : 0}%`, minHeight: data.count > 0 ? '4px' : '0' }}
                    title={`${data.date}: ${data.count}单, ${data.points}积分`}
                  ></div>
                  <span className="text-xs text-gray-500">
                    {new Date(data.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                  </span>
                </div>
              ));
            })()
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* 热销商品排行 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className="font-medium mb-4">热销商品TOP5</h3>
        <div className="space-y-3">
          {topSellingProducts.length > 0 ? (
            topSellingProducts.map((product, index) => (
              <div key={product.productId} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <img src={product.productImage || 'https://via.placeholder.com/100'} alt={product.productName} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="font-medium">{product.productName}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{product.points} 积分</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{product.totalSold} 件</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>已售出</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无销售数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // 渲染订单视图
  const renderOrdersView = () => (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">订单管理</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            管理积分商城的兑换订单和处理售后
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportOrders}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
            } shadow-sm`}
          >
            <Download className="w-4 h-4" />
            导出数据
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { fetchOrders(); loadOrderStats(); }}
            disabled={isLoadingOrders}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
            } shadow-sm disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
            刷新
          </motion.button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总订单数"
          value={orderStats.total.toLocaleString()}
          icon={ShoppingBag}
          color="#8b5cf6"
          trend="up"
          trendValue={`+${orderStats.todayOrders} 今日`}
        />
        <StatCard
          title="待处理"
          value={orderStats.pending.toLocaleString()}
          icon={Clock}
          color="#f59e0b"
        />
        <StatCard
          title="已完成"
          value={orderStats.completed.toLocaleString()}
          icon={CheckCircle}
          color="#10b981"
        />
        <StatCard
          title="总积分消耗"
          value={orderStats.totalPoints.toLocaleString()}
          icon={CreditCard}
          color="#ef4444"
        />
      </div>

      {/* 筛选和搜索栏 */}
      <div className={`flex flex-col md:flex-row gap-4 ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-md`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号、商品名称、用户..."
            value={orderSearchTerm}
            onChange={(e) => setOrderSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-colors ${
              isDark
                ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600'
                : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-gray-200'
            }`}
          />
        </div>

        <div className="flex gap-3">
          <select
            value={orderFilter}
            onChange={(e) => {
              setOrderFilter(e.target.value as OrderStatus | 'all');
              setOrderPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm outline-none transition-colors ${
              isDark
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
            <option value="refunded">已退款</option>
          </select>
        </div>
      </div>

      {/* 订单列表和详情 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧订单列表 */}
        <div className="lg:col-span-2 space-y-4">
          {isLoadingOrders ? (
            <div className={`flex items-center justify-center py-16 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                暂无订单数据
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {filteredOrders.map((order, index) => {
                  const statusConfig = orderStatusConfig[order.status];
                  const StatusIcon = statusConfig?.icon || Clock;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedOrder(order);
                        setAdminNotes(order.admin_notes || '');
                      }}
                      className={`p-4 rounded-2xl cursor-pointer transition-all ${
                        selectedOrder?.id === order.id
                          ? isDark ? 'bg-gray-700 ring-2 ring-blue-500' : 'bg-white ring-2 ring-blue-500'
                          : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                      } shadow-md`}
                    >
                      <div className="flex gap-4">
                        {/* 商品图片 */}
                        <img
                          src={order.product_image || 'https://via.placeholder.com/100'}
                          alt={order.product_name}
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg truncate">{order.product_name}</h3>
                                <span className="text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {order.username || order.user_id}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig?.bgColor || 'bg-gray-100'}`}
                              style={{ color: statusConfig?.color }}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig?.label || order.status}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-red-500">
                                {order.points} 积分
                              </span>
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                x{order.quantity}
                              </span>
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {formatOrderDate(order.created_at)}
                              </span>
                            </div>

                            {/* 快捷操作按钮 */}
                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateOrderStatus(order.id, 'processing');
                                  }}
                                  disabled={isUpdatingOrder}
                                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors"
                                >
                                  开始处理
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateOrderStatus(order.id, 'cancelled');
                                  }}
                                  disabled={isUpdatingOrder}
                                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors"
                                >
                                  取消
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* 分页 */}
              {totalOrderPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                    disabled={orderPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      orderPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: Math.min(5, totalOrderPages) }, (_, i) => {
                    let pageNum;
                    if (totalOrderPages <= 5) {
                      pageNum = i + 1;
                    } else if (orderPage <= 3) {
                      pageNum = i + 1;
                    } else if (orderPage >= totalOrderPages - 2) {
                      pageNum = totalOrderPages - 4 + i;
                    } else {
                      pageNum = orderPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setOrderPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          orderPage === pageNum
                            ? 'bg-red-600 text-white'
                            : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setOrderPage(p => Math.min(totalOrderPages, p + 1))}
                    disabled={orderPage === totalOrderPages}
                    className={`p-2 rounded-lg transition-colors ${
                      orderPage === totalOrderPages
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 右侧订单详情 */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div
                key={selectedOrder.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden sticky top-6`}
              >
                {/* 详情头部 */}
                <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedOrder.product_image || 'https://via.placeholder.com/100'}
                      alt={selectedOrder.product_name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-lg">{selectedOrder.product_name}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        订单 #{selectedOrder.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  {/* 状态标签 */}
                  <div className="mt-4">
                    {(() => {
                      const config = orderStatusConfig[selectedOrder.status];
                      const StatusIcon = config?.icon || Clock;
                      return (
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config?.bgColor || 'bg-gray-100'}`}
                          style={{ color: config?.color }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config?.label || selectedOrder.status}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* 订单信息 */}
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      订单信息
                    </p>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex justify-between mb-2">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>订单金额</span>
                        <span className="font-medium text-red-500">{selectedOrder.points} 积分</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>数量</span>
                        <span className="font-medium">{selectedOrder.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>下单时间</span>
                        <span className="font-medium">{formatOrderDate(selectedOrder.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 用户信息 */}
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      用户信息
                    </p>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{selectedOrder.username || selectedOrder.user_id}</span>
                      </div>
                      {selectedOrder.user_email && (
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{selectedOrder.user_email}</span>
                        </div>
                      )}
                      {selectedOrder.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">{selectedOrder.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 配送地址 */}
                  {selectedOrder.shipping_address && (
                    <div className="space-y-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        配送地址
                      </p>
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                          <span className="text-sm">{selectedOrder.shipping_address}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 管理员备注 */}
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      管理员备注
                    </p>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="添加订单处理备注..."
                      rows={3}
                      className={`w-full px-3 py-2 rounded-xl text-sm outline-none resize-none ${
                        isDark
                          ? 'bg-gray-700 text-white placeholder-gray-400'
                          : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* 操作按钮 */}
                  <div className="space-y-2">
                    {selectedOrder.status === 'pending' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'processing')}
                          disabled={isUpdatingOrder}
                          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          开始处理
                        </motion.button>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                            disabled={isUpdatingOrder}
                            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            直接完成
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled')}
                            disabled={isUpdatingOrder}
                            className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            取消订单
                          </motion.button>
                        </div>
                      </>
                    )}

                    {selectedOrder.status === 'processing' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                          disabled={isUpdatingOrder}
                          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          标记完成
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'refunded')}
                          disabled={isUpdatingOrder}
                          className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          退款处理
                        </motion.button>
                      </>
                    )}

                    {(selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'refunded')}
                        disabled={isUpdatingOrder}
                        className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        退款处理
                      </motion.button>
                    )}
                  </div>

                  {/* 处理记录 */}
                  {(selectedOrder.processed_at || selectedOrder.processed_by) && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                      <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        处理记录
                      </p>
                      {selectedOrder.processed_by && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          处理人: {selectedOrder.processed_by}
                        </p>
                      )}
                      {selectedOrder.processed_at && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          处理时间: {new Date(selectedOrder.processed_at).toLocaleString('zh-CN')}
                        </p>
                      )}
                      {selectedOrder.admin_notes && (
                        <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          备注: {selectedOrder.admin_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-8 text-center`}
              >
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  选择一个订单查看详情
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
  
  // 渲染分类视图
  const renderCategoriesView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">商品分类管理</h3>
        <button 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          onClick={() => toast.info('添加分类功能开发中')}
        >
          <i className="fas fa-plus mr-2"></i>添加分类
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-start justify-between mb-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: cat.color }}
              >
                <i className="fas fa-folder text-xl"></i>
              </div>
              <div className="flex gap-2">
                <button 
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => toast.info('编辑分类功能开发中')}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                  onClick={() => toast.info('删除分类功能开发中')}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <h4 className="font-medium text-lg">{cat.name}</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{cat.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{cat.product_count}</span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>个商品</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">商品管理</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentView('products')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'products' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <i className="fas fa-box mr-2"></i>商品列表
            </button>
            <button
              onClick={() => setCurrentView('orders')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'orders' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <i className="fas fa-shopping-cart mr-2"></i>订单管理
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'stats' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <i className="fas fa-chart-bar mr-2"></i>销售统计
            </button>
            <button
              onClick={() => setCurrentView('categories')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'categories' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <i className="fas fa-tags mr-2"></i>分类管理
            </button>
          </div>
        </div>

        {currentView === 'products' ? (
          <>
            {/* 筛选和搜索 */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className={`relative flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
                <input
                  type="text"
                  placeholder="搜索商品..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
                <i className={`fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <option value="all">全部分类</option>
                <option value="virtual">虚拟商品</option>
                <option value="physical">实物商品</option>
                <option value="service">服务</option>
                <option value="rights">权益</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <option value="all">全部状态</option>
                <option value="active">已上架</option>
                <option value="inactive">已下架</option>
                <option value="sold_out">已售罄</option>
              </select>
              <button
                onClick={handleAddProduct}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>添加商品
              </button>
            </div>
            
            {/* 批量操作 */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className={`text-sm px-3 py-1 rounded ${isBatchMode ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                >
                  批量模式
                </button>
                {isBatchMode && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm px-3 py-1 rounded bg-blue-600 text-white"
                  >
                    全选
                  </button>
                )}
              </div>
              {isBatchMode && selectedProducts.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleBatchActivate}
                    className="text-sm px-3 py-1 rounded bg-green-600 text-white"
                  >
                    批量上架
                  </button>
                  <button
                    onClick={handleBatchDeactivate}
                    className="text-sm px-3 py-1 rounded bg-yellow-600 text-white"
                  >
                    批量下架
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="text-sm px-3 py-1 rounded bg-red-600 text-white"
                  >
                    批量删除
                  </button>
                </div>
              )}
            </div>

            {/* 商品列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden ${product.stock <= LOW_STOCK_THRESHOLD && product.stock > 0 ? 'ring-2 ring-yellow-500' : ''}`}
                >
                  {/* 批量选择 */}
                  {isBatchMode && (
                    <div className="p-2 border-b border-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-4 h-4 rounded"
                      />
                    </div>
                  )}
                  
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {/* 库存预警标记 */}
                    {product.stock <= LOW_STOCK_THRESHOLD && product.stock > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                        库存不足
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        已售罄
                      </div>
                    )}
                  </div>
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
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-sm ${product.stock <= LOW_STOCK_THRESHOLD && product.stock > 0 ? 'text-yellow-600 font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        库存：{product.stock}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(product.status)}`}>
                        {getStatusName(product.status)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <i className="fas fa-edit mr-1"></i>编辑
                      </button>
                      <button
                        onClick={() => toggleProductStatus(product)}
                        className={`flex-1 ${product.status === 'active' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-2 rounded-lg text-sm transition-colors`}
                      >
                        {product.status === 'active' ? '下架' : '上架'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <i className="fas fa-trash mr-1"></i>删除
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 无商品提示 */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <i className="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-medium mb-2">暂无商品</h3>
                <p className="opacity-70">点击上方按钮添加新商品</p>
              </div>
            )}
          </>
        ) : currentView === 'orders' ? (
          renderOrdersView()
        ) : currentView === 'stats' ? (
          renderStatsView()
        ) : (
          renderCategoriesView()
        )}

        {/* 商品模态框 */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">{isEditing ? '编辑商品' : '添加商品'}</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">商品名称</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">所需积分</label>
                      <input
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                        className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">库存数量</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">商品分类</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                        className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                        required
                      >
                        <option value="virtual">虚拟商品</option>
                        <option value="physical">实物商品</option>
                        <option value="service">服务</option>
                        <option value="rights">权益</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">商品状态</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'sold_out' })}
                        className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                        required
                      >
                        <option value="active">已上架</option>
                        <option value="inactive">已下架</option>
                        <option value="sold_out">已售罄</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">商品图片URL</label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">商品描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                      rows={3}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">商品标签（逗号分隔）</label>
                    <input
                      type="text"
                      placeholder="输入标签并按逗号分隔"
                      onBlur={handleTagInput}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center`}>
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-xs hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {isEditing ? '保存修改' : '添加商品'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductManagement;
