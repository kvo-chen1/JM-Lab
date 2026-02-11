import { motion } from 'framer-motion';

interface RadarData {
  label: string;
  value: number;
  max: number;
}

interface RadarChartProps {
  data: RadarData[];
  size?: number;
  isDark?: boolean;
}

export default function RadarChart({ data, size = 200, isDark = false }: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.35;
  const levels = 5;

  // Calculate point coordinates
  const getPoint = (index: number, value: number, max: number) => {
    const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Generate polygon points
  const polygonPoints = data.map((d, i) => {
    const point = getPoint(i, d.value, d.max);
    return `${point.x},${point.y}`;
  }).join(' ');

  // Generate grid lines
  const gridLines = [];
  for (let i = 1; i <= levels; i++) {
    const levelRadius = (radius * i) / levels;
    const points = data.map((_, index) => {
      const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
      return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
    }).join(' ');
    gridLines.push(points);
  }

  // Generate axis lines
  const axisLines = data.map((_, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    return {
      x2: center + radius * Math.cos(angle),
      y2: center + radius * Math.sin(angle),
    };
  });

  // Calculate score
  const totalScore = Math.round(data.reduce((sum, d) => sum + (d.value / d.max) * 100, 0) / data.length);

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="transform -rotate-0">
        {/* Background circles */}
        {gridLines.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke={isDark ? '#374151' : '#e5e7eb'}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={line.x2}
            y2={line.y2}
            stroke={isDark ? '#374151' : '#e5e7eb'}
            strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <motion.polygon
          points={polygonPoints}
          fill="url(#gradient)"
          stroke="#ef4444"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const point = getPoint(i, d.value, d.max);
          return (
            <motion.circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            />
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Score */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <div className="text-3xl font-bold text-red-500">{totalScore}</div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>综合评分</div>
        </motion.div>
      </div>

      {/* Labels */}
      {data.map((d, i) => {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        const labelRadius = radius + 25;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        
        return (
          <motion.div
            key={i}
            className={`absolute text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            {d.label}
          </motion.div>
        );
      })}
    </div>
  );
}
