import React from 'react';
import { useTheme } from '@/hooks/useTheme';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
}) => {
  const { isDark } = useTheme();
  const currentValue = value[0] ?? min;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onValueChange([newValue]);
  };

  return (
    <div className={`relative w-full h-5 flex items-center ${className}`}>
      {/* 轨道背景 */}
      <div
        className={`absolute w-full h-2 rounded-full ${
          isDark ? 'bg-gray-700' : 'bg-gray-200'
        }`}
      />
      {/* 已填充部分 */}
      <div
        className="absolute h-2 rounded-full bg-violet-500"
        style={{ width: `${percentage}%` }}
      />
      {/* 滑块输入 */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className="absolute w-full h-5 opacity-0 cursor-pointer"
      />
      {/* 可视化滑块 */}
      <div
        className="absolute w-4 h-4 bg-white rounded-full shadow-md border-2 border-violet-500 pointer-events-none transition-transform"
        style={{
          left: `calc(${percentage}% - 8px)`,
        }}
      />
    </div>
  );
};

export default Slider;
