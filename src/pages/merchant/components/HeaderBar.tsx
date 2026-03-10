/**
 * 商家工作平台 - 顶部商家信息栏
 */
import React from 'react';
import { Store, Settings, Bell, User, TrendingUp, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const HeaderBar: React.FC = () => {
  // 模拟商家数据（后续从API获取）
  const merchantInfo = {
    name: '津门文创旗舰店',
    logo: null,
    status: 'approved',
    todaySales: 1280,
    todayOrders: 15,
    todayVisitors: 328,
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
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                  营业中
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">店铺ID: SH20240308001</p>
            </div>
          </div>

          {/* 中间：今日数据概览 */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">今日销售额</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">¥{merchantInfo.todaySales.toLocaleString()}</p>
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
          </div>

          {/* 右侧：快捷操作 */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              <Bell className="w-4 h-4 mr-2" />
              消息
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              <User className="w-4 h-4 mr-2" />
              个人中心
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
