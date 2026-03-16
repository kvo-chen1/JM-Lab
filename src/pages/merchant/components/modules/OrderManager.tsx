/**
 * 商家工作平台 - 交易管理模块
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Truck, 
  Eye,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { merchantService, Order } from '@/services/merchantService';
import { toast } from 'sonner';

// 发货对话框组件
interface ShipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shippingInfo: { company: string; trackingNumber: string }) => void;
  orderNo: string;
}

const ShipModal: React.FC<ShipModalProps> = ({ isOpen, onClose, onConfirm, orderNo }) => {
  const [company, setCompany] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !trackingNumber.trim()) {
      toast.error('请填写完整的物流信息');
      return;
    }
    setLoading(true);
    try {
      await onConfirm({ company: company.trim(), trackingNumber: trackingNumber.trim() });
      setCompany('');
      setTrackingNumber('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">订单发货</h3>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-[var(--text-muted)] mb-4">
          订单号: <span className="text-[var(--text-secondary)]">{orderNo}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              物流公司 <span className="text-red-500">*</span>
            </label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="例如：顺丰速运、中通快递"
              className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              运单号 <span className="text-red-500">*</span>
            </label>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="请输入运单号"
              className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)]"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                '确认发货'
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const OrderManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string>('');
  
  // 发货对话框状态
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const merchant = await merchantService.getCurrentMerchant();
        console.log('[OrderManager] 当前商户:', merchant);
        if (merchant) {
          setMerchantId(merchant.id);
          console.log('[OrderManager] 商户ID:', merchant.id, 'user_id:', (merchant as any).user_id);
          // 使用 merchant.id 查询订单，因为订单表的 seller_id 存储的是 merchant.id
          const merchantOrders = await merchantService.getOrders(merchant.id);
          console.log('[OrderManager] 获取到的订单:', merchantOrders);
          setOrders(merchantOrders);
        }
      } catch (error) {
        console.error('获取订单数据失败:', error);
        toast.error('获取订单数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleShipClick = (order: Order) => {
    setSelectedOrder(order);
    setShipModalOpen(true);
  };

  const handleShipConfirm = async (shippingInfo: { company: string; trackingNumber: string }) => {
    if (!selectedOrder) return;
    
    try {
      await merchantService.shipOrder(selectedOrder.id, shippingInfo);
      toast.success('发货成功');
      
      // 更新本地订单状态
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { 
              ...order, 
              status: 'shipped',
              shipping_company: shippingInfo.company,
              tracking_number: shippingInfo.trackingNumber,
              shipped_at: new Date().toISOString()
            }
          : order
      ));
      
      setShipModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('发货失败:', error);
      toast.error('发货失败，请重试');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items?.some(item => item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending_payment').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Badge className="bg-amber-500 border-0">待付款</Badge>;
      case 'paid':
        return <Badge className="bg-blue-500 border-0">待发货</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-500 border-0">已发货</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500 border-0">已完成</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-500 border-0">已取消</Badge>;
      default:
        return <Badge className="border-0">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#5ba3d4]" />
        <span className="ml-2 text-[var(--text-muted)]">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">交易管理</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">管理订单、处理发货、跟踪物流</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">订单总数</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">待付款</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">待发货</p>
          <p className="text-2xl font-bold text-blue-400">{stats.paid}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">已发货</p>
          <p className="text-2xl font-bold text-purple-400">{stats.shipped}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">已完成</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="搜索订单号、买家或商品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm"
          >
            <option value="all">全部状态</option>
            <option value="pending_payment">待付款</option>
            <option value="paid">待发货</option>
            <option value="shipped">已发货</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">订单号</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">买家</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">商品</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">金额</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">下单时间</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{order.order_no}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{order.customer_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {order.items && order.items.length > 0 
                        ? order.items.map(item => item.product_name).join(', ')
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#5ba3d4]">¥{order.total_amount}</td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status === 'paid' && (
                          <Button 
                            size="sm" 
                            className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
                            onClick={() => handleShipClick(order)}
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            发货
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 发货对话框 */}
      <ShipModal
        isOpen={shipModalOpen}
        onClose={() => {
          setShipModalOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleShipConfirm}
        orderNo={selectedOrder?.order_no || ''}
      />
    </div>
  );
};

export default OrderManager;
