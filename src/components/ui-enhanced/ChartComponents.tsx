import React from 'react';
import { motion } from 'framer-motion';

interface ChartDataPointProps {
  x: number;
  y: number;
  isActive?: boolean;
  color?: string;
  size?: number;
  onHover?: () => void;
  onLeave?: () => void;
}

export const ChartDataPoint: React.FC<ChartDataPointProps> = ({
  x,
  y,
  isActive = false,
  color = '#c21807',
  size = 5,
  onHover,
  onLeave
}) => {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={isActive ? size + 3 : size}
      fill={isActive ? color : '#fff'}
      stroke={isActive ? color : '#e5e7eb'}
      strokeWidth={2}
      whileHover={{ r: size + 5, fill: color }}
      animate={{ r: isActive ? size + 3 : size }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
    />
  );
};

interface BarChartItemProps {
  x: number;
  y: number;
  width: number;
  height: number;
  delay?: number;
  color?: string;
  label?: string;
  value?: string | number;
  onHover?: () => void;
  onLeave?: () => void;
}

export const BarChartItem: React.FC<BarChartItemProps> = ({
  x,
  y,
  width,
  height,
  delay = 0,
  color = '#c21807',
  label,
  value,
  onHover,
  onLeave
}) => {
  return (
    <g>
      <motion.rect
        x={x}
        y={y + height}
        width={width}
        height={0}
        initial={{ height: 0, y: y + height }}
        animate={{ height: height, y: y }}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        whileHover={{ scale: 1.05, transformOrigin: 'bottom' }}
        fill={color}
        rx={4}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="cursor-pointer"
      />
      {label && (
        <text
          x={x + width / 2}
          y={y + height + 20}
          textAnchor="middle"
          className="text-xs fill-gray-500 dark:fill-gray-400"
        >
          {label}
        </text>
      )}
      {value && (
        <text
          x={x + width / 2}
          y={y - 5}
          textAnchor="middle"
          className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
        >
          {value}
        </text>
      )}
    </g>
  );
};

interface LineChartProps {
  data: { x: number; y: number; label?: string }[];
  width: number;
  height: number;
  color?: string;
  showPoints?: boolean;
  showGrid?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width,
  height,
  color = '#c21807',
  showPoints = true,
  showGrid = true
}) => {
  if (data.length === 0) return null;

  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const padding = 40;

  const xScale = (value: number) => padding + ((value - data[0].x) / (data[data.length - 1].x - data[0].x)) * (width - 2 * padding);
  const yScale = (value: number) => height - padding - ((value - minY) / (maxY - minY)) * (height - 2 * padding);

  const pathData = data.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`
  ).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showGrid && (
        <g className="grid-lines">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={padding}
              y1={padding + ratio * (height - 2 * padding)}
              x2={width - padding}
              y2={padding + ratio * (height - 2 * padding)}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}
        </g>
      )}

      <motion.path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {showPoints && data.map((d, i) => (
        <ChartDataPoint
          key={i}
          x={xScale(d.x)}
          y={yScale(d.y)}
          color={color}
        />
      ))}
    </svg>
  );
};

interface BarChartProps {
  data: { label: string; value: number }[];
  width: number;
  height: number;
  color?: string;
  showValues?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width,
  height,
  color = '#c21807',
  showValues = true
}) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const padding = { top: 40, right: 20, bottom: 60, left: 20 };
  const barWidth = (width - padding.left - padding.right) / data.length * 0.7;
  const gap = (width - padding.left - padding.right) / data.length * 0.3;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((item, index) => {
        const x = padding.left + index * (barWidth + gap);
        const barHeight = (item.value / maxValue) * (height - padding.top - padding.bottom);
        const y = height - padding.bottom - barHeight;

        return (
          <BarChartItem
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            delay={index * 0.1}
            color={color}
            label={item.label}
            value={showValues ? item.value : undefined}
          />
        );
      })}
    </svg>
  );
};

export default {
  ChartDataPoint,
  BarChartItem,
  LineChart,
  BarChart
};
