import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AudienceInsight, DeviceDistribution } from '@/services/creatorDashboardService';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { 
  Users, 
  Monitor, 
  Smartphone, 
  Tablet,
  PieChart as PieChartIcon
} from 'lucide-react';

interface AudienceInsightsProps {
  audienceData: AudienceInsight[];
  deviceData: DeviceDistribution[];
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

const AudienceInsights: React.FC<AudienceInsightsProps> = ({
  audienceData,
  deviceData,
  loading,
}) => {
  const { isDark } = useTheme();

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case '移动端':
        return <Smartphone className="w-4 h-4" />;
      case '桌面端':
        return <Monitor className="w-4 h-4" />;
      case '平板':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl border shadow-lg ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {data.ageGroup || data.device}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            占比: {data.percentage}%
          </p>
          {data.count !== undefined && (
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              数量: {data.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div 
            key={i}
            className={`p-6 rounded-2xl border animate-pulse ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}
          >
            <div className={`h-6 w-32 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
            <div className={`h-48 mt-4 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'
        } shadow-sm`}
      >
        <div className="flex items-center gap-2 mb-6">
          <Users className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
            受众年龄分布
          </h3>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={audienceData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="percentage"
                nameKey="ageGroup"
              >
                {audienceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {audienceData.map((item, index) => (
            <div key={item.ageGroup} className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
              />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {item.ageGroup} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'
        } shadow-sm`}
      >
        <div className="flex items-center gap-2 mb-6">
          <PieChartIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
            设备分布
          </h3>
        </div>

        <div className="space-y-4">
          {deviceData.map((device, index) => (
            <div key={device.device}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: COLORS[index % COLORS.length] }}>
                    {getDeviceIcon(device.device)}
                  </span>
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {device.device}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {device.percentage}%
                </span>
              </div>
              <div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${device.percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              主要访问设备
            </span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {deviceData[0]?.device || '-'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AudienceInsights;
