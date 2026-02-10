import { useTheme } from '@/hooks/useTheme';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ScoreDistribution } from '@/services/organizerAnalyticsService';

interface DistributionChartProps {
  data: ScoreDistribution[];
  height?: number;
  showLegend?: boolean;
}

const COLORS = [
  '#10B981', // 优秀 - 绿色
  '#3B82F6', // 良好 - 蓝色
  '#F59E0B', // 一般 - 橙色
  '#EF4444', // 较差 - 红色
  '#6B7280', // 差 - 灰色
];

export function DistributionChart({
  data,
  height = 280,
  showLegend = true,
}: DistributionChartProps) {
  const { isDark } = useTheme();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          className={`
            p-3 rounded-xl border shadow-lg
            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          `}
        >
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {item.score_range}
          </p>
          <p className="text-lg font-bold" style={{ color: payload[0].color }}>
            {item.count} 作品
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            占比 {item.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="count"
          nameKey="score_range"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke={isDark ? '#1F2937' : '#FFFFFF'}
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={<CustomLegend />} />}
      </PieChart>
    </ResponsiveContainer>
  );
}
