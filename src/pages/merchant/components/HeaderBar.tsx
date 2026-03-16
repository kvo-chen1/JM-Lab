/**
 * 商家工作平台 - 顶部商家信息栏
 * 使用真实数据库数据
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Settings, Bell, User, TrendingUp, DollarSign, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { merchantService } from '@/services/merchantService';
import { toast } from 'sonner';

const HeaderBar: React.FC = () => {
  const navigate = useNavigate();
  const [merchantInfo, setMerchantInfo] = useState({
    name: '津门文创旗舰店',
    logo: null as string | null,
    status: 'approved',
    todaySales: 0,
    todayOrders: 0,
    todayVisitors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const merchant = await merchantService.getCurrentMerchant();
        if (merchant) {
          // 获取仪表盘统计数据
          const stats = await merchantService.getDashboardStats(merchant.id);
          setMerchantInfo({
            name: merchant.store_name || '津门文创旗舰店',
            logo: merchant.store_logo || null,
            status: merchant.status,
            todaySales: stats.today_sales || 0,
            todayOrders: stats.today_orders || 0,
            todayVisitors: stats.today_visitors || 0,
          });
        }
      } catch (error) {
        console.error('获取商家数据失败:', error);
        toast.error('获取商家数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return '营业中';
      case 'pending':
        return '审核中';
      case 'rejected':
        return '已拒绝';
      default:
        return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
      {/* 主信息栏 */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧：店铺信息 */}
          <div className="flex items-center gap-4">
            {/* 店铺Logo */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5ba3d4] to-[#3d6a8a] flex items-center justify-center">
              {merchantInfo.logo ? (
                <img 
                  src={merchantInfo.logo} 
                  alt={merchantInfo.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Store className="w-6 h-6 text-white" />
              )}
            </div>
            
            {/* 店铺名称和状态 */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">{merchantInfo.name}</h1>
                <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(merchantInfo.status)}`}>
                  {getStatusLabel(merchantInfo.status)}
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">店铺ID: SH20240308001</p>
            </div>
          </div>

          {/* 中间：今日数据概览 */}
          <div className="hidden md:flex items-center gap-8">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#5ba3d4]" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">今日销售额</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">¥{(merchantInfo?.todaySales || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">今日订单</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{merchantInfo.todayOrders} 单</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">今日访客</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{merchantInfo.todayVisitors} 人</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 右侧：快捷操作 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
              icon={<Bell className="w-4 h-4" />}
              iconPosition="left"
              onClick={() => navigate('/messages')}
            >
              消息
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
              icon={<Settings className="w-4 h-4" />}
              iconPosition="left"
              onClick={() => navigate('/settings')}
            >
              设置
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
              icon={<User className="w-4 h-4" />}
              iconPosition="left"
              onClick={() => navigate('/profile/edit')}
            >
              个人中心
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
