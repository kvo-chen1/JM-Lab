/**
 * 商家工作平台 - 数据中心模块
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// 模拟图表数据
const salesData = [
  { date: '03/01', sales: 1200, orders: 8 },
  { date: '03/02', sales: 1800, orders: 12 },
  { date: '03/03', sales: 1500, orders: 10 },
  { date: '03/04', sales: 2200, orders: 15 },
  { date: '03/05', sales: 1900, orders: 13 },
  { date: '03/06', sales: 2500, orders: 18 },
  { date: '03/07', sales: 2100, orders: 14 },
];

const productRanking = [
  { id: 1, name: '津脉智坊定制笔记本', sales: 128, revenue: 38400 },
  { id: 2, name: '天津文化明信片套装', sales: 256, revenue: 51200 },
  { id: 3, name: '智能保温杯', sales: 89, revenue: 53400 },
  { id: 4, name: '无线充电宝', sales: 67, revenue: 80400 },
  { id: 5, name: '津小脉文创 T 恤', sales: 45, revenue: 22500 },
];

const DataCenter: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7days');

  const stats = {
    totalSales: 13200,
    salesChange: 23.5,
    totalOrders: 90,
    ordersChange: 15.2,
    totalVisitors: 2156,
    visitorsChange: -5.8,
    avgOrderValue: 147,
    aovChange: 7.2,
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-400' : 'text-red-400';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">数据中心</h2>
          <p className="text-sm text-gray-500 mt-0.5">查看店铺运营数据和分析报表</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 bg-[#1a1a1a] text-white text-sm"
          >
            <option value="today">今日</option>
            <option value="7days">近7天</option>
            <option value="30days">近30天</option>
            <option value="90days">近90天</option>
          </select>
          <Button variant="outline" className="border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 核心数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-xl p-5 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.salesChange)}`}>
              {getChangeIcon(stats.salesChange)}
              <span>{Math.abs(stats.salesChange)}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">总销售额</p>
          <p className="text-2xl font-bold text-white">¥{stats.totalSales.toLocaleString()}</p>
        </div>

        <div className="bg-[#141414] rounded-xl p-5 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.ordersChange)}`}>
              {getChangeIcon(stats.ordersChange)}
              <span>{Math.abs(stats.ordersChange)}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">总订单数</p>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
        </div>

        <div className="bg-[#141414] rounded-xl p-5 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.visitorsChange)}`}>
              {getChangeIcon(stats.visitorsChange)}
              <span>{Math.abs(stats.visitorsChange)}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">访客数</p>
          <p className="text-2xl font-bold text-white">{stats.totalVisitors}</p>
        </div>

        <div className="bg-[#141414] rounded-xl p-5 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.aovChange)}`}>
              {getChangeIcon(stats.aovChange)}
              <span>{Math.abs(stats.aovChange)}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">客单价</p>
          <p className="text-2xl font-bold text-white">¥{stats.avgOrderValue}</p>
        </div>
      </div>

      {/* 销售趋势图 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white">销售趋势</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#5ba3d4]" />
              <span className="text-sm text-gray-400">销售额</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-sm text-gray-400">订单数</span>
            </div>
          </div>
        </div>

        {/* 简化的柱状图 */}
        <div className="h-64 flex items-end gap-2">
          {salesData.map((item, index) => {
            const maxSales = Math.max(...salesData.map(d => d.sales));
            const height = (item.sales / maxSales) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex gap-1 items-end justify-center" style={{ height: '200px' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="w-4 bg-[#5ba3d4] rounded-t"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.orders / 20) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.05, duration: 0.5 }}
                    className="w-4 bg-emerald-400 rounded-t"
                  />
                </div>
                <span className="text-xs text-gray-500">{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 商品销售排行 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
        <h3 className="font-semibold text-white mb-4">商品销售排行</h3>
        <div className="space-y-3">
          {productRanking.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-3 bg-[#1a1a1a] rounded-lg"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                index < 3
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                  : 'bg-[#2a2a2a] text-gray-400'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{product.name}</p>
                <p className="text-sm text-gray-500">销量 {product.sales} 件</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#5ba3d4]">¥{product.revenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">销售额</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 流量来源分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
          <h3 className="font-semibold text-white mb-4">流量来源</h3>
          <div className="space-y-3">
            {[
              { source: '搜索', value: 45, color: 'bg-[#5ba3d4]' },
              { source: '推荐', value: 30, color: 'bg-emerald-400' },
              { source: '直接访问', value: 15, color: 'bg-amber-400' },
              { source: '其他', value: 10, color: 'bg-purple-400' },
            ].map((item) => (
              <div key={item.source} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-16">{item.source}</span>
                <div className="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <span className="text-sm text-white w-10 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
          <h3 className="font-semibold text-white mb-4">转化漏斗</h3>
          <div className="space-y-4">
            {[
              { stage: '浏览商品', value: 2156, color: 'bg-[#5ba3d4]' },
              { stage: '加入购物车', value: 486, color: 'bg-blue-400' },
              { stage: '提交订单', value: 156, color: 'bg-emerald-400' },
              { stage: '完成支付', value: 90, color: 'bg-amber-400' },
            ].map((item, index) => (
              <div key={item.stage} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">{item.stage}</span>
                  <span className="text-sm text-white">{item.value}</span>
                </div>
                <div className="h-8 bg-[#2a2a2a] rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / 2156) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`h-full ${item.color} rounded-lg`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCenter;
