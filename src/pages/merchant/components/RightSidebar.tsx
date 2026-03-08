/**
 * 商家工作平台 - 右侧数据概览
 */
import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Users, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  CheckCircle2,
  Clock
} from 'lucide-react';

const RightSidebar: React.FC = () => {
  // 模拟数据
  const todayData = {
    sales: 1280,
    salesChange: 12.5,
    orders: 15,
    ordersChange: 8.3,
    visitors: 328,
    visitorsChange: -2.1,
    conversion: 4.6,
    conversionChange: 0.8,
  };

  const todoList = [
    { id: 1, title: '待发货订单', count: 3, type: 'warning' },
    { id: 2, title: '待处理售后', count: 2, type: 'danger' },
    { id: 3, title: '待回复评价', count: 5, type: 'info' },
    { id: 4, title: '库存预警', count: 1, type: 'warning' },
  ];

  const notifications = [
    { id: 1, title: '新订单提醒', content: '您有一笔新订单待处理', time: '5分钟前', read: false },
    { id: 2, title: '售后申请', content: '买家申请退款，请及时处理', time: '1小时前', read: false },
    { id: 3, title: '系统通知', content: '平台将于今晚进行系统维护', time: '2小时前', read: true },
  ];

  const getChangeIcon = (change: number) => {
    if (change >= 0) {
      return <ArrowUpRight className="w-3 h-3 text-emerald-400" />;
    }
    return <ArrowDownRight className="w-3 h-3 text-red-400" />;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-400' : 'text-red-400';
  };

  return (
    <div className="space-y-4 sticky top-6">
      {/* 今日数据概览 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#5ba3d4]" />
          <h3 className="font-semibold text-white">今日数据</h3>
        </div>
        
        <div className="space-y-4">
          {/* 销售额 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm text-gray-400">销售额</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white">¥{todayData.sales.toLocaleString()}</p>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(todayData.salesChange)}`}>
                {getChangeIcon(todayData.salesChange)}
                <span>{Math.abs(todayData.salesChange)}%</span>
              </div>
            </div>
          </div>

          {/* 订单数 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">订单数</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white">{todayData.orders}</p>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(todayData.ordersChange)}`}>
                {getChangeIcon(todayData.ordersChange)}
                <span>{Math.abs(todayData.ordersChange)}%</span>
              </div>
            </div>
          </div>

          {/* 访客数 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">访客数</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white">{todayData.visitors}</p>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(todayData.visitorsChange)}`}>
                {getChangeIcon(todayData.visitorsChange)}
                <span>{Math.abs(todayData.visitorsChange)}%</span>
              </div>
            </div>
          </div>

          {/* 转化率 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm text-gray-400">转化率</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white">{todayData.conversion}%</p>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(todayData.conversionChange)}`}>
                {getChangeIcon(todayData.conversionChange)}
                <span>{Math.abs(todayData.conversionChange)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 待办事项 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-white">待办事项</h3>
          </div>
          <span className="text-xs text-gray-500">共 {todoList.reduce((acc, item) => acc + item.count, 0)} 项</span>
        </div>
        
        <div className="space-y-2">
          {todoList.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg cursor-pointer hover:bg-[#1f1f1f] transition-colors"
            >
              <span className="text-sm text-gray-300">{item.title}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                item.type === 'danger' 
                  ? 'bg-red-500/20 text-red-400' 
                  : item.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {item.count}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 消息通知 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#5ba3d4]" />
            <h3 className="font-semibold text-white">消息通知</h3>
          </div>
          <button className="text-xs text-[#5ba3d4] hover:text-[#7ab8e0]">
            查看全部
          </button>
        </div>
        
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${
                notification.read 
                  ? 'bg-[#1a1a1a] border-[#2a2a2a]' 
                  : 'bg-[#5ba3d4]/5 border-[#5ba3d4]/20'
              }`}
            >
              <div className="flex items-start gap-2">
                {notification.read ? (
                  <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-[#5ba3d4] mt-1.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{notification.content}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{notification.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="bg-gradient-to-br from-[#5ba3d4]/10 to-[#3d6a8a]/10 rounded-xl border border-[#5ba3d4]/20 p-4">
        <h3 className="font-semibold text-white mb-3">快捷入口</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-3 bg-[#141414]/50 rounded-lg text-sm text-gray-300 hover:bg-[#141414] hover:text-white transition-colors">
            发布商品
          </button>
          <button className="p-3 bg-[#141414]/50 rounded-lg text-sm text-gray-300 hover:bg-[#141414] hover:text-white transition-colors">
            订单发货
          </button>
          <button className="p-3 bg-[#141414]/50 rounded-lg text-sm text-gray-300 hover:bg-[#141414] hover:text-white transition-colors">
            售后处理
          </button>
          <button className="p-3 bg-[#141414]/50 rounded-lg text-sm text-gray-300 hover:bg-[#141414] hover:text-white transition-colors">
            数据报表
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
